import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'
import RideMap from '../components/RideMap'
import { FAIXAS, formatarPreco } from '../constants/faixas'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'TransportesEMudanca'>

type Veiculo = {
  id: string
  nome: string
  capacidade: string
  exemplo: string
  icone: keyof typeof MaterialCommunityIcons.glyphMap
  // Um preço por faixa, na mesma ordem de FAIXAS (Azul, Amarela, Laranja, Vermelha, Rosa, Verde, Roxa).
  precos: number[]
}

// Tabela combinada com o usuário — mesma lógica de preço por faixa das corridas normais, com um
// multiplicador por capacidade de carga em vez de por categoria de conforto.
const VEICULOS: Veiculo[] = [
  {
    id: 'moto',
    nome: 'Moto',
    capacidade: 'Até 5 kg',
    exemplo: 'Documentos, encomendas pequenas',
    icone: 'motorbike',
    precos: [7.9, 12.9, 18.9, 24.9, 39.9, 54.9, 69.9],
  },
  {
    id: 'carroPequeno',
    nome: 'Carro pequeno',
    capacidade: 'Até 400 kg',
    exemplo: 'Caixas, bolsas, pequenas mudanças',
    icone: 'car',
    precos: [10.9, 17.9, 25.9, 33.9, 53.9, 74.9, 94.9],
  },
  {
    id: 'furgao',
    nome: 'Furgão',
    capacidade: 'Até 800 kg',
    exemplo: 'Eletrodomésticos, móveis pequenos',
    icone: 'van-utility',
    precos: [15.9, 25.9, 37.9, 49.9, 79.9, 109.9, 139.9],
  },
  {
    id: 'caminhao34',
    nome: 'Caminhão 3/4',
    capacidade: 'Até 3 toneladas',
    exemplo: 'Mudança completa',
    icone: 'truck-outline',
    precos: [22.9, 36.9, 52.9, 69.9, 111.9, 153.9, 195.9],
  },
  {
    id: 'caminhaoTruck',
    nome: 'Caminhão truck',
    capacidade: 'Até 8 toneladas',
    exemplo: 'Grandes mudanças, empresas',
    icone: 'truck',
    precos: [34.9, 55.9, 81.9, 107.9, 171.9, 236.9, 300.9],
  },
]

// Rota só ilustrativa (dois pontos fixos no Rio de Janeiro) — essa tela ainda não calcula
// distância/rota de verdade, ver comentário na Home e na task de backlog.
const ORIGEM_ILUSTRATIVA = { latitude: -22.7556, longitude: -43.4603 }
const DESTINO_ILUSTRATIVO = { latitude: -22.8058, longitude: -43.3407 }
const COR_TEMA = '#0ea5e9'

