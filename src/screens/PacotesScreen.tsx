import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { cores } from '../theme/colors'

type Tamanho = { quantidade: number; preco: number }
type ItemCatalogo = { faixa: number; precoAvulso: number; tamanhos: Tamanho[] }

export default function PacotesScreen() {
  const [catalogo, setCatalogo] = useState<ItemCatalogo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [comprando, setComprando] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  useEffect(() => {
    api
      .get('/PacotesCorridas/catalogo')
      .then(({ data }) => setCatalogo(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  async function handleComprar(faixaValor: number, quantidade: number) {
    const chave = `${faixaValor}-${quantidade}`
    setComprando(chave)
    setErro('')
    setMensagemSucesso('')

    try {
      await api.post('/PacotesCorridas', { faixa: faixaValor, quantidade })
      const faixa = obterFaixa(faixaValor)
      setMensagemSucesso(`Pacote de ${quantidade} corridas ${faixa.nome} comprado com sucesso!`)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setComprando('')
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.descricao}>
        Cada pacote vale só pra corridas que caírem na mesma faixa de distância. O preço é o mesmo
        da corrida avulsa multiplicado pela quantidade — a vantagem é já deixar pago e pronto pra
        usar.
      </Text>

      {mensagemSucesso ? (
        <View style={styles.sucessoCaixa}>
          <Text style={styles.sucessoTexto}>{mensagemSucesso}</Text>
        </View>
      ) : null}

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando && <ActivityIndicator color={cores.primaria} style={{ marginTop: 20 }} />}

      <View style={{ gap: 14 }}>
        {catalogo.map((item) => {
          const faixa = obterFaixa(item.faixa)
          return (
            <View key={item.faixa} style={[styles.faixaCard, { backgroundColor: faixa.hex }]}>
              <View style={styles.faixaTopo}>
                <Text style={[styles.faixaNome, faixa.textoClaro && styles.textoEscuro]}>{faixa.nome}</Text>
                <Text style={[styles.faixaInfo, faixa.textoClaro && styles.textoEscuro]}>
                  ({faixa.km} — avulsa {formatarPreco(item.precoAvulso)})
                </Text>
              </View>

              <View style={styles.tamanhosGrid}>
                {item.tamanhos.map((tamanho) => {
                  const chave = `${item.faixa}-${tamanho.quantidade}`
                  return (
                    <Pressable
                      key={chave}
                      disabled={comprando === chave}
                      onPress={() => handleComprar(item.faixa, tamanho.quantidade)}
                      style={[styles.tamanhoBotao, comprando === chave && styles.desabilitado]}
                    >
                      <Text style={[styles.tamanhoQtd, faixa.textoClaro && styles.textoEscuro]}>
                        {tamanho.quantidade} corridas
                      </Text>
                      <Text style={[styles.tamanhoPreco, faixa.textoClaro && styles.textoEscuro]}>
                        {comprando === chave ? 'Comprando...' : formatarPreco(tamanho.preco)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  descricao: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  sucessoCaixa: {
    backgroundColor: cores.primariaClara,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 6,
  },
  sucessoTexto: {
    fontSize: 13,
    color: cores.primariaEscura,
  },
  sucessoLink: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.primariaEscura,
    textDecorationLine: 'underline',
  },
  erro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  faixaCard: {
    borderRadius: 16,
    padding: 16,
  },
  faixaTopo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 12,
  },
  faixaNome: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.branco,
  },
  faixaInfo: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  textoEscuro: {
    color: '#1f2937',
  },
  tamanhosGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  tamanhoBotao: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  desabilitado: {
    opacity: 0.5,
  },
  tamanhoQtd: {
    fontSize: 13,
    fontWeight: '700',
    color: cores.branco,
  },
  tamanhoPreco: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
})
