import { useCallback, useEffect, useRef, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import RideMap from '../components/RideMap'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { obterStatusLabel, STATUS_CONFIRMADA, STATUS_FINALIZADA, STATUS_CANCELADA } from '../constants/statusCorrida'
import { notificarMudancaDeStatus } from '../notifications/notificar'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'
import type { Corrida } from '../types/corrida'

type Props = NativeStackScreenProps<RootStackParamList, 'AcompanharCorrida'>

type LocalizacaoMotorista = {
  latitude: number | null
  longitude: number | null
  placaVeiculo: string
  modeloVeiculo: string
}

const STATUS_FINAIS = [STATUS_FINALIZADA, STATUS_CANCELADA]
const STATUS_COM_MOTORISTA = [1, 2, 3]
const INTERVALO_MS = 4000

// Espelha a AcompanharCorridaPage do front-end web: consulta o status em polling e, assim que o
// motorista aceita, mostra o código de confirmação (uma vez) e a posição dele no mapa.
export default function AcompanharCorridaScreen({ route, navigation }: Props) {
  const { corridaId } = route.params
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [corrida, setCorrida] = useState<Corrida | null>(null)
  const [motorista, setMotorista] = useState<LocalizacaoMotorista | null>(null)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // undefined = ainda não buscou nada; null seria um status válido (0). Só notifica em transições
  // reais — não na primeira busca, que só está "confirmando" o status já conhecido.
  const statusAnteriorRef = useRef<number | undefined>(undefined)

  const buscar = useCallback(async () => {
    try {
      const { data } = await api.get<Corrida>(`/Corridas/${corridaId}`)
      setCorrida(data)

      if (statusAnteriorRef.current !== undefined && statusAnteriorRef.current !== data.status) {
        notificarMudancaDeStatus(data.status)
      }
      statusAnteriorRef.current = data.status

      if (data.status === STATUS_CONFIRMADA && !codigo) {
        try {
          const { data: resposta } = await api.get<{ codigo: string }>(`/Corridas/${corridaId}/codigo-confirmacao`)
          setCodigo(resposta.codigo)
        } catch {
          // Sem sorte agora — tenta de novo no próximo polling.
        }
      }

      if (STATUS_COM_MOTORISTA.includes(data.status)) {
        try {
          const { data: local } = await api.get<LocalizacaoMotorista>(`/Corridas/${corridaId}/localizacao-motorista`)
          setMotorista(local)
        } catch {
          // Mantém a última posição conhecida em vez de sumir com o marcador.
        }
      } else {
        setMotorista(null)
      }

      if (STATUS_FINAIS.includes(data.status) && intervaloRef.current) {
        clearInterval(intervaloRef.current)
        intervaloRef.current = null
      }
    } catch (error) {
      setErro(extrairMensagemErro(error))
    }
  }, [corridaId, codigo])

  useEffect(() => {
    // Reseta ao trocar de corrida (ex: banner da Home leva pra uma corrida diferente da que a
    // tela já estava mostrando) — sem isso, o status da corrida anterior "vaza" pra comparação.
    statusAnteriorRef.current = undefined
    setCorrida(null)
    setMotorista(null)
    setCodigo('')
  }, [corridaId])

  useEffect(() => {
    buscar()
    intervaloRef.current = setInterval(buscar, INTERVALO_MS)

    return () => {
      if (intervaloRef.current) clearInterval(intervaloRef.current)
    }
  }, [buscar])

  async function handleCancelar() {
    setCancelando(true)
    setErro('')

    try {
      const { data } = await api.patch<Corrida>(`/Corridas/${corridaId}/cancelar`)
      setCorrida(data)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setCancelando(false)
    }
  }

  if (!corrida) {
    return (
      <View style={styles.centralizado}>
        {erro ? <Text style={styles.erroTextoSolo}>{erro}</Text> : <ActivityIndicator color={cores.primaria} size="large" />}
      </View>
    )
  }

  const faixa = obterFaixa(corrida.faixaContratada)
  const status = obterStatusLabel(corrida.status)
  const podeCancelar = corrida.status === 0 || corrida.status === STATUS_CONFIRMADA
  const motoristaPos =
    motorista && motorista.latitude != null && motorista.longitude != null
      ? { latitude: motorista.latitude, longitude: motorista.longitude }
      : null

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={[styles.cartao, { borderLeftColor: faixa.hex }]}>
        <View style={styles.linhaTopo}>
          <View style={[styles.badge, { backgroundColor: faixa.hex }]}>
            <Text style={[styles.badgeTexto, { color: faixa.textoClaro ? '#1f2937' : cores.branco }]}>
              {faixa.nome.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.corFundo }]}>
            <Text style={[styles.statusTexto, { color: status.corTexto }]}>{status.texto}</Text>
          </View>
        </View>

        {codigo !== '' && corrida.status === STATUS_CONFIRMADA ? (
          <View style={styles.codigoCaixa}>
            <Text style={styles.codigoRotulo}>Fale esse código pro motorista antes dele iniciar a viagem</Text>
            <Text style={styles.codigoTexto}>{codigo}</Text>
          </View>
        ) : null}

        <View style={styles.enderecos}>
          <View style={styles.linhaEndereco}>
            <View style={[styles.bolinhaEndereco, { backgroundColor: '#38bdf8' }]} />
            <Text style={styles.enderecoTexto}>
              {corrida.origem.logradouro}, {corrida.origem.numero} — {corrida.origem.bairro}
            </Text>
          </View>
          <View style={styles.linhaTracejada} />
          <View style={styles.linhaEndereco}>
            <View style={[styles.bolinhaEndereco, { backgroundColor: faixa.hex }]} />
            <Text style={styles.enderecoTexto}>
              {corrida.destino.logradouro}, {corrida.destino.numero} — {corrida.destino.bairro}
            </Text>
          </View>
        </View>

        <View style={styles.mapaContainer}>
          <RideMap origem={corrida.origem} destino={corrida.destino} corHex={faixa.hex} motoristaPos={motoristaPos} />
        </View>

        <View style={styles.linhaTopo}>
          <Text style={styles.km}>{corrida.distanciaEstimadaKm.toFixed(1)} km</Text>
          <Text style={[styles.valor, { color: faixa.hex }]}>{formatarPreco(corrida.valorReferencia)}</Text>
        </View>

        {motorista && (
          <View style={styles.motoristaCaixa}>
            <Text style={styles.motoristaTexto}>
              Motorista a caminho — {motorista.modeloVeiculo} ({motorista.placaVeiculo})
            </Text>
          </View>
        )}

        {erro ? (
          <View style={styles.erroCaixa}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        ) : null}

        <View style={styles.botoes}>
          {podeCancelar && (
            <Pressable
              onPress={handleCancelar}
              disabled={cancelando}
              style={({ pressed }) => [styles.botaoSecundario, (pressed || cancelando) && styles.botaoPressionado]}
            >
              <Text style={styles.botaoSecundarioTexto}>{cancelando ? 'Cancelando...' : 'Cancelar corrida'}</Text>
            </Pressable>
          )}

          {STATUS_FINAIS.includes(corrida.status) && (
            <Pressable
              onPress={() => navigation.navigate('Home')}
              style={({ pressed }) => [styles.botaoPrimario, { backgroundColor: faixa.hex }, pressed && styles.botaoPressionado]}
            >
              <Text style={styles.botaoPrimarioTexto}>Voltar pro início</Text>
            </Pressable>
          )}
        </View>
      </View>
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
  },
  centralizado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    padding: 20,
  },
  erroTextoSolo: {
    color: cores.erroTexto,
    fontSize: 14,
    textAlign: 'center',
  },
  cartao: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderLeftWidth: 4,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeTexto: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusTexto: {
    fontSize: 12,
    fontWeight: '600',
  },
  codigoCaixa: {
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d8b4fe',
    backgroundColor: '#faf5ff',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  codigoRotulo: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7e22ce',
    textAlign: 'center',
  },
  codigoTexto: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 10,
    color: '#6b21a8',
  },
  enderecos: {
    marginTop: 14,
    gap: 4,
  },
  linhaEndereco: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bolinhaEndereco: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  linhaTracejada: {
    marginLeft: 4,
    height: 12,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: cores.borda,
  },
  enderecoTexto: {
    flex: 1,
    fontSize: 13,
    color: cores.texto,
  },
  mapaContainer: {
    marginTop: 14,
  },
  km: {
    marginTop: 12,
    fontSize: 13,
    color: cores.textoSecundario,
  },
  valor: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '700',
  },
  motoristaCaixa: {
    marginTop: 14,
    backgroundColor: '#faf5ff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  motoristaTexto: {
    fontSize: 12,
    color: '#7e22ce',
  },
  erroCaixa: {
    marginTop: 14,
    backgroundColor: cores.erroFundo,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  erroTexto: {
    color: cores.erroTexto,
    fontSize: 13,
  },
  botoes: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 12,
  },
  botaoPrimario: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botaoPrimarioTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  botaoSecundario: {
    flex: 1,
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
  botaoPressionado: {
    opacity: 0.7,
  },
  })
}
