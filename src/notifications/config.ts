import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

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
