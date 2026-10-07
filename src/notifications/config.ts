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
export type ResultadoPush = { ok: boolean; motivo: string }

let ultimoResultado: ResultadoPush = { ok: false, motivo: 'Ainda não tentou registrar.' }

// Resultado da última tentativa de registro — mostrado em Configurações da conta, porque o motivo
// de uma falha aqui não aparece em lugar nenhum (o login nunca deve travar por causa de push).
export function ultimoResultadoPush(): ResultadoPush {
  return ultimoResultado
}

async function tentarRegistrarPushToken(): Promise<ResultadoPush> {
  if (!Device.isDevice) return { ok: false, motivo: 'Emulador/simulador não recebe push.' }

  const permissaoAtual = await Notifications.getPermissionsAsync()
  if (permissaoAtual.status !== 'granted') {
    return { ok: false, motivo: `Permissão de notificação não concedida (${permissaoAtual.status}).` }
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId
  if (!projectId) return { ok: false, motivo: 'projectId do EAS ausente na configuração do app.' }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  await api.post('/PushTokens', { token })

  return { ok: true, motivo: 'Aparelho registrado pra receber notificações.' }
}

// Nunca lança: falha de rede/Expo aqui não pode travar login/cadastro, só perde a notificação até a
// próxima tentativa. O motivo fica guardado em ultimoResultadoPush().
export async function registrarPushTokenAsync(): Promise<ResultadoPush> {
  try {
    ultimoResultado = await tentarRegistrarPushToken()
  } catch (error) {
    ultimoResultado = { ok: false, motivo: error instanceof Error ? error.message : String(error) }
  }

  return ultimoResultado
}
