import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import MapaNavegacao from './MapaNavegacao'
import { useNavegacaoGps } from '../hooks/useNavegacaoGps'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import { formatarDistancia, formatarDuracaoRestante, obterIconeInstrucao, type Ponto } from '../utils/navegacaoGps'

type Props = {
  destino: Ponto
  corHex: string
}

// Widget de navegação GPS do Cliente: fica minimizado como um "pill" discreto na tela de
// acompanhar corrida, e só liga o GPS/calcula a rota quando o passageiro toca pra expandir —
// evita gastar bateria com navegação rodando escondida. Expandido, vira um mapa em tela cheia com
// instruções turn-by-turn até o destino da corrida, com botão de minimizar de volta.
export default function NavegacaoFlutuante({ destino, corHex }: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const [expandido, setExpandido] = useState(false)

  const { posicao, heading, rota, progresso, erro } = useNavegacaoGps(expandido ? destino : null)
  const passoProximo = rota && progresso ? rota.passos[progresso.indiceProximo] : undefined

  return (
    <>
      <Pressable
        onPress={() => setExpandido(true)}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressionada]}
      >
        <Text style={styles.pillIcone}>🧭</Text>
        <Text style={styles.pillTexto}>Navegar até o destino</Text>
        <Text style={styles.pillChevron}>▲</Text>
      </Pressable>

      <Modal visible={expandido} animationType="slide" onRequestClose={() => setExpandido(false)}>
        <View style={styles.telaModal}>
          <View style={styles.mapa}>
            {rota && posicao ? (
              <MapaNavegacao pontosRota={rota.pontos} destino={destino} corHex={corHex} posicao={posicao} heading={heading} />
            ) : (
              <View style={styles.mapaCarregando}>
                <ActivityIndicator color={cores.primaria} size="large" />
                <Text style={styles.mapaCarregandoTexto}>{erro || 'Calculando rota...'}</Text>
              </View>
            )}
          </View>

          <Pressable onPress={() => setExpandido(false)} style={styles.botaoMinimizar} hitSlop={10}>
            <Text style={styles.botaoMinimizarTexto}>▾ Minimizar</Text>
          </Pressable>

          {progresso && passoProximo ? (
            <View style={styles.banner}>
              <Text style={styles.bannerIcone}>{obterIconeInstrucao(passoProximo)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerDistancia}>{formatarDistancia(progresso.distanciaProximaManobra)}</Text>
                <Text style={styles.bannerInstrucao}>{passoProximo.instrucao}</Text>
              </View>
            </View>
          ) : null}

          {progresso ? (
            <View style={styles.rodape}>
              <Text style={styles.rodapeTexto}>
                {formatarDistancia(progresso.distanciaRestanteTotal)} · {formatarDuracaoRestante(progresso.duracaoRestanteTotalSegundos)} restantes
              </Text>
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: cores.cartao,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 999,
      paddingVertical: 10,
      paddingHorizontal: 16,
      marginTop: 14,
    },
    pillPressionada: {
      opacity: 0.7,
    },
    pillIcone: {
      fontSize: 16,
    },
    pillTexto: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: cores.texto,
    },
    pillChevron: {
      fontSize: 11,
      color: cores.textoSecundario,
    },
    telaModal: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    mapa: {
      flex: 1,
    },
    mapaCarregando: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor: '#e5e7eb',
    },
    mapaCarregandoTexto: {
      fontSize: 13,
      color: cores.textoSecundario,
      textAlign: 'center',
      paddingHorizontal: 30,
    },
    botaoMinimizar: {
      position: 'absolute',
      top: 48,
      left: 16,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cores.branco,
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 14,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    botaoMinimizarTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: '#1f2430',
    },
    banner: {
      position: 'absolute',
      top: 100,
      left: 16,
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: cores.primariaEscura,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    bannerIcone: {
      fontSize: 24,
    },
    bannerDistancia: {
      fontSize: 16,
      fontWeight: '800',
      color: cores.branco,
    },
    bannerInstrucao: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 1,
    },
    rodape: {
      position: 'absolute',
      bottom: 32,
      alignSelf: 'center',
      backgroundColor: cores.cartao,
      borderRadius: 999,
      paddingVertical: 9,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    rodapeTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.texto,
    },
  })
}
