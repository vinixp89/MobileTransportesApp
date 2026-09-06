import { useCallback, useEffect, useRef, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as Clipboard from 'expo-clipboard'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { STATUS_PAGAMENTO } from '../constants/pagamento'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PagamentoPix'>

const INTERVALO_MS = 4000

// Tela do QR Code Pix (gerado direto via Checkout API do Mercado Pago — ver
// CorridaService.IniciarCorridaAvulsaPixAsync no backend) — fica em polling em
// /Pagamentos/sincronizar/{id} até o pagamento ser confirmado, e só aí libera a corrida pro
// motorista ver (ver PagamentoService.AplicarEfeitoCorridaAvulsaAsync).
export default function PagamentoPixScreen({ route, navigation }: Props) {
  const { pagamentoGatewayId, qrCodeCopiaCola, qrCodeBase64, aoAprovar } = route.params
  const telaDesistir = aoAprovar.tipo === 'corrida' ? 'PedirCorrida' : 'Pacotes'
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [status, setStatus] = useState<number>(STATUS_PAGAMENTO.PENDENTE)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState('')
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sincronizar = useCallback(async () => {
    try {
      const { data } = await api.post(`/Pagamentos/sincronizar/${pagamentoGatewayId}`)
      setStatus(data.status)

      if (data.status === STATUS_PAGAMENTO.APROVADO) {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
        if (aoAprovar.tipo === 'corrida') {
          navigation.replace('AcompanharCorrida', { corridaId: aoAprovar.corridaId })
        } else {
          navigation.replace('Pacotes')
        }
      } else if (data.status === STATUS_PAGAMENTO.RECUSADO || data.status === STATUS_PAGAMENTO.CANCELADO) {
        if (intervaloRef.current) clearInterval(intervaloRef.current)
      }
    } catch (error) {
      // Falha pontual de rede no polling não é motivo pra parar de tentar — só ignora e tenta de
      // novo no próximo intervalo.
    }
  }, [pagamentoGatewayId, aoAprovar, navigation])

  useEffect(() => {
    sincronizar()
    intervaloRef.current = setInterval(sincronizar, INTERVALO_MS)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [sincronizar])

  async function handleCopiar() {
    try {
      await Clipboard.setStringAsync(qrCodeCopiaCola)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    }
  }

  const statusInfo = (() => {
    switch (status) {
      case STATUS_PAGAMENTO.APROVADO:
        return { texto: 'Pagamento aprovado! Redirecionando...', cor: cores.primaria }
      case STATUS_PAGAMENTO.RECUSADO:
        return { texto: 'Pagamento recusado. Volte e tente de novo.', cor: cores.erroTexto }
      case STATUS_PAGAMENTO.CANCELADO:
        return { texto: 'Esse pagamento foi cancelado.', cor: cores.erroTexto }
      default:
        return { texto: 'Aguardando você pagar o Pix...', cor: cores.textoSecundario }
    }
  })()

  const finalizado = status === STATUS_PAGAMENTO.RECUSADO || status === STATUS_PAGAMENTO.CANCELADO

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.titulo}>Pague com Pix pra confirmar a corrida</Text>

      <View style={styles.qrCard}>
        <Image
          source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
          style={styles.qrImagem}
          resizeMode="contain"
        />
      </View>

      <Pressable onPress={handleCopiar} style={styles.botaoCopiar}>
        <Text style={styles.botaoCopiarTexto}>{copiado ? 'Copiado!' : 'Copiar código Pix'}</Text>
      </Pressable>

      <View style={styles.statusLinha}>
        {!finalizado && <ActivityIndicator size="small" color={statusInfo.cor} />}
        <Text style={[styles.statusTexto, { color: statusInfo.cor }]}>{statusInfo.texto}</Text>
      </View>

      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Text style={styles.dica}>
        Abra o app do seu banco, escolha pagar com Pix "Copia e Cola" e cole o código copiado acima.
        Assim que o pagamento cair, a corrida é liberada automaticamente pro motorista — não precisa
        fazer nada além de esperar aqui.
      </Text>

      {finalizado && (
        <Pressable onPress={() => navigation.replace(telaDesistir)} style={styles.botaoVoltar}>
          <Text style={styles.botaoVoltarTexto}>Voltar e tentar de novo</Text>
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
      padding: 20,
      alignItems: 'center',
      gap: 16,
    },
    titulo: {
      fontSize: 18,
      fontWeight: '700',
      color: cores.texto,
      textAlign: 'center',
    },
    qrCard: {
      backgroundColor: cores.branco,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    qrImagem: {
      width: 220,
      height: 220,
    },
    botaoCopiar: {
      backgroundColor: cores.primaria,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 24,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    botaoCopiarTexto: {
      color: cores.branco,
      fontSize: 14,
      fontWeight: '700',
    },
    statusLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusTexto: {
      fontSize: 13,
      fontWeight: '600',
    },
    erro: {
      backgroundColor: cores.erroFundo,
      color: cores.erroTexto,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      alignSelf: 'stretch',
    },
    dica: {
      fontSize: 12,
      color: cores.textoSecundario,
      textAlign: 'center',
      lineHeight: 18,
    },
    botaoVoltar: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingVertical: 13,
      paddingHorizontal: 24,
      alignItems: 'center',
      alignSelf: 'stretch',
    },
    botaoVoltarTexto: {
      fontSize: 14,
      fontWeight: '600',
      color: cores.texto,
    },
  })
}