export default function TransportesEMudancaScreen({ navigation }: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [veiculoId, setVeiculoId] = useState(VEICULOS[0].id)
  const [origem, setOrigem] = useState('')
  const [destino, setDestino] = useState('')

  const veiculo = VEICULOS.find((v) => v.id === veiculoId)!

  function handleInverter() {
    setOrigem(destino)
    setDestino(origem)
  }

  function handleEmBreve() {
    Alert.alert(
      'Em breve',
      'Essa funcionalidade ainda está em desenvolvimento — por enquanto essa tela é só uma prévia, não processa pedidos de verdade.'
    )
  }

  return (
    <ScrollView style={styles.tela} contentContainerStyle={styles.conteudo}>
      <View style={styles.avisoCaixa}>
        <Text style={styles.avisoTexto}>
          🚧 Prévia — essa funcionalidade ainda está em desenvolvimento e não processa pedidos de verdade.
        </Text>
      </View>

      <View style={styles.headerCard}>
        <View style={styles.headerLinha}>
          <View style={styles.headerIconeCaixa}>
            <MaterialCommunityIcons name="truck-fast-outline" size={26} color={COR_TEMA} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitulo}>Leve o que você precisa com praticidade</Text>
            <Text style={styles.headerSubtitulo}>
              Móveis, eletrodomésticos, caixas e muito mais. Preço fixo por distância, sem surpresas.
            </Text>
          </View>
        </View>
        <View style={styles.seloCaixa}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#16a34a" />
          <Text style={styles.seloTexto}>Seguro e confiável</Text>
        </View>
      </View>

      <Text style={styles.secaoTitulo}>1. Escolha o veículo</Text>
      <View style={styles.veiculosGrid}>
        {VEICULOS.map((v) => {
          const selecionado = v.id === veiculoId
          return (
            <Pressable
              key={v.id}
              onPress={() => setVeiculoId(v.id)}
              style={[styles.veiculoCard, selecionado && { borderColor: COR_TEMA, backgroundColor: cores.cartao }]}
            >
              <MaterialCommunityIcons name={v.icone} size={28} color={selecionado ? COR_TEMA : cores.textoSecundario} />
              <Text style={[styles.veiculoNome, selecionado && { color: COR_TEMA }]}>{v.nome}</Text>
              <Text style={styles.veiculoCapacidade}>{v.capacidade}</Text>
              <Text style={styles.veiculoExemplo}>{v.exemplo}</Text>
            </Pressable>
          )
        })}
      </View>

      <Text style={styles.secaoTitulo}>2. Informe origem e destino</Text>
      <View style={styles.enderecoCaixa}>
        <View style={styles.enderecoInputLinha}>
          <View style={[styles.enderecoPonto, { backgroundColor: '#38bdf8' }]} />
          <TextInput
            value={origem}
            onChangeText={setOrigem}
            placeholder="Endereço de origem"
            placeholderTextColor={cores.textoSecundario}
            style={styles.enderecoInput}
          />
        </View>
        <View style={styles.enderecoInputLinha}>
          <View style={[styles.enderecoPonto, { backgroundColor: COR_TEMA }]} />
          <TextInput
            value={destino}
            onChangeText={setDestino}
            placeholder="Endereço de destino"
            placeholderTextColor={cores.textoSecundario}
            style={styles.enderecoInput}
          />
        </View>
        <Pressable onPress={handleInverter} style={styles.inverterBotao}>
          <Ionicons name="swap-vertical-outline" size={16} color={cores.textoSecundario} />
          <Text style={styles.inverterTexto}>Inverter</Text>
        </Pressable>
      </View>

      <View style={styles.mapaContainer}>
        <RideMap origem={ORIGEM_ILUSTRATIVA} destino={DESTINO_ILUSTRATIVO} corHex={COR_TEMA} />
      </View>

      <Text style={styles.secaoTitulo}>3. Valor do transporte — {veiculo.nome}</Text>
      <Text style={styles.secaoSubtitulo}>Preço fixo de acordo com a distância (Vai na Boa)</Text>

      <View style={{ gap: 8 }}>
        {FAIXAS.map((faixa, indice) => (
          <View key={faixa.valor} style={[styles.faixaLinha, { backgroundColor: faixa.hex }]}>
            <Text style={[styles.faixaNome, faixa.textoClaro && styles.textoEscuro]}>
              {faixa.nome} ({faixa.km})
            </Text>
            <Text style={[styles.faixaPreco, faixa.textoClaro && styles.textoEscuro]}>
              {formatarPreco(veiculo.precos[indice])}
            </Text>
          </View>
        ))}
      </View>

      <Pressable onPress={handleEmBreve} style={[styles.botaoConfirmar, { backgroundColor: COR_TEMA }]}>
        <Text style={styles.botaoConfirmarTexto}>Confirmar transporte</Text>
      </Pressable>

      <Pressable onPress={() => navigation.goBack()} style={styles.botaoVoltar}>
        <Text style={styles.botaoVoltarTexto}>Voltar</Text>
      </Pressable>
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
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    avisoCaixa: {
      backgroundColor: '#fef9c3',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    avisoTexto: {
      fontSize: 12,
      color: '#854d0e',
      lineHeight: 17,
    },
    headerCard: {
      backgroundColor: cores.cartao,
      borderRadius: 16,
      padding: 16,
      gap: 12,
    },
    headerLinha: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'flex-start',
    },
    headerIconeCaixa: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: 'rgba(14,165,233,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitulo: {
      fontSize: 15,
      fontWeight: '700',
      color: cores.texto,
    },
    headerSubtitulo: {
      marginTop: 4,
      fontSize: 12,
      color: cores.textoSecundario,
      lineHeight: 17,
    },
    seloCaixa: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(22,163,74,0.1)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    seloTexto: {
      fontSize: 11,
      fontWeight: '700',
      color: '#16a34a',
    },
    secaoTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: cores.texto,
    },
    secaoSubtitulo: {
      marginTop: -12,
      fontSize: 12,
      color: cores.textoSecundario,
    },
    veiculosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    veiculoCard: {
      width: '47%',
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: cores.fundo,
      borderRadius: 14,
      padding: 12,
      gap: 4,
    },
    veiculoNome: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.texto,
      marginTop: 4,
    },
    veiculoCapacidade: {
      fontSize: 11,
      fontWeight: '600',
      color: cores.textoSecundario,
    },
    veiculoExemplo: {
      fontSize: 10,
      color: cores.textoSecundario,
    },
    enderecoCaixa: {
      backgroundColor: cores.cartao,
      borderRadius: 14,
      padding: 14,
      gap: 10,
    },
    enderecoInputLinha: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    enderecoPonto: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    enderecoInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 9,
      fontSize: 13,
      color: cores.texto,
      backgroundColor: cores.fundo,
    },
    inverterBotao: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-end',
    },
    inverterTexto: {
      fontSize: 12,
      fontWeight: '600',
      color: cores.textoSecundario,
    },
    mapaContainer: {
      height: 180,
      borderRadius: 14,
      overflow: 'hidden',
    },
    faixaLinha: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    faixaNome: {
      fontSize: 13,
      fontWeight: '700',
      color: cores.branco,
    },
    faixaPreco: {
      fontSize: 14,
      fontWeight: '800',
      color: cores.branco,
    },
    textoEscuro: {
      color: '#1f2937',
    },
    botaoConfirmar: {
      borderRadius: 12,
      paddingVertical: 15,
      alignItems: 'center',
    },
    botaoConfirmarTexto: {
      color: cores.branco,
      fontSize: 15,
      fontWeight: '700',
    },
    botaoVoltar: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    botaoVoltarTexto: {
      fontSize: 14,
      fontWeight: '600',
      color: cores.texto,
    },
  })
}
