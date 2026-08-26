import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'SaldoCorrida'>

type Pacote = {
  id: string
  faixa: number
  quantidadeTotal: number
  quantidadeRestante: number
  precoPago: number
  dataCompra: string
}

// Espelha a SaldoCorridaPage do front-end web: quantas corridas de pacote o cliente ainda tem
// disponíveis, separadas por faixa, com atalho pra comprar mais.
export default function SaldoCorridaScreen({ navigation }: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    api
      .get<Pacote[]>('/PacotesCorridas/meus-pacotes')
      .then(({ data }) => setPacotes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  const totalRestante = pacotes.reduce((soma, p) => soma + p.quantidadeRestante, 0)
  const comSaldo = pacotes.filter((p) => p.quantidadeRestante > 0)
  const semSaldo = pacotes.filter((p) => p.quantidadeRestante === 0)

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.banner}>
        <Text style={styles.bannerRotulo}>Corridas disponíveis em pacotes</Text>
        <Text style={styles.bannerValor}>{carregando ? '...' : totalRestante}</Text>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando && <ActivityIndicator color={cores.primaria} style={{ marginTop: 8 }} />}

      {!carregando && pacotes.length === 0 && !erro && (
        <View style={styles.cartaoVazio}>
          <Text style={styles.textoVazio}>Você ainda não tem nenhum pacote de corridas.</Text>
          <Pressable onPress={() => navigation.navigate('Pacotes')} style={styles.botaoComprar}>
            <Text style={styles.botaoComprarTexto}>Comprar pacote</Text>
          </Pressable>
        </View>
      )}

      {comSaldo.length > 0 && (
        <View style={{ gap: 10 }}>
          {comSaldo.map((p) => {
            const faixa = obterFaixa(p.faixa)
            return (
              <View key={p.id} style={styles.linhaPacote}>
                <View style={styles.linhaEsquerda}>
                  <View style={[styles.bolinha, { backgroundColor: faixa.hex }]} />
                  <View>
                    <Text style={styles.pacoteNome}>{faixa.nome}</Text>
                    <Text style={styles.pacoteData}>
                      Comprado por {formatarPreco(p.precoPago)} em {new Date(p.dataCompra).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                </View>
                <Text style={styles.pacoteQtd}>
                  {p.quantidadeRestante}
                  <Text style={styles.pacoteQtdTotal}>/{p.quantidadeTotal}</Text>
                </Text>
              </View>
            )
          })}
        </View>
      )}

      {semSaldo.length > 0 && (
        <View style={styles.usadosCartao}>
          <Text style={styles.usadosTitulo}>Pacotes já usados ({semSaldo.length})</Text>
          {semSaldo.map((p) => {
            const faixa = obterFaixa(p.faixa)
            return (
              <View key={p.id} style={styles.usadoLinha}>
                <View style={styles.linhaEsquerda}>
                  <View style={[styles.bolinhaPequena, { backgroundColor: faixa.hex }]} />
                  <Text style={styles.usadoTexto}>{faixa.nome}</Text>
                </View>
                <Text style={styles.usadoTexto}>0/{p.quantidadeTotal}</Text>
              </View>
            )
          })}
        </View>
      )}

      {pacotes.length > 0 && (
        <Pressable onPress={() => navigation.navigate('Pacotes')} style={styles.botaoSecundario}>
          <Text style={styles.botaoSecundarioTexto}>Comprar mais pacotes</Text>
        </Pressable>
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
    gap: 16,
  },
  banner: {
    backgroundColor: cores.primaria,
    borderRadius: 16,
    padding: 20,
  },
  bannerRotulo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  bannerValor: {
    fontSize: 28,
    fontWeight: '800',
    color: cores.branco,
    marginTop: 2,
  },
  erro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  cartaoVazio: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  textoVazio: {
    color: cores.textoSecundario,
    fontSize: 14,
    textAlign: 'center',
  },
  botaoComprar: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  botaoComprarTexto: {
    color: cores.branco,
    fontSize: 13,
    fontWeight: '700',
  },
  linhaPacote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cores.cartao,
    borderRadius: 12,
    padding: 14,
  },
  linhaEsquerda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  bolinha: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bolinhaPequena: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pacoteNome: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  pacoteData: {
    fontSize: 11,
    color: cores.textoSecundario,
    marginTop: 1,
  },
  pacoteQtd: {
    fontSize: 17,
    fontWeight: '700',
    color: cores.texto,
  },
  pacoteQtdTotal: {
    fontSize: 12,
    fontWeight: '400',
    color: cores.textoSecundario,
  },
  usadosCartao: {
    backgroundColor: cores.cartao,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  usadosTitulo: {
    fontSize: 12,
    color: cores.textoSecundario,
    marginBottom: 2,
  },
  usadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  usadoTexto: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: cores.cartao,
  },
  botaoSecundarioTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  })
}
