import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import RideMap from './RideMap'
import { obterFaixa, formatarPreco, formatarDuracao } from '../constants/faixas'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'

type EnderecoResolvido = {
  logradouro: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  latitude: number
  longitude: number
}

export const CATEGORIA = { NORMAL: 0, EXECUTIVO: 1 } as const

export type Estimativa = {
  origem: EnderecoResolvido
  destino: EnderecoResolvido
  distanciaEstimadaKm: number
  duracaoEstimadaMinutos: number | null
  faixa: number
  valorReferenciaNormal: number
  valorReferenciaExecutivo: number
  avisosEndereco?: string[] | null
}

type Props = {
  estimativa: Estimativa
  modo: 'confirmando' | 'confirmado'
  categoria?: number
  onCategoriaChange?: (categoria: number) => void
  onConfirmar: () => void
  onCancelar: () => void
  confirmando: boolean
  erro: string
  bloqueado?: boolean
  gratisPlano?: boolean
  // Corrida avulsa tem 2 formas de pagar (ver PedirCorridaScreen) — onConfirmar continua sendo
  // cartão/boleto (Checkout Pro, com redirecionamento), onConfirmarPix é o Pix direto (QR Code na
  // hora, sem sair do app).
  avulsa?: boolean
  onConfirmarPix?: () => void
  confirmandoPix?: boolean
}

