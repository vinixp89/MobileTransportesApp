import { useEffect, useState } from 'react'
import * as WebBrowser from 'expo-web-browser'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco, obterFaixa } from '../constants/faixas'
import { obterEstiloPlano, STATUS_ASSINATURA } from '../constants/planos'
import { cores } from '../theme/colors'

type Plano = { tipo: number; nome: string; precoMensal: number; beneficios: string[] }
type Assinatura = { tipo: number; status: number }
type Beneficio = { temBeneficio: boolean; corBeneficio: number; disponivelParaUso: boolean; jaUsadoNoMes: boolean }

export default function PlanosScreen() {
  const [catalogo, setCatalogo] = useState<Plano[]>([])
  const [assinaturaAtual, setAssinaturaAtual] = useState<Assinatura | null>(null)
  const [beneficio, setBeneficio] = useState<Beneficio | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState('')
  const [erro, setErro] = useState('')
  const [mensagemSucesso, setMensagemSucesso] = useState('')

  function carregarTudo() {
    return Promise.all([
      api.get('/Planos/catalogo').then(({ data }) => setCatalogo(data)),
      api.get('/Planos/minha-assinatura').then(({ data }) => setAssinaturaAtual(data)),
      api.get('/Planos/beneficio').then(({ data }) => setBeneficio(data)),
    ]).catch((error) => setErro(extrairMensagemErro(error)))
  }

  useEffect(() => {
    carregarTudo().finally(() => setCarregando(false))
  }, [])

  async function handleAssinar(tipo: number, nome: string) {
    setProcessando(`assinar-${tipo}`)
    setErro('')
    setMensagemSucesso('')

    try {
      const { data } = await api.post('/Planos/assinar', { tipo })

      // Plano pago: abre o checkout do Mercado Pago no navegador do celular — a confirmação de
      // verdade acontece do lado de fora do app, via webhook (ver PagamentoService no backend).
      if (data.checkoutUrl) {
        await WebBrowser.openBrowserAsync(data.checkoutUrl)
        await carregarTudo()
        return
      }

      setAssinaturaAtual(data.assinatura)
      setMensagemSucesso(`Assinatura do plano ${nome} confirmada!`)
      const { data: novoBeneficio } = await api.get('/Planos/beneficio')
      setBeneficio(novoBeneficio)
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setProcessando('')
    }
  }

  async function handleCancelar() {
    setProcessando('cancelar')
    setErro('')
    setMensagemSucesso('')

    try {
      await api.post('/Planos/cancelar')
      setAssinaturaAtual(null)
      setBeneficio(null)
      setMensagemSucesso('Assinatura cancelada.')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setProcessando('')
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <Text style={styles.descricao}>
        Assine um plano e aproveite os benefícios enquanto ele estiver ativo. Você pode trocar de
        plano ou cancelar quando quiser — a mudança vale a partir de agora.
      </Text>

      {mensagemSucesso ? <Text style={styles.sucesso}>{mensagemSucesso}</Text> : null}
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
      {carregando && <ActivityIndicator color={cores.primaria} style={{ marginTop: 20 }} />}

      <View style={{ gap: 16 }}>
        {catalogo.map((plano) => {
          const estilo = obterEstiloPlano(plano.tipo)
          const ehPlanoAtual = assinaturaAtual?.tipo === plano.tipo
          const ativo = ehPlanoAtual && assinaturaAtual!.status === STATUS_ASSINATURA.ATIVA
          const pendente = ehPlanoAtual && assinaturaAtual!.status === STATUS_ASSINATURA.PENDENTE_PAGAMENTO
          const processandoEsse = processando === `assinar-${plano.tipo}`

          const corBeneficio = ativo && beneficio?.temBeneficio ? obterFaixa(beneficio.corBeneficio) : null

          return (
            <View key={plano.tipo} style={[styles.planoCard, { borderColor: estilo.cor }]}>
              {estilo.destaque && (
                <View style={[styles.badgeDestaque, { backgroundColor: estilo.cor }]}>
                  <Text style={styles.badgeDestaqueTexto}>{estilo.selo ?? 'Mais popular'}</Text>
                </View>
              )}

              <Text style={styles.planoNome}>{plano.nome}</Text>

              <View style={styles.precoLinha}>
                <Text style={styles.precoValor}>
                  {plano.precoMensal === 0 ? 'Grátis' : formatarPreco(plano.precoMensal)}
                </Text>
                {plano.precoMensal > 0 && <Text style={styles.precoPeriodo}>/mês</Text>}
              </View>

              <View style={styles.beneficiosLista}>
                {plano.beneficios.map((textoBeneficio) => (
                  <View key={textoBeneficio} style={styles.beneficioLinha}>
                    <Text style={styles.beneficioCheck}>✓</Text>
                    <Text style={styles.beneficioTexto}>{textoBeneficio}</Text>
                  </View>
                ))}
              </View>

              {ativo ? (
                <View style={{ gap: 8 }}>
                  <View style={[styles.selo, { borderColor: cores.primaria }]}>
                    <Text style={[styles.seloTexto, { color: cores.primariaEscura }]}>Seu plano atual</Text>
                  </View>

                  {corBeneficio && beneficio && (
                    <Text style={styles.dicaBeneficio}>
                      {beneficio.jaUsadoNoMes
                        ? `Corrida ${corBeneficio.nome.toLowerCase()} grátis já usada este mês.`
                        : beneficio.disponivelParaUso
                          ? `Corrida ${corBeneficio.nome.toLowerCase()} grátis liberada — peça em "Pedir corrida".`
                          : `Faça uma corrida paga este mês pra liberar sua corrida ${corBeneficio.nome.toLowerCase()} grátis.`}
                    </Text>
                  )}

                  <Pressable onPress={handleCancelar} disabled={processando === 'cancelar'}>
                    <Text style={styles.linkCancelar}>
                      {processando === 'cancelar' ? 'Cancelando...' : 'Cancelar assinatura'}
                    </Text>
                  </Pressable>
                </View>
              ) : pendente ? (
                <View style={{ gap: 8 }}>
                  <View style={[styles.selo, { borderColor: '#eab308' }]}>
                    <Text style={[styles.seloTexto, { color: '#a16207' }]}>Pagamento pendente</Text>
                  </View>

                  <Pressable
                    onPress={() => handleAssinar(plano.tipo, plano.nome)}
                    disabled={processandoEsse}
                    style={[styles.botaoAssinar, { backgroundColor: estilo.cor }, processandoEsse && styles.desabilitado]}
                  >
                    <Text style={styles.botaoAssinarTexto}>
                      {processandoEsse ? 'Redirecionando...' : 'Continuar pagamento'}
                    </Text>
                  </Pressable>

                  <Pressable onPress={handleCancelar} disabled={processando === 'cancelar'}>
                    <Text style={styles.linkCancelar}>
                      {processando === 'cancelar' ? 'Cancelando...' : 'Cancelar'}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleAssinar(plano.tipo, plano.nome)}
                  disabled={processandoEsse}
                  style={[styles.botaoAssinar, { backgroundColor: estilo.cor }, processandoEsse && styles.desabilitado]}
                >
                  <Text style={styles.botaoAssinarTexto}>
                    {processandoEsse ? 'Redirecionando...' : 'Assinar'}
                  </Text>
                </Pressable>
              )}
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
  planoCard: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    position: 'relative',
  },
  badgeDestaque: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeDestaqueTexto: {
    fontSize: 11,
    fontWeight: '600',
    color: cores.branco,
  },
  planoNome: {
    fontSize: 17,
    fontWeight: '700',
    color: cores.texto,
    marginTop: 6,
  },
  precoLinha: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 8,
    marginBottom: 14,
  },
  precoValor: {
    fontSize: 26,
    fontWeight: '800',
    color: cores.texto,
  },
  precoPeriodo: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  beneficiosLista: {
    gap: 8,
    marginBottom: 18,
  },
  beneficioLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  beneficioCheck: {
    color: cores.primaria,
    fontSize: 13,
    fontWeight: '700',
  },
  beneficioTexto: {
    flex: 1,
    fontSize: 13,
    color: cores.texto,
  },
  selo: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  seloTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  dicaBeneficio: {
    fontSize: 11,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  linkCancelar: {
    fontSize: 12,
    color: cores.textoSecundario,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  botaoAssinar: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoAssinarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.branco,
  },
  desabilitado: {
    opacity: 0.6,
  },
})
