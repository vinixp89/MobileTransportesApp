import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { cores } from '../theme/colors'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import PedirCorridaScreen from '../screens/PedirCorridaScreen'
import PacotesScreen from '../screens/PacotesScreen'
import PlanosScreen from '../screens/PlanosScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

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
