import { Platform } from 'react-native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import api from '../api/client'

// Mostra a notificação (com som) mesmo com o app aberto em primeiro plano — sem isso, por padrão
// o expo-notifications engole notificações locais enquanto o app está em uso.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

// Pede permissão de notificação (obrigatório perguntar no Android 13+ e sempre no iOS) e cria o
// canal padrão no Android com som — sem canal, o Android ignora o som mesmo se a permissão for
// concedida. Chamar uma vez, ao abrir o app.
export async function configurarNotificacoes(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Corridas',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const permissaoAtual = await Notifications.getPermissionsAsync()

  if (permissaoAtual.status !== 'granted') {
    await Notifications.requestPermissionsAsync()
  }
}

// Manda pro backend o token do Expo Push desse aparelho (ver PushTokensController) — é isso que
// permite notificação chegar mesmo com o app fechado. Chamar depois de logado (login, cadastro ou
// sessão restaurada), nunca antes — sem usuário autenticado o endpoint rejeita a chamada. Emulador
// não tem serviço de push de verdade, então nem tenta; falha de rede/Expo aqui não deve travar o
// login, só perde a notificação até a próxima tentativa.
export async function registrarPushTokenAsync(): Promise<void> {
  if (!Device.isDevice) return

  try {
    const permissaoAtual = await Notifications.getPermissionsAsync()
    if (permissaoAtual.status !== 'granted') return

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })

    await api.post('/PushTokens', { token })
  } catch {
    // Sem rede ou serviço do Expo fora do ar — silencioso de propósito, não é um erro que o
    // usuário precise ver.
  }
}
