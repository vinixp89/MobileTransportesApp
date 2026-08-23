import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>

// Espelha os cards de ação da HomePage do front-end web (Cliente): Pedir corrida, Pacote de
// corrida e Planos, no mesmo verde de marca.
export default function HomeScreen({ navigation }: Props) {
  const { usuario, logout } = useAuth()

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>Olá!</Text>
          <Text style={styles.perfil}>
            Perfil: {usuario?.roles.length ? usuario.roles.join(', ') : 'sem perfil definido'}
          </Text>
        </View>

        <Pressable onPress={logout} hitSlop={8}>
          <Text style={styles.sair}>Sair</Text>
        </Pressable>
      </View>

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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
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
})
