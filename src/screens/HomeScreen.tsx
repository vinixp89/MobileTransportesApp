import { useCallback, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import ThemeToggleButton from '../components/ThemeToggleButton'
import api from '../api/client'
import { obterStatusLabel, STATUS_ATIVOS } from '../constants/statusCorrida'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'
import type { Corrida } from '../types/corrida'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

const INTERVALO_MS = 15000

// Espelha os cards de ação da HomePage do front-end web (Cliente): Pedir corrida, Pacote de
// corrida e Planos, no mesmo verde de marca. Também mostra um banner de "corrida em andamento"
// quando o cliente tem alguma pendente/confirmada/em andamento — pra ele não perder o fio da
// corrida se sair do app e voltar depois.
export default function HomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth()
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [corridaAtual, setCorridaAtual] = useState<Corrida | null>(null)

  useFocusEffect(
    useCallback(() => {
      let ativo = true

      function buscar() {
        api
          .get<Corrida | null>('/Corridas/atual')
          .then(({ data }) => {
            if (ativo) setCorridaAtual(data && STATUS_ATIVOS.includes(data.status) ? data : null)
          })
          .catch(() => {
            // Falha isolada não derruba a Home — só não mostra o banner dessa vez.
          })
      }

      buscar()
      const intervalo = setInterval(buscar, INTERVALO_MS)

      return () => {
        ativo = false
        clearInterval(intervalo)
      }
    }, [])
  )

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <View style={styles.linhaLogo}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          <View>
            <Text style={styles.saudacao}>Olá!</Text>
            <Text style={styles.perfil}>
              Perfil: {usuario?.roles.length ? usuario.roles.join(', ') : 'sem perfil definido'}
            </Text>
          </View>
        </View>

        <View style={styles.acoesCabecalho}>
          <ThemeToggleButton />
          <Pressable onPress={logout} hitSlop={8}>
            <Text style={styles.sair}>Sair</Text>
          </Pressable>
        </View>
      </View>

      {corridaAtual && (
        <Pressable
          onPress={() => navigation.navigate('AcompanharCorrida', { corridaId: corridaAtual.id })}
          style={({ pressed }) => [styles.banner, pressed && styles.cardPressionado]}
        >
          <View style={styles.bannerPulso} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitulo}>Corrida em andamento</Text>
            <Text style={styles.bannerTexto}>
              {obterStatusLabel(corridaAtual.status).texto} — toque pra acompanhar
            </Text>
          </View>
        </Pressable>
      )}

      <Pressable
        onPress={() => navigation.navigate('PedirCorrida')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.primaria }, pressed && styles.cardPressionado]}
      >
        <Text style={styles.cardTitulo}>Pedir corrida</Text>
        <Text style={styles.cardTexto}>Informe origem e destino e veja o valor na hora.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Pacotes')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.amarelo }, pressed && styles.cardPressionado]}
      >
        <Text style={styles.cardTitulo}>Pacote de corrida</Text>
        <Text style={styles.cardTexto}>Compre corridas por faixa e deixe prontas pra usar quando precisar.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Planos')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.roxo }, pressed && styles.cardPressionado]}
      >
        <Text style={styles.cardTitulo}>Planos</Text>
        <Text style={styles.cardTexto}>Assine um plano e ganhe desconto e prioridade nas corridas.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('DoarCorrida')}
        style={({ pressed }) => [styles.card, { backgroundColor: '#ec4899' }, pressed && styles.cardPressionado]}
      >
        <Text style={styles.cardTitulo}>Doar corrida</Text>
        <Text style={styles.cardTexto}>Presenteie outra pessoa com uma corrida — sai do seu saldo em reais.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Historico')}
        style={({ pressed }) => [styles.cardClaro, pressed && styles.cardPressionado]}
      >
        <Text style={styles.cardClaroTitulo}>Histórico de corridas</Text>
        <Text style={styles.cardClaroTexto}>Veja suas corridas anteriores.</Text>
      </Pressable>

      <View style={styles.linhaSaldos}>
        <Pressable
          onPress={() => navigation.navigate('SaldoCorrida')}
          style={({ pressed }) => [styles.cardClaro, styles.cardMetade, pressed && styles.cardPressionado]}
        >
          <Text style={styles.cardClaroTitulo}>Saldo de corridas</Text>
          <Text style={styles.cardClaroTexto}>Corridas de pacote disponíveis.</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('Carteira')}
          style={({ pressed }) => [styles.cardClaro, styles.cardMetade, pressed && styles.cardPressionado]}
        >
          <Text style={styles.cardClaroTitulo}>Saldo em reais</Text>
          <Text style={styles.cardClaroTexto}>Ver e recarregar carteira.</Text>
        </Pressable>
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
    padding: 20,
    paddingTop: 24,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  linhaLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
  },
  saudacao: {
    fontSize: 22,
    fontWeight: '700',
    color: cores.texto,
  },
  perfil: {
    fontSize: 13,
    color: cores.textoSecundario,
    marginTop: 2,
  },
  acoesCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sair: {
    fontSize: 14,
    color: cores.textoSecundario,
    paddingVertical: 4,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardPressionado: {
    opacity: 0.85,
  },
  cardTitulo: {
    fontSize: 17,
    fontWeight: '700',
    color: cores.branco,
    marginBottom: 4,
  },
  cardTexto: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
  },
  cardClaro: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
  },
  linhaSaldos: {
    flexDirection: 'row',
    gap: 12,
  },
  cardMetade: {
    flex: 1,
  },
  cardClaroTitulo: {
    fontSize: 15,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 4,
  },
  cardClaroTexto: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  bannerPulso: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#9333ea',
  },
  bannerTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b21a8',
  },
  bannerTexto: {
    fontSize: 12,
    color: '#7e22ce',
    marginTop: 2,
  },
  })
}
