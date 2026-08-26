import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { coresClaras, coresEscuras, type Cores } from '../theme/colors'

const CHAVE_TEMA = 'tema'

type Tema = 'light' | 'dark'

type ThemeContextType = {
  tema: Tema
  cores: Cores
  alternarTema: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

// Tema claro/escuro com preferência salva (AsyncStorage) — na primeira vez que abre o app, usa o
// tema do sistema operacional como ponto de partida; depois que o cliente troca manualmente uma
// vez, essa escolha vale até ele trocar de novo (mesma ideia do ThemeContext do front-end web).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const temaSistema = useColorScheme()
  const [tema, setTema] = useState<Tema>(temaSistema === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_TEMA).then((salvo) => {
      if (salvo === 'light' || salvo === 'dark') setTema(salvo)
    })
    // Só lê 1x ao abrir o app — depois disso quem manda é a escolha manual (alternarTema).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function alternarTema() {
    setTema((atual) => {
      const novo = atual === 'light' ? 'dark' : 'light'
      AsyncStorage.setItem(CHAVE_TEMA, novo).catch(() => {})
      return novo
    })
  }

  const cores = tema === 'dark' ? coresEscuras : coresClaras

  return <ThemeContext.Provider value={{ tema, cores, alternarTema }}>{children}</ThemeContext.Provider>
}

export function useTema() {
  const contexto = useContext(ThemeContext)

  if (!contexto) {
    throw new Error('useTema precisa ser usado dentro de um <ThemeProvider>')
  }

  return contexto
}
