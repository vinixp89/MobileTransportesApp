import * as Notifications from 'expo-notifications'
import { STATUS_CONFIRMADA, STATUS_EM_ANDAMENTO, STATUS_FINALIZADA, STATUS_CANCELADA } from '../constants/statusCorrida'

const MENSAGENS: Record<number, { titulo: string; corpo: string }> = {
  [STATUS_CONFIRMADA]: {
    titulo: 'Motorista a caminho!',
    corpo: 'Um motorista aceitou sua corrida. Veja o código de confirmação no app.',
  },
  [STATUS_EM_ANDAMENTO]: {
    titulo: 'Viagem iniciada',
    corpo: 'Sua corrida começou. Boa viagem!',
  },
  [STATUS_FINALIZADA]: {
    titulo: 'Corrida finalizada',
    corpo: 'Você chegou! Obrigado por viajar com a Vai na Boa.',
  },
  [STATUS_CANCELADA]: {
    titulo: 'Corrida cancelada',
    corpo: 'Essa corrida foi cancelada.',
  },
}

// Dispara uma notificação local (som + pop-up) quando o status da corrida muda — chamado pela
// tela de acompanhar sempre que o polling detecta uma transição de status.
export async function notificarMudancaDeStatus(statusNovo: number): Promise<void> {
  const mensagem = MENSAGENS[statusNovo]
  if (!mensagem) return

  await Notifications.scheduleNotificationAsync({
    content: {
      title: mensagem.titulo,
      body: mensagem.corpo,
      sound: 'default',
    },
    trigger: null,
  })
}
