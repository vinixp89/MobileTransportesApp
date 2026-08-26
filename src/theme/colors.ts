// Paleta da "Vai na Boa" — mesma cor de marca do Cliente usada no front-end web
// (FrontTransportesApp/src/constants/brand.js: CORES_PERFIL.Cliente), com uma versão clara e uma
// escura (ver ThemeContext) — os nomes das chaves são os mesmos nas duas, só o valor muda.
export const coresClaras = {
  primaria: '#16a34a',
  primariaEscura: '#15803d',
  primariaClara: '#f0fdf4',
  amarelo: '#eab308',
  roxo: '#9333ea',
  fundo: '#f0fdf4',
  cartao: '#ffffff',
  texto: '#1f2430',
  textoSecundario: '#6b7280',
  borda: '#d1d5db',
  erroFundo: '#fef2f2',
  erroTexto: '#b91c1c',
  branco: '#ffffff',
}

export const coresEscuras: Cores = {
  primaria: '#22c55e',
  primariaEscura: '#16a34a',
  primariaClara: '#052e16',
  amarelo: '#eab308',
  roxo: '#a855f7',
  fundo: '#0b0f14',
  cartao: '#1c2128',
  texto: '#f3f4f6',
  textoSecundario: '#9ca3af',
  borda: '#374151',
  erroFundo: '#450a0a',
  erroTexto: '#fca5a5',
  branco: '#ffffff',
}

export type Cores = typeof coresClaras
