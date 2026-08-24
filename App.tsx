import { useEffect } from 'react'
import { Alert } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

// Teste de diagnóstico temporário: mostra o resultado de um GET simples DIRETO NA TELA do
// celular (em vez de depender do log aparecer no terminal do Metro, que não estava confiável)
// — serve pra descobrir se é só o POST do login que falha, ou qualquer requisição do app.
function useTesteDeConexao() {
  useEffect(() => {
    const origemApi = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/api\/?$/, '')

    Alert.alert('Teste de conexão', `Testando: ${origemApi}/swagger/v1/swagger.json`)

    fetch(`${origemApi}/swagger/v1/swagger.json`)
      .then((r) => Alert.alert('Teste de conexão', `OK! status ${r.status}`))
      .catch((e) => Alert.alert('Teste de conexão', `FALHOU: ${e?.message ?? String(e)}`))
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
