import axios from 'axios'
import { apagarToken, lerToken } from './tokenStorage'

// Aponta pra API .NET (ver README) — em variável de ambiente EXPO_PUBLIC_* pra ficar
// disponível no bundle (Expo injeta automaticamente qualquer EXPO_PUBLIC_ do .env).
const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  // Sem isso, uma rede que trava silenciosamente (ex: firewall derrubando o pacote sem responder)
  // deixa a requisição pendurada pra sempre, sem nunca cair no catch — o app fica girando o
  // spinner eternamente sem nenhuma mensagem de erro.
  timeout: 15000,
})

// Anexa o token JWT salvo no login em toda requisição, automaticamente — mesmo padrão do
// front-end web (client.js), só que com SecureStore no lugar de localStorage.
api.interceptors.request.use(async (config) => {
  const token = await lerToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// Se o token expirar ou for inválido, a API responde 401 — quem escuta isso decide deslogar
// (ver AuthContext), o client só limpa o token salvo.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await apagarToken()
    }

    return Promise.reject(error)
  }
)

// Tenta extrair uma mensagem de erro legível das respostas da API (formato { mensagem: "..." },
// lista de erros do Identity, ou erro genérico de validação do ASP.NET) — mesma lógica do web.
export function extrairMensagemErro(error: unknown): string {
  if ((error as { code?: string })?.code === 'ECONNABORTED') {
    return 'A API demorou demais pra responder (timeout de 15s). Confira se o celular e o computador estão na mesma rede e se o firewall libera a porta da API.'
  }

  const data = (error as { response?: { data?: unknown } })?.response?.data as
    | { mensagem?: string; errors?: Record<string, string[]> }
    | string
    | undefined

  if (!data) return 'Não foi possível contatar a API. Confira se ela está rodando e se o EXPO_PUBLIC_API_URL está certo.'

  if (typeof data === 'string') return data
  if (data.mensagem) return data.mensagem
  if (Array.isArray(data)) return (data as string[]).join(', ')

  if (data.errors) {
    return Object.values(data.errors).flat().join(', ')
  }

  return 'Ocorreu um erro inesperado.'
}

export default api
