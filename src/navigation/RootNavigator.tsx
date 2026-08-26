import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import ThemeToggleButton from '../components/ThemeToggleButton'
import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import PedirCorridaScreen from '../screens/PedirCorridaScreen'
import AcompanharCorridaScreen from '../screens/AcompanharCorridaScreen'
import HistoricoScreen from '../screens/HistoricoScreen'
import PacotesScreen from '../screens/PacotesScreen'
import PlanosScreen from '../screens/PlanosScreen'
import SaldoCorridaScreen from '../screens/SaldoCorridaScreen'
import CarteiraScreen from '../screens/CarteiraScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { usuario, verificandoSessao } = useAuth()
  const { cores } = useTema()

  if (verificandoSessao) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    )
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: cores.primaria,
        headerStyle: { backgroundColor: cores.cartao },
        headerTitleStyle: { color: cores.texto },
        contentStyle: { backgroundColor: cores.fundo },
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      {usuario ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PedirCorrida" component={PedirCorridaScreen} options={{ title: 'Pedir corrida' }} />
          <Stack.Screen name="AcompanharCorrida" component={AcompanharCorridaScreen} options={{ title: 'Acompanhar corrida' }} />
          <Stack.Screen name="Historico" component={HistoricoScreen} options={{ title: 'Histórico de corridas' }} />
          <Stack.Screen name="Pacotes" component={PacotesScreen} options={{ title: 'Pacote de corrida' }} />
          <Stack.Screen name="Planos" component={PlanosScreen} options={{ title: 'Planos' }} />
          <Stack.Screen name="SaldoCorrida" component={SaldoCorridaScreen} options={{ title: 'Saldo de corridas' }} />
          <Stack.Screen name="Carteira" component={CarteiraScreen} options={{ title: 'Saldo em reais' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  )
}
