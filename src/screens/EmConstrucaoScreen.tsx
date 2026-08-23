import { StyleSheet, Text, View } from 'react-native'
import { cores } from '../theme/colors'

// Placeholder pras telas que ainda não foram construídas (Pedir corrida, Pacotes, Planos) —
// só pra deixar a navegação da Home já funcionando enquanto cada uma é desenvolvida de verdade.
export function criarTelaEmConstrucao(emoji: string, descricao: string) {
  return function TelaEmConstrucao() {
    return (
      <View style={styles.tela}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={styles.titulo}>Em construção</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: cores.fundo,
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 18,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 6,
  },
  descricao: {
    fontSize: 14,
    color: cores.textoSecundario,
    textAlign: 'center',
  },
})
