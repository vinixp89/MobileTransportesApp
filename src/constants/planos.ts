// Espelha constants/planos.js do front-end web — mapeamento visual (cor) dos planos, o conteúdo
// de verdade (nome, preço, benefícios) vem do catálogo da API (GET /Planos/catalogo).
type EstiloPlano = {
  cor: string
  destaque: boolean
  selo?: string
}

const ESTILO_PLANO: Record<number, EstiloPlano> = {
  0: { cor: '#374151', destaque: false }, // Básico — cinza
  1: { cor: '#16a34a', destaque: true, selo: 'Mais popular' }, // Plus — verde
  2: { cor: '#9333ea', destaque: false }, // Premium — roxo
  3: { cor: '#0284c7', destaque: true, selo: 'Top de linha' }, // Diamante — azul
}

export function obterEstiloPlano(tipo: number): EstiloPlano {
  return ESTILO_PLANO[tipo] ?? ESTILO_PLANO[0]
}

// Espelha StatusAssinatura do backend — enums do backend vêm sempre como número.
export const STATUS_ASSINATURA = {
  PENDENTE_PAGAMENTO: 0,
  ATIVA: 1,
  PAGAMENTO_RECUSADO: 2,
  CANCELADA: 3,
} as const
