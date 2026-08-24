import { useEffect } from 'react'
import { Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

// Teste de diagnóstico temporário: compara acesso à internet normal (site externo, HTTPS) com
// acesso à API local (rede Wi-Fi, HTTP) — descobre se o problema é geral (app sem internet
// nenhuma) ou específico de acessar IPs da rede local.
function useTesteDeConexao() {
  useEffect(() => {
    const origemApi = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '')

    fetch('https://example.com')
      .then((r) => Alert.alert('Teste INTERNET (example.com)', `OK! status ${r.status}`))
      .catch((e) => Alert.alert('Teste INTERNET (example.com)', `FALHOU: ${e?.message ?? String(e)}`))

    fetch(`${origemApi}/swagger/v1/swagger.json`)
      .then((r) => Alert.alert('Teste API LOCAL', `OK! status ${r.status}`))
      .catch((e) => Alert.alert('Teste API LOCAL', `FALHOU: ${e?.message ?? String(e)}`))
  }, [])
}

export default function App() {
  useTesteDeConexao()

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
