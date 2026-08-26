import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'

export type Endereco = {
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

export const enderecoVazio: Endereco = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
}

// Monta um texto de exibição parecido com o que vem do autocompletar (`sugestao.descricao`) —
// usado quando o endereço chega pronto de outro lugar (ex: GPS), sem passar pela busca normal.
function formatarEnderecoResumido(endereco: Endereco): string {
  const partes = [
    [endereco.logradouro, endereco.numero].filter(Boolean).join(', '),
    endereco.bairro,
    [endereco.cidade, endereco.estado].filter(Boolean).join(' - '),
  ].filter(Boolean)

  return partes.join(', ')
}

type Sugestao = { placeId: string; descricao: string }

type Props = {
  titulo: string
  valores: Endereco
  onChange: (endereco: Endereco) => void
}

// Campo de endereço com autocomplete via API (mesma lógica do EnderecoFields.jsx do front-end
// web) — o usuário digita e escolhe da lista, e a gente preenche logradouro/número/bairro/
// cidade/estado sozinho a partir da sugestão escolhida.
export default function EnderecoFields({ titulo, valores, onChange }: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [texto, setTexto] = useState('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [mostrarLista, setMostrarLista] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [resolvido, setResolvido] = useState(Boolean(valores.logradouro))
  const [erro, setErro] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }, [])

  // Sincroniza quando o PAI preenche `valores` de fora (ex: auto-preencher a origem via GPS) —
  // só entra em ação nesse caso específico (texto ainda vazio), porque o fluxo normal de digitar/
  // selecionar já mantém texto/resolvido sincronizados sozinho, sem precisar desse efeito.
  useEffect(() => {
    if (valores.logradouro && !texto) {
      setTexto(formatarEnderecoResumido(valores))
      setResolvido(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valores.logradouro])

  function handleDigitar(novoTexto: string) {
    setTexto(novoTexto)
    setErro('')

    if (resolvido) {
      setResolvido(false)
      onChange({ ...enderecoVazio })
    }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (novoTexto.trim().length < 3) {
      setSugestoes([])
      setMostrarLista(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true)

      try {
        const { data } = await api.get('/Enderecos/autocompletar', { params: { texto: novoTexto } })
        setSugestoes(data)
        setMostrarLista(true)
      } catch (error) {
        setErro(extrairMensagemErro(error))
      } finally {
        setBuscando(false)
      }
    }, 350)
  }

  async function handleSelecionar(sugestao: Sugestao) {
    setMostrarLista(false)
    setTexto(sugestao.descricao)
    setBuscando(true)
    setErro('')

    try {
      const { data } = await api.get('/Enderecos/detalhes', { params: { placeId: sugestao.placeId } })
      onChange({
        logradouro: data.logradouro,
        numero: data.numero || 'S/N',
        complemento: '',
        bairro: data.bairro || '',
        cidade: data.cidade,
        estado: data.estado,
      })
      setResolvido(true)
    } catch (error) {
      setErro(extrairMensagemErro(error))
      setResolvido(false)
    } finally {
      setBuscando(false)
    }
  }

  function handleLimpar() {
    setTexto('')
    setSugestoes([])
    setMostrarLista(false)
    setResolvido(false)
    setErro('')
    onChange({ ...enderecoVazio })
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>{titulo}</Text>

      <View style={styles.linhaInput}>
        <TextInput
          value={texto}
          onChangeText={handleDigitar}
          onFocus={() => sugestoes.length > 0 && setMostrarLista(true)}
          placeholder="Digite o endereço..."
          placeholderTextColor="#9ca3af"
          style={[styles.input, resolvido && styles.inputResolvido]}
        />

        <View style={styles.indicador}>
          {buscando && <ActivityIndicator size="small" color={cores.textoSecundario} />}
          {!buscando && resolvido && <Text style={styles.check}>✓</Text>}
          {!buscando && !resolvido && texto ? (
            <Pressable onPress={handleLimpar} hitSlop={8}>
              <Text style={styles.limpar}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {mostrarLista && (
        <View style={styles.lista}>
          {sugestoes.length === 0 && !buscando && (
            <Text style={styles.semResultado}>Nenhum endereço encontrado.</Text>
          )}
          {sugestoes.map((sugestao) => (
            <Pressable
              key={sugestao.placeId}
              onPress={() => handleSelecionar(sugestao)}
              style={({ pressed }) => [styles.sugestao, pressed && styles.sugestaoPressionada]}
            >
              <Text style={styles.sugestaoTexto}>{sugestao.descricao}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {!erro && texto && !resolvido && !mostrarLista && !buscando ? (
        <Text style={styles.dica}>Escolha um endereço da lista pra confirmar.</Text>
      ) : null}
    </View>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 6,
  },
  linhaInput: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 36,
    paddingVertical: 12,
    fontSize: 15,
    color: cores.texto,
    backgroundColor: cores.cartao,
  },
  inputResolvido: {
    borderColor: cores.primaria,
  },
  indicador: {
    position: 'absolute',
    right: 12,
  },
  check: {
    color: cores.primaria,
    fontSize: 16,
    fontWeight: '700',
  },
  limpar: {
    color: cores.textoSecundario,
    fontSize: 15,
  },
  lista: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    backgroundColor: cores.cartao,
    overflow: 'hidden',
  },
  semResultado: {
    padding: 12,
    fontSize: 13,
    color: cores.textoSecundario,
  },
  sugestao: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sugestaoPressionada: {
    backgroundColor: cores.primariaClara,
  },
  sugestaoTexto: {
    fontSize: 13,
    color: cores.texto,
  },
  erro: {
    marginTop: 6,
    fontSize: 12,
    color: cores.erroTexto,
  },
  dica: {
    marginTop: 6,
    fontSize: 12,
    color: cores.textoSecundario,
  },
  })
}
