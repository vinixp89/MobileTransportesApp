import { PermissionsAndroid, Platform } from 'react-native'

// Android 16+ (rollout 2025-2026) passou a bloquear qualquer app de acessar IPs da rede local
// (tipo 192.168.x.x) — igual à nossa API .NET rodando na máquina do desenvolvedor — a não ser
// que o app peça e ganhe essa permissão. Sem ela, a internet normal (sites externos) continua
// funcionando de boa, só a rede local que fica bloqueada. Mais contexto:
// https://developer.android.com/about/versions/16/behavior-changes-16#local-network-protections
export async function pedirPermissaoRedeLocal(): Promise<void> {
  if (Platform.OS !== 'android') return

  try {
    await PermissionsAndroid.request(
      'android.permission.NEARBY_WIFI_DEVICES' as never,
      {
        title: 'Acesso à rede local',
        message: 'O app precisa acessar a rede Wi-Fi local pra funcionar.',
        buttonPositive: 'Permitir',
      }
    )
  } catch {
    // Se o Android dessa versão não tiver essa permissão declarada (versões mais antigas), o
    // request simplesmente não faz efeito — sem problema, é exatamente o comportamento esperado.
  }
}
