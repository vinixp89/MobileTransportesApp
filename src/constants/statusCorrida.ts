// StatusCorrida vem serializado como número (TransportesApp.Domain/Enums/Enums.cs):
// 0 Solicitada, 1 Confirmada, 2 MotoristaACaminho (não usado ainda), 3 EmAndamento,
// 4 Finalizada, 5 Cancelada.
export const STATUS_LABEL: Record<number, { texto: string; corFundo: string; corTexto: string }> = {
  0: { texto: 'Solicitada', corFundo: '#f3f4f6', corTexto: '#374151' },
  1: { texto: 'Motorista a caminho', corFundo: '#dcfce7', corTexto: '#15803d' },
  2: { texto: 'A caminho', corFundo: '#dcfce7', corTexto: '#15803d' },
  3: { texto: 'Em andamento', corFundo: '#fef9c3', corTexto: '#854d0e' },
  4: { texto: 'Finalizada', corFundo: '#dcfce7', corTexto: '#15803d' },
  5: { texto: 'Cancelada', corFundo: '#fee2e2', corTexto: '#b91c1c' },
}

export function obterStatusLabel(status: number) {
  return STATUS_LABEL[status] ?? STATUS_LABEL[0]
}

export const STATUS_SOLICITADA = 0
export const STATUS_CONFIRMADA = 1
export const STATUS_EM_ANDAMENTO = 3
export const STATUS_FINALIZADA = 4
export const STATUS_CANCELADA = 5

// Status que ainda contam como "corrida em andamento" pro banner na Home.
export const STATUS_ATIVOS = [STATUS_SOLICITADA, STATUS_CONFIRMADA, STATUS_EM_ANDAMENTO]
