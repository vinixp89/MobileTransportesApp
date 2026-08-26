import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as WebBrowser from 'expo-web-browser'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import api, { extrairMensagemErro } from '../api/client'
import { formatarPreco } from '../constants/faixas'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Carteira'>

type Carteira = { saldo: number }

const VALORES_RAPIDOS = [20, 50, 100]

// Espelha a CarteiraPage do front-end web: saldo em reais da carteira (usado automaticamente pra
// pagar corridas avulsas) + recarga via checkout do Mercado Pago aberto no navegador do celular.
export default function CarteiraScreen({ navigation }: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [carteira, setCarteira] = useState<Carteira | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [valor, setValor] = useState('')
  const [recarregando, setRecarregando] = useState(false)
  const [erro, setErro] = useState('')

  function carregarCarteira() {
    return api
      .get<Carteira>('/Carteiras/minha-carteira')
      .then(({ data }) => setCarteira(data))
      .catch((error) => setErro(extrairMensagemErro(error)))
  }

  useEffect(() => {
    carregarCarteira().finally(() => setCarregando(false))
  }, [])

  async function handleRecarregar() {
    setErro('')

    const valorNumerico = Number(valor.replace(',', '.'))

    if (!valorNumerico || valorNumerico <= 0) {
      setErro('Informe um valor válido pra recarga.')
      return
    }

    setRecarregando(true)

    try {
      const { data } = await api.post('/Carteiras/recarregar', { valor: valorNumerico })

      // Igual ao checkout de Planos: abre o Mercado Pago no navegador do celular — a confirmação
      // de verdade chega por webhook, o saldo só atualiza depois de voltar e recarregar aqui.
      await WebBrowser.openBrowserAsync(data.checkoutUrl)
      await carregarCarteira()
      setValor('')
    } catch (error) {
      setErro(extrairMensagemErro(error))
    } finally {
      setRecarregando(false)
    }
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      <View style={styles.banner}>
        <Text style={styles.bannerRotulo}>Saldo disponível</Text>
        <Text style={styles.bannerValor}>{carregando ? '...' : formatarPreco(carteira?.saldo ?? 0)}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.formTitulo}>Recarregar saldo</Text>

        <View style={styles.valoresRapidos}>
          {VALORES_RAPIDOS.map((v) => {
            const selecionado = valor === String(v)
            return (
              <Pressable
                key={v}
                onPress={() => setValor(String(v))}
                style={[styles.valorRapido, selecionado && styles.valorRapidoSelecionado]}
              >
                <Text style={[styles.valorRapidoTexto, selecionado && styles.valorRapidoTextoSelecionado]}>
                  R$ {v}
                </Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.rotulo}>Ou informe outro valor</Text>
        <TextInput
          value={valor}
          onChangeText={setValor}
          placeholder="0,00"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
          style={styles.input}
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable
          onPress={handleRecarregar}
          disabled={recarregando}
          style={[styles.botaoPrimario, recarregando && styles.desabilitado]}
        >
          {recarregando ? (
            <ActivityIndicator color={cores.branco} />
          ) : (
            <Text style={styles.botaoPrimarioTexto}>Recarregar</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.dica}>
        O saldo da carteira é usado automaticamente pra pagar corridas avulsas — sem precisar
        passar pelo Mercado Pago a cada corrida.
      </Text>

      <Pressable onPress={() => navigation.navigate('Historico')}>
        <Text style={styles.linkExtrato}>Ver histórico completo →</Text>
      </Pressable>
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
  formCard: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    padding: 20,
  },
  formTitulo: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 14,
  },
  valoresRapidos: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  valorRapido: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  valorRapidoSelecionado: {
    borderColor: cores.primaria,
    backgroundColor: cores.primariaClara,
  },
  valorRapidoTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.textoSecundario,
  },
  valorRapidoTextoSelecionado: {
    color: cores.primariaEscura,
  },
  rotulo: {
    fontSize: 13,
    fontWeight: '500',
    color: cores.texto,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: cores.texto,
    marginBottom: 14,
  },
  erro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    marginBottom: 14,
  },
  botaoPrimario: {
    backgroundColor: cores.primaria,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botaoPrimarioTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: '700',
  },
  desabilitado: {
    opacity: 0.6,
  },
  dica: {
    fontSize: 11,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
  linkExtrato: {
    fontSize: 13,
    fontWeight: '600',
    color: cores.primaria,
    textAlign: 'center',
  },
  })
}
