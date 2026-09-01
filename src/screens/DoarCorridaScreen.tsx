import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'

type CatalogoItem = { faixa: number; precoAvulso: number }
type Pacote = { id: string; faixa: number; quantidadeRestante: number }
type Destinatario = { id: string; nome: string; email: string }

// Doar uma corrida pra outro cliente: busca o destinatário por e-mail exato (nunca por nome, pra
// não virar uma lista pesquisável de clientes — ver ClientesController.Buscar) e, uma vez achado,
// escolhe se paga com o saldo da carteira ou usa uma corrida de um pacote que já tem — mesma tela
// do front-end web (DoarCorridaPage.jsx), ver DoacaoService no backend.
export default function DoarCorridaScreen() {
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([])
  const [saldo, setSaldo] = useState<number | null>(null)
  const [meusPacotes, setMeusPacotes] = useState<Pacote[]>([])

  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [destinatario, setDestinatario] = useState<Destinatario | null>(null)
  const [doando, setDoando] = useState<string | null>(null) // "carteira-<faixa>" ou "pacote-<id>"
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api.get<CatalogoItem[]>('/PacotesCorridas/catalogo').then(({ data }) => setCatalogo(data))
    carregarCarteira()
    carregarMeusPacotes()
  }, [])

  function carregarCarteira() {
    return api.get('/Carteiras/minha-carteira').then(({ data }) => setSaldo(data.saldo))
  }

  function carregarMeusPacotes() {
    return api.get<Pacote[]>('/PacotesCorridas/meus-pacotes').then(({ data }) => setMeusPacotes(data))
  }

  const pacotesDisponiveis = meusPacotes.filter((p) => p.quantidadeRestante > 0)

  async function handleBuscar() {
    setErro('')
    setMensagemSucesso('')
    setDestinatario(null)
    setBuscando(true)

    try {
      const { data } = await api.get<Destinatario>('/Clientes/buscar', { params: { email } })
      setDestinatario(data)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setBuscando(false)
    }
  }

  async function handleDoar(faixaValor: number, pacoteCorridasId: string | null, chave: string) {
    if (!destinatario) return
    setDoando(chave)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Carteiras/doar', {
        emailDestinatario: destinatario.email,
        faixa: faixaValor,
        pacoteCorridasId,
      })

      const faixa = obterFaixa(faixaValor)
      const origem = pacoteCorridasId
        ? `Restaram ${data.quantidadeRestantePacote} corrida(s) nesse pacote.`
        : `Saldo restante na carteira: ${formatarPreco(data.saldoRestante)}.`

      setMensagemSucesso(`Corrida ${faixa.nome} doada pra ${data.nomeDestinatario}! ${origem}`)
      setDestinatario(null)
      setEmail('')
      carregarCarteira()
      carregarMeusPacotes()
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setDoando(null)
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.descricao}>
        Doe uma corrida pra outra pessoa — pagando com o saldo da sua carteira ou usando uma corrida
        de um pacote que você já tem.
      </Text>
      {saldo !== null && <Text style={styles.saldoTexto}>Seu saldo atual: {formatarPreco(saldo)}</Text>}

      {mensagemSucesso ? <Text style={styles.sucesso}>{mensagemSucesso}</Text> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <View style={styles.buscaCartao}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="E-mail de quem vai receber"
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.input}
        />
        <Pressable
          onPress={handleBuscar}
          disabled={buscando || !email}
          style={[styles.botaoBuscar, (buscando || !email) && styles.desabilitado]}
        >
          {buscando ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.botaoBuscarTexto}>Buscar</Text>}
        </Pressable>
      </View>

      {destinatario && (
        <View style={{ gap: 16 }}>
          <View style={styles.cartao}>
            <Text style={styles.cartaoTitulo}>
              Doar pra <Text style={{ fontWeight: '700' }}>{destinatario.nome}</Text> ({destinatario.email}) usando o{' '}
              <Text style={{ fontWeight: '700' }}>saldo da carteira</Text>:
            </Text>

            <View style={styles.grade}>
              {catalogo.map((item) => {
                const faixa = obterFaixa(item.faixa)
                const chave = `carteira-${item.faixa}`
                return (
                  <Pressable
                    key={chave}
                    disabled={doando !== null}
                    onPress={() => handleDoar(item.faixa, null, chave)}
                    style={[styles.opcaoFaixa, { backgroundColor: faixa.hex }, doando !== null && styles.desabilitado]}
                  >
                    <Text style={[styles.opcaoFaixaNome, { color: faixa.textoClaro ? '#1f2937' : cores.branco }]}>
                      {faixa.nome}
                    </Text>
                    <Text style={[styles.opcaoFaixaPreco, { color: faixa.textoClaro ? '#1f2937' : cores.branco }]}>
                      {doando === chave ? 'Doando...' : formatarPreco(item.precoAvulso)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {pacotesDisponiveis.length > 0 && (
            <View style={styles.cartao}>
              <Text style={styles.cartaoTitulo}>
                Ou doar <Text style={{ fontWeight: '700' }}>de um pacote que você já tem</Text> (não cobra de
                novo, só usa 1 corrida do pacote):
              </Text>

              <View style={{ gap: 8, marginTop: 4 }}>
                {pacotesDisponiveis.map((pacote) => {
                  const faixa = obterFaixa(pacote.faixa)
                  const chave = `pacote-${pacote.id}`
                  return (
                    <View key={pacote.id} style={styles.linhaPacote}>
                      <View style={styles.linhaEsquerda}>
                        <View style={[styles.bolinha, { backgroundColor: faixa.hex }]} />
                        <Text style={styles.linhaPacoteTexto}>
                          {faixa.nome} — {pacote.quantidadeRestante} corrida(s) restante(s)
                        </Text>
                      </View>
                      <Pressable
                        disabled={doando !== null}
                        onPress={() => handleDoar(pacote.faixa, pacote.id, chave)}
                        style={[styles.botaoPacote, doando !== null && styles.desabilitado]}
                      >
                        <Text style={styles.botaoPacoteTexto}>{doando === chave ? 'Doando...' : 'Doar deste pacote'}</Text>
                      </Pressable>
                    </View>
                  )
                })}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  descricao: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  saldoTexto: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  sucesso: {
    backgroundColor: cores.primariaClara,
    color: cores.primariaEscura,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  erro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  buscaCartao: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: cores.texto,
    backgroundColor: cores.fundo,
  },
  botaoBuscar: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  botaoBuscarTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  desabilitado: {
    opacity: 0.5,
  },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 16,
  },
  cartaoTitulo: {
    fontSize: 13,
    color: cores.texto,
    marginBottom: 12,
  },
  grade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  opcaoFaixa: {
    width: '31%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 2,
  },
  opcaoFaixaNome: {
    fontSize: 13,
    fontWeight: '700',
  },
  opcaoFaixaPreco: {
    fontSize: 12,
  },
  linhaPacote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  linhaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  bolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  linhaPacoteTexto: {
    fontSize: 13,
    color: cores.texto,
    flexShrink: 1,
  },
  botaoPacote: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  botaoPacoteTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: cores.texto,
  },
  })
}
