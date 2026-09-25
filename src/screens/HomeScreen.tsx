import { useCallback, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { useFocusEffect } from '@react-navigation/native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import ThemeToggleButton from '../components/ThemeToggleButton'
import MenuHamburguer from '../components/MenuHamburguer'
import LogoIcon from '../components/LogoIcon'
import AvisoModal from '../components/AvisoModal'
import api from '../api/client'
import { obterStatusLabel, STATUS_ATIVOS } from '../constants/statusCorrida'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'
import type { Corrida } from '../types/corrida'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

const INTERVALO_MS = 15000
const STATUS_ASSINATURA_ATIVA = 1

type AssinaturaResumo = { nomePlano: string; status: number }
type PromocaoOutubro = { limite: number; concedidas: number; vagasRestantes: number; ativa: boolean }

// Espelha os cards de ação da HomePage do front-end web (Cliente): Pedir corrida, Pacote de
// corrida e Planos, no mesmo verde de marca. Também mostra um banner de "corrida em andamento"
// quando o cliente tem alguma pendente/confirmada/em andamento — pra ele não perder o fio da
// corrida se sair do app e voltar depois.
export default function HomeScreen({ navigation }: Props) {
  const { usuario, perfil } = useAuth()
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [corridaAtual, setCorridaAtual] = useState<Corrida | null>(null)
  const [assinatura, setAssinatura] = useState<AssinaturaResumo | null>(null)
  const [promocaoOutubro, setPromocaoOutubro] = useState<PromocaoOutubro | null>(null)

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

      // Só busca 1x ao focar a tela (não precisa de polling — muda raramente e a própria tela de
      // Planos já atualiza isso quando o cliente assina/cancela).
      api
        .get<AssinaturaResumo | null>('/Planos/minha-assinatura')
        .then(({ data }) => {
          if (ativo) setAssinatura(data)
        })
        .catch(() => {})

      // Promoção "1 corrida Azul grátis" de 01/10 (ver PromocaoLancamentoService no backend) — só
      // busca 1x ao focar, o servidor já resolve sozinho se está no período e se ainda tem vaga.
      api
        .get<PromocaoOutubro>('/Promocoes/outubro')
        .then(({ data }) => {
          if (ativo) setPromocaoOutubro(data)
        })
        .catch(() => {})

      return () => {
        ativo = false
        clearInterval(intervalo)
      }
    }, [])
  )

  const planoAtivo = assinatura?.status === STATUS_ASSINATURA_ATIVA ? assinatura : null

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <AvisoModal navigation={navigation} />

      <View style={styles.cabecalho}>
        <View style={styles.linhaLogo}>
          <LogoIcon size={40} />
          <View>
            <Text style={styles.saudacao}>Olá{perfil?.nome ? `, ${perfil.nome.split(' ')[0]}` : ''}!</Text>
            <Text style={styles.perfil}>
              Perfil: {usuario?.roles.length ? usuario.roles.join(', ') : 'sem perfil definido'}
            </Text>
          </View>
        </View>

        <View style={styles.acoesCabecalho}>
          <ThemeToggleButton />
          <MenuHamburguer navigation={navigation} />
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

      {promocaoOutubro?.ativa && (
        <Pressable
          onPress={() => navigation.navigate('SaldoCorrida')}
          style={({ pressed }) => [styles.bannerPromo, pressed && styles.cardPressionado]}
        >
          <Ionicons name="gift-outline" size={22} color="#1d4ed8" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerPromoTitulo}>Ganhe 1 corrida grátis!</Text>
            <Text style={styles.bannerPromoTexto}>
              Corrida da faixa Azul, de graça pros próximos cadastros — restam {promocaoOutubro.vagasRestantes} vagas.
            </Text>
          </View>
        </Pressable>
      )}

      <Pressable
        onPress={() => navigation.navigate('PedirCorrida')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.primaria }, pressed && styles.cardPressionado]}
      >
        <Ionicons name="car-outline" size={26} color={cores.branco} style={styles.cardIcone} />
        <Text style={styles.cardTitulo}>Pedir corrida</Text>
        <Text style={styles.cardTexto}>Informe origem e destino e veja o valor na hora.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Pacotes')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.amarelo }, pressed && styles.cardPressionado]}
      >
        <Ionicons name="layers-outline" size={26} color={cores.branco} style={styles.cardIcone} />
        <Text style={styles.cardTitulo}>Pacote de corrida</Text>
        <Text style={styles.cardTexto}>Compre corridas por faixa e deixe prontas pra usar quando precisar.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Planos')}
        style={({ pressed }) => [styles.card, { backgroundColor: cores.roxo }, pressed && styles.cardPressionado]}
      >
        <MaterialCommunityIcons name="crown-outline" size={26} color={cores.branco} style={styles.cardIcone} />
        <Text style={styles.cardTitulo}>Planos</Text>
        <Text style={styles.cardTexto}>
          {planoAtivo
            ? `Plano atual: ${planoAtivo.nomePlano}`
            : 'Assine um plano e ganhe desconto e prioridade nas corridas.'}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('DoarCorrida')}
        style={({ pressed }) => [styles.card, { backgroundColor: '#ec4899' }, pressed && styles.cardPressionado]}
      >
        <Ionicons name="gift-outline" size={26} color={cores.branco} style={styles.cardIcone} />
        <Text style={styles.cardTitulo}>Doar corrida</Text>
        <Text style={styles.cardTexto}>Presenteie outra pessoa com uma corrida de um pacote que você já tem.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('TransportesEMudanca')}
        style={({ pressed }) => [styles.card, styles.cardEmBreve, { backgroundColor: '#0ea5e9' }, pressed && styles.cardPressionado]}
      >
        <View style={styles.badgeEmBreve}>
          <Text style={styles.badgeEmBreveTexto}>Em breve</Text>
        </View>
        <MaterialCommunityIcons name="truck-outline" size={26} color={cores.branco} style={styles.cardIcone} />
        <Text style={styles.cardTitulo}>Transportes e mudança</Text>
        <Text style={styles.cardTexto}>Pequenos e grandes transportes de forma rápida e segura.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('Historico')}
        style={({ pressed }) => [styles.cardClaro, pressed && styles.cardPressionado]}
      >
        <Ionicons name="time-outline" size={22} color={cores.texto} style={styles.cardIcone} />
        <Text style={styles.cardClaroTitulo}>Histórico de corridas</Text>
        <Text style={styles.cardClaroTexto}>Veja suas corridas anteriores.</Text>
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('SaldoCorrida')}
        style={({ pressed }) => [styles.cardClaro, pressed && styles.cardPressionado]}
      >
        <Ionicons name="ticket-outline" size={22} color={cores.texto} style={styles.cardIcone} />
        <Text style={styles.cardClaroTitulo}>Saldo de corridas</Text>
        <Text style={styles.cardClaroTexto}>Corridas de pacote disponíveis.</Text>
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
  cardIcone: {
    marginBottom: 6,
  },
  cardEmBreve: {
    position: 'relative',
  },
  badgeEmBreve: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeEmBreveTexto: {
    fontSize: 10,
    fontWeight: '700',
    color: cores.branco,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
  bannerPromo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  bannerPromoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  bannerPromoTexto: {
    fontSize: 12,
    color: '#1d4ed8',
    marginTop: 2,
  },
  })
}
