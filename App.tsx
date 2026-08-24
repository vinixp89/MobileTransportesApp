import { useEffect } from 'react'
import { Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'
import { pedirPermissaoRedeLocal } from './src/api/permissaoRedeLocal'

// Teste de diagnóstico temporário: confirma que, depois de pedir a permissão de rede local
// (NEARBY_WIFI_DEVICES, ver permissaoRedeLocal.ts), a API local passa a responder.
function useTesteDeConexao() {
  useEffect(() => {
    const origemApi = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '')

    pedirPermissaoRedeLocal().finally(() => {
      fetch(`${origemApi}/swagger/v1/swagger.json`)
        .then((r) => Alert.alert('Teste API LOCAL', `OK! status ${r.status}`))
        .catch((e) => Alert.alert('Teste API LOCAL', `FALHOU: ${e?.message ?? String(e)}`))
    })
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
