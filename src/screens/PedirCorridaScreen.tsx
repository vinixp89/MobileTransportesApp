import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import EnderecoFields, { enderecoVazio, type Endereco } from '../components/EnderecoFields'
import RideConfirmCard, { type Estimativa } from '../components/RideConfirmCard'
import { obterFaixa, formatarPreco } from '../constants/faixas'
import { cores } from '../theme/colors'

const TIPO_CONSUMO = { AVULSA: 0, PACOTE: 1, BENEFICIO: 2 } as const

type Pacote = { id: string; faixa: number; quantidadeRestante: number }
type Beneficio = {
  temBeneficio: boolean
  corBeneficio: number
  disponivelParaUso: boolean
  jaUsadoNoMes: boolean
}
type Carteira = { saldo: number }

export default function PedirCorridaScreen() {
  const [etapa, setEtapa] = useState<'form' | 'confirmando' | 'confirmado'>('form')

  const [origem, setOrigem] = useState<Endereco>(enderecoVazio)
  const [destino, setDestino] = useState<Endereco>(enderecoVazio)
  const [tipoConsumo, setTipoConsumo] = useState<number>(TIPO_CONSUMO.AVULSA)
  const [pacotes, setPacotes] = useState<Pacote[]>([])
  const [pacoteCorridasId, setPacoteCorridasId] = useState('')
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null)
  const [carteira, setCarteira] = useState<Carteira | null>(null)

  const [estimando, setEstimando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState('')
  const [estimativa, setEstimativa] = useState<Estimativa | null>(null)

  useEffect(() => {
    if (tipoConsumo !== TIPO_CONSUMO.PACOTE) return

    api
      .get('/PacotesCorridas/meus-pacotes')
      .then(({ data }) => setPacotes(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
  }, [tipoConsumo])

  useEffect(() => {
    api
      .get('/Planos/beneficio')
      .then(({ data }) => setBeneficio(data))
      .catch(() => setBeneficio(null))
  }, [])

  useEffect(() => {
    api
      .get('/Carteiras/minha-carteira')
      .then(({ data }) => setCarteira(data))
      .catch(() => setCarteira(null))
  }, [])

  const pacotesDisponiveis = pacotes.filter((p) => p.quantidadeRestante > 0)
  const pacoteSelecionado = pacotesDisponiveis.find((p) => p.id === pacoteCorridasId)
  const corBeneficio = beneficio?.temBeneficio ? obterFaixa(beneficio.corBeneficio) : null

  const erroFaixaPacote =
    estimativa && tipoConsumo === TIPO_CONSUMO.PACOTE && pacoteSelecionado && pacoteSelecionado.faixa !== estimativa.faixa
      ? `Esse pacote é da faixa ${obterFaixa(pacoteSelecionado.faixa).nome}, mas essa corrida caiu na faixa ${obterFaixa(estimativa.faixa).nome}. Volte e escolha outro pacote ou pague avulso.`
      : ''

  const erroFaixaBeneficio =
    estimativa && tipoConsumo === TIPO_CONSUMO.BENEFICIO && corBeneficio && corBeneficio.valor !== estimativa.faixa
      ? `Sua corrida grátis vale só pra faixa ${corBeneficio.nome}, mas essa corrida caiu na faixa ${obterFaixa(estimativa.faixa).nome}. Volte e escolha outra forma de pagamento.`
      : ''

  const erroSaldoAvulsa =
    estimativa && tipoConsumo === TIPO_CONSUMO.AVULSA && carteira && carteira.saldo < estimativa.valorReferencia
      ? `Saldo insuficiente na carteira (você tem ${formatarPreco(carteira.saldo)}). Recarregue antes de confirmar, ou escolha outra forma de pagamento.`
      : ''

  const origemResolvida = Boolean(origem.logradouro)
  const destinoResolvido = Boolean(destino.logradouro)

  async function handleEstimar() {
    setErro('')

    if (!origemResolvida || !destinoResolvido) {
      setErro('Escolha os endereços de origem e destino na lista de sugestões.')
      return
    }

    if (tipoConsumo === TIPO_CONSUMO.PACOTE && !pacoteCorridasId) {
      setErro('Escolha um pacote de corridas.')
      return
    }

    setEstimando(true)

    try {
      const { data } = await api.post('/Corridas/estimar', { origem, destino })
      setEstimativa(data)
      setEtapa('confirmando')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setEstimando(false)
    }
  }

  async function handleConfirmar() {
    setErro('')
    setConfirmando(true)

    try {
      await api.post('/Corridas', {
        origem,
        destino,
        tipoConsumo,
        pacoteCorridasId: tipoConsumo === TIPO_CONSUMO.PACOTE ? pacoteCorridasId : null,
      })

      setEtapa('confirmado')

      api.get('/Planos/beneficio').then(({ data }) => setBeneficio(data)).catch(() => {})

      if (tipoConsumo === TIPO_CONSUMO.AVULSA) {
        api.get('/Carteiras/minha-carteira').then(({ data }) => setCarteira(data)).catch(() => {})
      }
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setConfirmando(false)
    }
  }

  function handleNovaCorrida() {
    setEtapa('form')
    setOrigem(enderecoVazio)
    setDestino(enderecoVazio)
    setTipoConsumo(TIPO_CONSUMO.AVULSA)
    setPacoteCorridasId('')
    setEstimativa(null)
    setErro('')
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      {etapa === 'form' && (
        <View style={styles.formCard}>
          <EnderecoFields titulo="Origem" valores={origem} onChange={setOrigem} />
          <EnderecoFields titulo="Destino" valores={destino} onChange={setDestino} />

          <View style={styles.fieldset}>
            <Text style={styles.legend}>Forma de pagamento</Text>

            <OpcaoPagamento
              label={`Corrida avulsa${carteira ? ` (saldo: ${formatarPreco(carteira.saldo)})` : ''}`}
              selecionado={tipoConsumo === TIPO_CONSUMO.AVULSA}
              onPress={() => setTipoConsumo(TIPO_CONSUMO.AVULSA)}
            />
            <OpcaoPagamento
              label="Usar pacote de corridas"
              selecionado={tipoConsumo === TIPO_CONSUMO.PACOTE}
              onPress={() => setTipoConsumo(TIPO_CONSUMO.PACOTE)}
            />
            {corBeneficio && (
              <OpcaoPagamento
                label={`Corrida ${corBeneficio.nome.toLowerCase()} grátis do plano`}
                selecionado={tipoConsumo === TIPO_CONSUMO.BENEFICIO}
                desabilitado={!beneficio?.disponivelParaUso}
                onPress={() => setTipoConsumo(TIPO_CONSUMO.BENEFICIO)}
              />
            )}

            {corBeneficio && beneficio && !beneficio.disponivelParaUso && (
              <Text style={styles.dica}>
                {beneficio.jaUsadoNoMes
                  ? `Você já usou sua corrida ${corBeneficio.nome.toLowerCase()} grátis deste mês.`
                  : `Faça uma corrida paga este mês pra liberar sua corrida ${corBeneficio.nome.toLowerCase()} grátis.`}
              </Text>
            )}

            {tipoConsumo === TIPO_CONSUMO.PACOTE && (
              <View style={{ marginTop: 10 }}>
                {pacotesDisponiveis.length === 0 ? (
                  <Text style={styles.dica}>Você não tem pacotes com corridas disponíveis.</Text>
                ) : (
                  pacotesDisponiveis.map((p) => {
                    const faixa = obterFaixa(p.faixa)
                    return (
                      <OpcaoPagamento
                        key={p.id}
                        label={`${faixa.nome} — ${p.quantidadeRestante} corrida(s) restante(s)`}
                        selecionado={pacoteCorridasId === p.id}
                        onPress={() => setPacoteCorridasId(p.id)}
                      />
                    )
                  })
                )}
              </View>
            )}
          </View>

          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Pressable
            onPress={handleEstimar}
            disabled={estimando || !origemResolvida || !destinoResolvido}
            style={[styles.botaoPrimario, (estimando || !origemResolvida || !destinoResolvido) && styles.desabilitado]}
          >
            {estimando ? (
              <ActivityIndicator color={cores.branco} />
            ) : (
              <Text style={styles.botaoPrimarioTexto}>Ver valor da corrida</Text>
            )}
          </Pressable>
        </View>
      )}

      {(etapa === 'confirmando' || etapa === 'confirmado') && estimativa && (
        <RideConfirmCard
          estimativa={estimativa}
          modo={etapa}
          onConfirmar={handleConfirmar}
          onCancelar={() => setEtapa('form')}
          confirmando={confirmando}
          erro={erro || erroFaixaPacote || erroFaixaBeneficio || erroSaldoAvulsa}
          bloqueado={Boolean(erroFaixaPacote || erroFaixaBeneficio || erroSaldoAvulsa)}
          gratisPlano={tipoConsumo === TIPO_CONSUMO.BENEFICIO}
        />
      )}

      {etapa === 'confirmado' && (
        <Pressable onPress={handleNovaCorrida} style={styles.botaoSecundario}>
          <Text style={styles.botaoSecundarioTexto}>Pedir outra corrida</Text>
        </Pressable>
      )}
    </ScrollView>
  )
}

function OpcaoPagamento({
  label,
  selecionado,
  desabilitado,
  onPress,
}: {
  label: string
  selecionado: boolean
  desabilitado?: boolean
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desabilitado}
      style={[styles.opcao, desabilitado && styles.desabilitado]}
    >
      <View style={[styles.radio, selecionado && styles.radioSelecionado]}>
        {selecionado && <View style={styles.radioMiolo} />}
      </View>
      <Text style={styles.opcaoTexto}>{label}</Text>
    </Pressable>
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
  },
  formCard: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 20,
    gap: 6,
  },
  fieldset: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  legend: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 8,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelecionado: {
    borderColor: cores.primaria,
  },
  radioMiolo: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: cores.primaria,
  },
  opcaoTexto: {
    flex: 1,
    fontSize: 13,
    color: cores.texto,
  },
  dica: {
    fontSize: 12,
    color: cores.textoSecundario,
    marginTop: 4,
  },
  erro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  botaoPrimarioTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  desabilitado: {
    opacity: 0.6,
  },
  botaoSecundario: {
    marginTop: 16,
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