// Cartão de confirmação/status da corrida — mesmo layout do RideConfirmCard.jsx da web (selo por
// faixa, endereços, mapa, valor Normal/Executivo lado a lado pra comparar).
export default function RideConfirmCard({
  estimativa,
  modo,
  categoria = CATEGORIA.NORMAL,
  onCategoriaChange,
  onConfirmar,
  onCancelar,
  confirmando,
  erro,
  bloqueado = false,
  gratisPlano = false,
  avulsa = false,
  onConfirmarPix,
  confirmandoPix = false,
}: Props) {
  const { cores } = useTema()
  const styles = criarEstilos(cores)
  const faixa = obterFaixa(estimativa.faixa)
  const duracao = formatarDuracao(estimativa.duracaoEstimadaMinutos)
  const valorEscolhido = categoria === CATEGORIA.EXECUTIVO ? estimativa.valorReferenciaExecutivo : estimativa.valorReferenciaNormal

  return (
    <View style={[styles.card, { borderLeftColor: faixa.hex }]}>
      <View style={styles.topo}>
        <View style={[styles.selo, { backgroundColor: faixa.hex }]}>
          <Text style={[styles.seloTexto, faixa.textoClaro && styles.seloTextoEscuro]}>{faixa.nome}</Text>
        </View>
        <Text style={styles.subtexto}>
          {modo === 'confirmado' ? 'Solicitada' : 'Confira antes de confirmar'}
        </Text>
      </View>

      <View style={styles.enderecos}>
        <View style={styles.linhaEndereco}>
          <View style={[styles.ponto, { backgroundColor: '#38bdf8' }]} />
          <Text style={styles.enderecoTexto}>
            {estimativa.origem.logradouro}, {estimativa.origem.numero} — {estimativa.origem.bairro}, {estimativa.origem.cidade}
          </Text>
        </View>
        <View style={styles.linhaPontilhada} />
        <View style={styles.linhaEndereco}>
          <View style={[styles.ponto, { backgroundColor: faixa.hex }]} />
          <Text style={styles.enderecoTexto}>
            {estimativa.destino.logradouro}, {estimativa.destino.numero} — {estimativa.destino.bairro}, {estimativa.destino.cidade}
          </Text>
        </View>
      </View>

      <View style={styles.mapaContainer}>
        <RideMap origem={estimativa.origem} destino={estimativa.destino} corHex={faixa.hex} />
      </View>

      <Text style={[styles.subtexto, { paddingHorizontal: 20, marginTop: 16 }]}>
        {estimativa.distanciaEstimadaKm.toFixed(1)} km{duracao ? ` · ${duracao}` : ''}
      </Text>

      {modo === 'confirmando' && onCategoriaChange ? (
        <View style={styles.opcoesCategoria}>
          <Pressable
            onPress={() => onCategoriaChange(CATEGORIA.NORMAL)}
            style={[
              styles.tileCategoria,
              categoria === CATEGORIA.NORMAL ? { borderColor: faixa.hex } : styles.tileCategoriaInativo,
            ]}
          >
            <Text style={styles.tileCategoriaIcone}>🚗</Text>
            <Text style={styles.tileCategoriaLabel}>Normal</Text>
            <Text style={[styles.tileCategoriaValor, { color: faixa.hex }]}>
              {gratisPlano ? 'Grátis' : formatarPreco(estimativa.valorReferenciaNormal)}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => onCategoriaChange(CATEGORIA.EXECUTIVO)}
            style={[
              styles.tileCategoria,
              categoria === CATEGORIA.EXECUTIVO ? { borderColor: faixa.hex } : styles.tileCategoriaInativo,
            ]}
          >
            <Text style={styles.tileCategoriaIcone}>🚙</Text>
            <Text style={styles.tileCategoriaLabel}>Executivo</Text>
            <Text style={[styles.tileCategoriaValor, { color: faixa.hex }]}>
              {formatarPreco(estimativa.valorReferenciaExecutivo)}
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={[styles.resumo, { justifyContent: 'flex-end' }]}>
          <Text style={[styles.valor, { color: faixa.hex }]}>{gratisPlano ? 'Grátis' : formatarPreco(valorEscolhido)}</Text>
        </View>
      )}

      {modo === 'confirmando' && categoria === CATEGORIA.EXECUTIVO && (
        <Text style={[styles.subtexto, { paddingHorizontal: 20, marginTop: 8 }]}>
          Veículo até 3 anos, sedan médio ou SUV — só disponível como corrida avulsa.
        </Text>
      )}

      {estimativa.avisosEndereco && estimativa.avisosEndereco.length > 0 && (
        <View style={styles.avisoCaixa}>
          {estimativa.avisosEndereco.map((aviso, i) => (
            <Text key={i} style={styles.avisoTexto}>⚠️ {aviso}</Text>
          ))}
        </View>
      )}

      {erro ? <Text style={styles.erroTexto}>{erro}</Text> : null}

      <View style={styles.rodape}>
        {modo === 'confirmando' && avulsa ? (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={onConfirmarPix}
              disabled={confirmando || confirmandoPix || bloqueado}
              style={[
                styles.botaoConfirmar,
                { backgroundColor: faixa.hex },
                (confirmando || confirmandoPix || bloqueado) && styles.desabilitado,
              ]}
            >
              {confirmandoPix ? (
                <ActivityIndicator color={cores.branco} />
              ) : (
                <Text style={styles.botaoConfirmarTexto}>Pagar com Pix</Text>
              )}
            </Pressable>
            <View style={styles.botoes}>
              <Pressable onPress={onCancelar} style={styles.botaoVoltar}>
                <Text style={styles.botaoVoltarTexto}>Voltar</Text>
              </Pressable>
              <Pressable
                onPress={onConfirmar}
                disabled={confirmando || confirmandoPix || bloqueado}
                style={[styles.botaoVoltar, (confirmando || confirmandoPix || bloqueado) && styles.desabilitado]}
              >
                {confirmando ? (
                  <ActivityIndicator color={cores.texto} />
                ) : (
                  <Text style={styles.botaoVoltarTexto}>Cartão / Boleto</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : modo === 'confirmando' ? (
          <View style={styles.botoes}>
            <Pressable onPress={onCancelar} style={styles.botaoVoltar}>
              <Text style={styles.botaoVoltarTexto}>Voltar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmar}
              disabled={confirmando || bloqueado}
              style={[styles.botaoConfirmar, { backgroundColor: faixa.hex }, (confirmando || bloqueado) && styles.desabilitado]}
            >
              {confirmando ? (
                <ActivityIndicator color={cores.branco} />
              ) : (
                <Text style={styles.botaoConfirmarTexto}>Confirmar corrida</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.statusCaixa}>
            <Text style={styles.statusTexto}>Corrida solicitada — aguardando motorista aceitar.</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
  card: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderLeftWidth: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  selo: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  seloTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: cores.branco,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seloTextoEscuro: {
    color: '#1f2937',
  },
  subtexto: {
    fontSize: 12,
    color: cores.textoSecundario,
  },
  enderecos: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 4,
  },
  linhaEndereco: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  linhaPontilhada: {
    marginLeft: 4,
    height: 10,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderLeftColor: '#d1d5db',
  },
  enderecoTexto: {
    flex: 1,
    fontSize: 13,
    color: cores.texto,
  },
  mapaContainer: {
    marginTop: 16,
    paddingHorizontal: 20,
  },
  resumo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  valor: {
    fontSize: 20,
    fontWeight: '800',
  },
  opcoesCategoria: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  tileCategoria: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    backgroundColor: cores.cartao,
  },
  tileCategoriaInativo: {
    borderColor: 'transparent',
    backgroundColor: cores.fundo,
  },
  tileCategoriaIcone: {
    fontSize: 20,
    marginBottom: 2,
  },
  tileCategoriaLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: cores.textoSecundario,
  },
  tileCategoriaValor: {
    marginTop: 2,
    fontSize: 17,
    fontWeight: '800',
  },
  avisoCaixa: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#fef9c3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avisoTexto: {
    fontSize: 12,
    color: '#854d0e',
  },
  erroTexto: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  rodape: {
    padding: 20,
  },
  botoes: {
    flexDirection: 'row',
    gap: 12,
  },
  botaoVoltar: {
    flex: 1,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoVoltarTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
  },
  botaoConfirmar: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  botaoConfirmarTexto: {
    fontSize: 14,
    fontWeight: '700',
    color: cores.branco,
  },
  desabilitado: {
    opacity: 0.6,
  },
  statusCaixa: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statusTexto: {
    fontSize: 13,
    color: cores.textoSecundario,
  },
  })
}
