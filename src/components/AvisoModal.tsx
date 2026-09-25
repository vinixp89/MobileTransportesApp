import { useEffect, useState } from 'react'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Aviso = {
  id: string
  titulo: string
  texto: string
  corFundoHex: string
  textoBotao: string | null
  telaDestino: string | null
}

const CHAVE_VISTOS = '@vainaboa/avisos-vistos'

async function jaViu(id: string): Promise<boolean> {
  try {
    const vistos = await AsyncStorage.getItem(CHAVE_VISTOS)
    return vistos ? JSON.parse(vistos).includes(id) : false
  } catch {
    return false
  }
}

async function marcarComoVisto(id: string) {
  try {
    const vistos = await AsyncStorage.getItem(CHAVE_VISTOS)
    const lista: string[] = vistos ? JSON.parse(vistos) : []
    if (!lista.includes(id)) {
      // Guarda só os últimos 30 IDs — não tem por que esse array crescer pra sempre.
      await AsyncStorage.setItem(CHAVE_VISTOS, JSON.stringify([...lista, id].slice(-30)))
    }
  } catch {
    // Não visto salvo não é grave — na pior hipótese o aviso aparece de novo uma vez.
  }
}

// Pop-up de promoção/novidade configurado pelo Admin (ver AvisosController) — busca o aviso ativo
// ao montar a Home, mostra uma vez por pessoa (guarda o ID visto no AsyncStorage) e nunca trava a
// tela se a busca falhar (só não mostra nada).
export default function AvisoModal({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList, 'Home'> }) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    let ativo = true

    api
      .get<Aviso | null>('/Avisos/ativo')
      .then(async ({ data }) => {
        if (!ativo || !data) return
        if (await jaViu(data.id)) return
        setAviso(data)
        setVisivel(true)
      })
      .catch(() => {
        // Falha isolada não deve incomodar quem só quer usar o app.
      })

    return () => {
      ativo = false
    }
  }, [])

  function fechar() {
    setVisivel(false)
    if (aviso) marcarComoVisto(aviso.id)
  }

  function tocarBotao() {
    if (!aviso) return
    const destino = aviso.telaDestino
    fechar()
    if (destino) {
      navigation.navigate(destino as never)
    }
  }

  if (!aviso) return null

  return (
    <Modal visible={visivel} transparent animationType="fade" onRequestClose={fechar}>
      <View style={styles.fundo}>
        <View style={styles.cartao}>
          <View style={[styles.faixa, { backgroundColor: aviso.corFundoHex }]}>
            <Pressable onPress={fechar} style={styles.fechar} hitSlop={10}>
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
            <Ionicons name="megaphone-outline" size={30} color="#fff" />
          </View>

          <View style={styles.corpo}>
            <Text style={styles.titulo}>{aviso.titulo}</Text>
            <Text style={styles.texto}>{aviso.texto}</Text>

            {aviso.textoBotao ? (
              <Pressable onPress={tocarBotao} style={[styles.botao, { backgroundColor: cores.primaria }]}>
                <Text style={styles.botaoTexto}>{aviso.textoBotao}</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={fechar} style={styles.depois}>
              <Text style={styles.depoisTexto}>{aviso.textoBotao ? 'Agora não' : 'Fechar'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    fundo: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    cartao: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: cores.cartao,
      borderRadius: 18,
      overflow: 'hidden',
    },
    faixa: {
      height: 92,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fechar: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    corpo: {
      padding: 20,
      gap: 8,
    },
    titulo: {
      fontSize: 17,
      fontWeight: '800',
      color: cores.texto,
    },
    texto: {
      fontSize: 13,
      color: cores.textoSecundario,
      lineHeight: 19,
    },
    botao: {
      marginTop: 8,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: 'center',
    },
    botaoTexto: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '700',
    },
    depois: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    depoisTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.textoSecundario,
    },
  })
}
