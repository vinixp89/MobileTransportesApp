import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'

const POLITICA_PRIVACIDADE_URL = 'https://claude.ai/code/artifact/ebd321c9-4945-4b9f-9df9-9f1c06f3040a'

export default function SobreAppScreen() {
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.topo}>
        <Image source={require('../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.nome}>Vai na Boa</Text>
        <Text style={styles.versao}>Versão 1.0.0</Text>
      </View>

      <Text style={styles.descricao}>
        O Vai na Boa é o app de corridas que mostra o preço antes de você confirmar — sem surpresa
        no final da viagem.
      </Text>

      <View style={styles.lista}>
        <Pressable onPress={() => Linking.openURL(POLITICA_PRIVACIDADE_URL)} style={styles.linha}>
          <Text style={styles.linhaTexto}>Política de privacidade</Text>
          <Text style={styles.linhaSeta}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL('mailto:contato@vainaboamobilidade.com.br')}
          style={[styles.linha, { borderBottomWidth: 0 }]}
        >
          <Text style={styles.linhaTexto}>Falar com o suporte</Text>
          <Text style={styles.linhaSeta}>›</Text>
        </Pressable>
      </View>

      <Text style={styles.rodape}>© {new Date().getFullYear()} Vai na Boa Mobilidade</Text>
    </ScrollView>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    conteudo: {
      padding: 20,
      paddingTop: 32,
      alignItems: 'center',
      gap: 20,
    },
    topo: {
      alignItems: 'center',
      gap: 4,
    },
    logo: {
      width: 64,
      height: 64,
      marginBottom: 8,
    },
    nome: {
      fontSize: 20,
      fontWeight: '700',
      color: cores.texto,
    },
    versao: {
      fontSize: 13,
      color: cores.textoSecundario,
    },
    descricao: {
      fontSize: 14,
      color: cores.texto,
      textAlign: 'center',
      lineHeight: 20,
    },
    lista: {
      width: '100%',
      backgroundColor: cores.cartao,
      borderRadius: 14,
      overflow: 'hidden',
    },
    linha: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: cores.borda,
    },
    linhaTexto: {
      fontSize: 14,
      color: cores.texto,
      fontWeight: '500',
    },
    linhaSeta: {
      fontSize: 18,
      color: cores.textoSecundario,
    },
    rodape: {
      fontSize: 11,
      color: cores.textoSecundario,
      marginTop: 12,
    },
  })
}
