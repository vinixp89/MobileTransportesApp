// Espelha TransportesApp.Domain.Enums.StatusPagamento (backend) — a ordem dos valores importa,
// esse enum é serializado como número.
export const STATUS_PAGAMENTO = {
  PENDENTE: 0,
  EM_PROCESSAMENTO: 1,
  APROVADO: 2,
  RECUSADO: 3,
  CANCELADO: 4,
  ESTORNADO: 5,
} as const
