import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { cores } from '../theme/colors'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import { criarTelaEmConstrucao } from '../screens/EmConstrucaoScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

const PedirCorridaScreen = criarTelaEmConstrucao(
  '🚗',
  'Pedir corrida ainda vai ganhar mapa, endereço e estimativa de valor por aqui.'
)
const PacotesScreen = criarTelaEmConstrucao(
  '🎟️',
  'Catálogo de pacotes de corrida ainda vai ganhar essa tela.'
)
const PlanosScreen = criarTelaEmConstrucao(
  '⭐',
  'Assinatura de planos ainda vai ganhar essa tela.'
)

export default function RootNavigator() {
  const { usuario, verificandoSessao } = useAuth()

  if (verificandoSessao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: cores.primaria }}>
      {usuario ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PedirCorrida" component={PedirCorridaScreen} options={{ title: 'Pedir corrida' }} />
          <Stack.Screen name="Pacotes" component={PacotesScreen} options={{ title: 'Pacote de corrida' }} />
          <Stack.Screen name="Planos" component={PlanosScreen} options={{ title: 'Planos' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  )
}
