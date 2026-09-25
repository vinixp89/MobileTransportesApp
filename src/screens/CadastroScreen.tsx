import { useEffect, useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import EnderecoFields, { enderecoVazio, type Endereco } from '../components/EnderecoFields'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>

type PromocaoStatus = { limite: number; concedidas: number; vagasRestantes: number }
type PromocaoOutubroStatus = { limite: number; concedidas: number; vagasRestantes: number; ativa: boolean }
type FotoSlot = { uri: string; nome: string; tipo: string } | null
type Etapa = 'dados' | 'selfie' | 'termos'

// Abre um Alert perguntando câmera ou galeria — mesmo helper do CadastroScreen do app Motorista.
function escolherFoto(): Promise<FotoSlot> {
  return new Promise((resolve) => {
    Alert.alert('Adicionar selfie', undefined, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
      {
        text: 'Câmera',
        onPress: async () => {
          const permissao = await ImagePicker.requestCameraPermissionsAsync()
          if (!permissao.granted) {
            resolve(null)
            return
          }
          const resultado = await ImagePicker.launchCameraAsync({ quality: 0.7 })
          resolve(paraFotoSlot(resultado))
        },
      },
      {
        text: 'Galeria',
        onPress: async () => {
          const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
          if (!permissao.granted) {
            resolve(null)
            return
          }
          const resultado = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, mediaTypes: ['images'] })
          resolve(paraFotoSlot(resultado))
        },
      },
    ])
  })
}

function paraFotoSlot(resultado: ImagePicker.ImagePickerResult): FotoSlot {
  if (resultado.canceled || !resultado.assets?.[0]) return null

  const asset = resultado.assets[0]
  return { uri: asset.uri, nome: 'selfie.jpg', tipo: asset.mimeType ?? 'image/jpeg' }
}

// Cadastro de Cliente em 3 etapas (dados → selfie → termos) — a 4ª etapa (confirmação por SMS) só
// acontece DEPOIS da conta criada, então não é uma etapa aqui dentro: assim que cadastrar() cria a
// conta, o RootNavigator detecta telefoneVerificado=false (ver AuthContext.perfil) e trava sozinho
// na ConfirmarSmsScreen — essa tela não precisa (nem consegue) navegar pra lá manualmente.
export default function CadastroScreen({ navigation }: Props) {
  const { carregando, cadastrar } = useAuth()
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [etapa, setEtapa] = useState<Etapa>('dados')

  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [endereco, setEndereco] = useState<Endereco>(enderecoVazio)

  const [foto, setFoto] = useState<FotoSlot>(null)

  const [termosTexto, setTermosTexto] = useState('')
  const [carregandoTermos, setCarregandoTermos] = useState(false)
  const [termosAceitos, setTermosAceitos] = useState(false)

  const [enviandoExtras, setEnviandoExtras] = useState(false)
  const [erro, setErro] = useState('')
  const [promocao, setPromocao] = useState<PromocaoStatus | null>(null)
  const [promocaoOutubro, setPromocaoOutubro] = useState<PromocaoOutubroStatus | null>(null)

  // Banners de promoção (ver PromocoesController/PromocaoLancamentoService) — endpoints públicos,
  // então falham em silêncio (sem token ainda, sem conta criada) se a API não responder.
  useEffect(() => {
    api
      .get<PromocaoStatus>('/Promocoes/lancamento')
      .then(({ data }) => setPromocao(data))
      .catch(() => {})

    api
      .get<PromocaoOutubroStatus>('/Promocoes/outubro')
      .then(({ data }) => setPromocaoOutubro(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (etapa !== 'termos' || termosTexto) return

    setCarregandoTermos(true)
    api
      .get<{ texto: string }>('/Config/termos')
      .then(({ data }) => setTermosTexto(data.texto))
      .catch(() => setErro('Não foi possível carregar os termos de uso. Tente de novo.'))
      .finally(() => setCarregandoTermos(false))
  }, [etapa, termosTexto])

  const enderecoResolvido = Boolean(endereco.logradouro)
  const dadosPreenchidos = nome && cpf && telefone && email && senha && confirmarSenha && enderecoResolvido

  async function handleEscolherFoto() {
    const resultado = await escolherFoto()
    if (resultado) setFoto(resultado)
  }

  function handleProximoDados() {
    setErro('')

    if (!dadosPreenchidos) {
      setErro('Preencha todos os campos antes de continuar.')
      return
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    setEtapa('selfie')
  }

  function handleProximoSelfie() {
    setErro('')

    if (!foto) {
      setErro('Tire ou escolha uma selfie antes de continuar.')
      return
    }

    setEtapa('termos')
  }

  // Só chega aqui com a selfie já escolhida e os termos aceitos — cria a conta e, com ela criada,
  // manda a selfie e registra o aceite dos termos. Lenient com falha nesses dois últimos passos
  // (mesmo padrão do app Motorista pras fotos): a conta já existe, então não trava o cadastro por
  // um upload que falhou — só avisa, o cliente pode reenviar depois.
  async function handleFinalizar() {
    setErro('')

    if (!termosAceitos) {
      setErro('Você precisa aceitar os termos de uso pra continuar.')
      return
    }

    const resultado = await cadastrar(email, senha, {
      nome,
      cpf,
      telefone,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      estado: endereco.estado,
    })

    if (!resultado.sucesso) {
      setErro(resultado.mensagem ?? 'Não foi possível criar sua conta.')
      return
    }

    setEnviandoExtras(true)
    const falhas: string[] = []

    try {
      if (foto) {
        const dadosFormulario = new FormData()
        dadosFormulario.append('selfie', { uri: foto.uri, name: foto.nome, type: foto.tipo } as unknown as Blob)
        await api.post('/Clientes/foto-selfie', dadosFormulario, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
    } catch {
      falhas.push('a selfie')
    }

    try {
      await api.post('/Auth/aceitar-termos')
    } catch {
      falhas.push('o aceite dos termos')
    }

    setEnviandoExtras(false)

    if (falhas.length > 0) {
      setErro(`Conta criada, mas ${falhas.join(' e ')} não foram registrados. Tente de novo em Configurações da conta.`)
    }

    // Sem navigation.navigate aqui de propósito: a conta já existe (usuario setado no AuthContext),
    // então o RootNavigator já trocou de stack sozinho — daqui em diante quem decide a próxima tela
    // (ConfirmarSmsScreen ou Home) é ele, olhando perfil.telefoneVerificado.
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>
          {etapa === 'dados' && 'Etapa 1 de 3 — seus dados'}
          {etapa === 'selfie' && 'Etapa 2 de 3 — sua selfie'}
          {etapa === 'termos' && 'Etapa 3 de 3 — termos de uso'}
        </Text>

        <View style={styles.progresso}>
          {(['dados', 'selfie', 'termos'] as Etapa[]).map((e) => (
            <View key={e} style={[styles.progressoBolha, (e === etapa || jaPassou(e, etapa)) && styles.progressoBolhaAtiva]} />
          ))}
        </View>

        {etapa === 'dados' && (
          <>
            {promocao && promocao.vagasRestantes > 0 ? (
              <View style={styles.promoCaixa}>
                <Text style={styles.promoTitulo}>🎉 Promoção de lançamento</Text>
                <Text style={styles.promoTexto}>
                  Restam {promocao.vagasRestantes} de {promocao.limite} vagas! Cadastre-se agora e ganhe 1 corrida
                  grátis (faixa Amarela).
                </Text>
              </View>
            ) : null}

            {promocaoOutubro?.ativa ? (
              <View style={[styles.promoCaixa, styles.promoCaixaAzul]}>
                <Text style={[styles.promoTitulo, styles.promoTituloAzul]}>🎁 Promoção de outubro</Text>
                <Text style={[styles.promoTexto, styles.promoTextoAzul]}>
                  Restam {promocaoOutubro.vagasRestantes} de {promocaoOutubro.limite} vagas! Cadastre-se agora e
                  ganhe 1 corrida grátis (faixa Azul).
                </Text>
              </View>
            ) : null}

            <View style={styles.campo}>
              <Text style={styles.rotulo}>Nome completo</Text>
              <TextInput value={nome} onChangeText={setNome} placeholder="Seu nome" placeholderTextColor="#9ca3af" style={styles.input} />
            </View>

            <View style={styles.linhaDupla}>
              <View style={[styles.campo, styles.campoMetade]}>
                <Text style={styles.rotulo}>CPF</Text>
                <TextInput
                  value={cpf}
                  onChangeText={setCpf}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#9ca3af"
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </View>
              <View style={[styles.campo, styles.campoMetade]}>
                <Text style={styles.rotulo}>Telefone</Text>
                <TextInput
                  value={telefone}
                  onChangeText={setTelefone}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.campo}>
              <Text style={styles.rotulo}>E-mail</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                placeholderTextColor="#9ca3af"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />
            </View>

            <View style={styles.linhaDupla}>
              <View style={[styles.campo, styles.campoMetade]}>
                <Text style={styles.rotulo}>Senha</Text>
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
              <View style={[styles.campo, styles.campoMetade]}>
                <Text style={styles.rotulo}>Confirmar senha</Text>
                <TextInput
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            <EnderecoFields titulo="Endereço" valores={endereco} onChange={setEndereco} />
          </>
        )}

        {etapa === 'selfie' && (
          <View style={styles.campo}>
            <Text style={styles.rotulo}>Selfie</Text>
            <Text style={styles.ajuda}>Usamos pra confirmar que é você mesmo usando a conta.</Text>
            <Pressable onPress={handleEscolherFoto} style={styles.fotoSlot}>
              {foto ? (
                <>
                  <Image source={{ uri: foto.uri }} style={styles.fotoPreview} />
                  <View style={styles.fotoSelo}>
                    <Text style={styles.fotoSeloTexto}>✓ Selfie escolhida</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.fotoIcone}>📷</Text>
                  <Text style={styles.fotoRotulo}>Toque pra tirar ou escolher sua selfie</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {etapa === 'termos' && (
          <View style={styles.campo}>
            <View style={styles.termosCaixa}>
              {carregandoTermos ? (
                <ActivityIndicator color={cores.primaria} />
              ) : (
                <ScrollView style={styles.termosScroll} nestedScrollEnabled>
                  <Text style={styles.termosTexto}>{termosTexto}</Text>
                </ScrollView>
              )}
            </View>

            <Pressable onPress={() => setTermosAceitos((atual) => !atual)} style={styles.checkboxLinha}>
              <View style={[styles.checkbox, termosAceitos && styles.checkboxMarcado]}>
                {termosAceitos ? <Text style={styles.checkboxMarca}>✓</Text> : null}
              </View>
              <Text style={styles.checkboxTexto}>Li e aceito os termos de uso e o contrato de prestação de serviços.</Text>
            </Pressable>
          </View>
        )}

        {erro ? (
          <View style={styles.erroCaixa}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        ) : null}

        <View style={styles.linhaBotoes}>
          <Pressable
            onPress={() => (etapa === 'dados' ? navigation.goBack() : setEtapa(etapa === 'termos' ? 'selfie' : 'dados'))}
            style={styles.botaoVoltar}
          >
            <Text style={styles.botaoVoltarTexto}>{etapa === 'dados' ? 'Cancelar' : 'Voltar'}</Text>
          </Pressable>

          <Pressable
            onPress={etapa === 'dados' ? handleProximoDados : etapa === 'selfie' ? handleProximoSelfie : handleFinalizar}
            disabled={carregando || enviandoExtras || (etapa === 'termos' && !termosAceitos)}
            style={({ pressed }) => [
              styles.botao,
              (carregando || enviandoExtras || (etapa === 'termos' && !termosAceitos)) && styles.botaoDesabilitado,
              pressed && styles.botaoPressionado,
            ]}
          >
            {carregando || enviandoExtras ? (
              <ActivityIndicator color={cores.branco} />
            ) : (
              <Text style={styles.botaoTexto}>{etapa === 'termos' ? 'Criar conta' : 'Próximo'}</Text>
            )}
          </Pressable>
        </View>

        {etapa === 'dados' && (
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.linkVoltar}>
            <Text style={styles.linkVoltarTexto}>Já tenho conta — Entrar</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function jaPassou(etapa: Etapa, atual: Etapa) {
  const ordem: Etapa[] = ['dados', 'selfie', 'termos']
  return ordem.indexOf(etapa) < ordem.indexOf(atual)
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    conteudo: {
      flexGrow: 1,
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    titulo: {
      fontSize: 22,
      fontWeight: '700',
      color: cores.texto,
      marginBottom: 4,
    },
    subtitulo: {
      fontSize: 13,
      color: cores.textoSecundario,
      marginBottom: 12,
    },
    progresso: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 24,
    },
    progressoBolha: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: cores.borda,
    },
    progressoBolhaAtiva: {
      backgroundColor: cores.primaria,
    },
    promoCaixa: {
      backgroundColor: cores.amarelo,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginBottom: 20,
    },
    promoTitulo: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1f2430',
      marginBottom: 4,
    },
    promoTexto: {
      fontSize: 13,
      color: '#1f2430',
      lineHeight: 18,
    },
    promoCaixaAzul: {
      backgroundColor: '#dbeafe',
    },
    promoTituloAzul: {
      color: '#1e3a8a',
    },
    promoTextoAzul: {
      color: '#1d4ed8',
    },
    campo: {
      marginBottom: 16,
    },
    linhaDupla: {
      flexDirection: 'row',
      gap: 12,
    },
    campoMetade: {
      flex: 1,
    },
    rotulo: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.texto,
      marginBottom: 6,
    },
    ajuda: {
      fontSize: 12,
      color: cores.textoSecundario,
      marginBottom: 10,
    },
    input: {
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: cores.texto,
      backgroundColor: cores.cartao,
    },
    fotoSlot: {
      aspectRatio: 1.2,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: cores.borda,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      gap: 6,
      overflow: 'hidden',
      backgroundColor: cores.cartao,
    },
    fotoPreview: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 14,
    },
    fotoIcone: {
      fontSize: 30,
    },
    fotoRotulo: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.texto,
      textAlign: 'center',
    },
    fotoSelo: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingVertical: 8,
    },
    fotoSeloTexto: {
      fontSize: 13,
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
    },
    termosCaixa: {
      height: 260,
      borderWidth: 1,
      borderColor: cores.borda,
      borderRadius: 10,
      backgroundColor: cores.cartao,
      padding: 12,
      justifyContent: 'center',
    },
    termosScroll: {
      flex: 1,
    },
    termosTexto: {
      fontSize: 12,
      lineHeight: 18,
      color: cores.texto,
    },
    checkboxLinha: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 14,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: cores.borda,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    checkboxMarcado: {
      backgroundColor: cores.primaria,
      borderColor: cores.primaria,
    },
    checkboxMarca: {
      color: '#ffffff',
      fontSize: 13,
      fontWeight: '700',
    },
    checkboxTexto: {
      flex: 1,
      fontSize: 13,
      color: cores.texto,
      lineHeight: 18,
    },
    erroCaixa: {
      backgroundColor: cores.erroFundo,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginBottom: 16,
    },
    erroTexto: {
      color: cores.erroTexto,
      fontSize: 13,
    },
    linhaBotoes: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    botaoVoltar: {
      flex: 1,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: cores.borda,
      paddingVertical: 14,
      alignItems: 'center',
    },
    botaoVoltarTexto: {
      fontSize: 15,
      fontWeight: '600',
      color: cores.texto,
    },
    botao: {
      flex: 2,
      backgroundColor: cores.primaria,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
    },
    botaoPressionado: {
      backgroundColor: cores.primariaEscura,
    },
    botaoDesabilitado: {
      opacity: 0.6,
    },
    botaoTexto: {
      color: cores.branco,
      fontSize: 15,
      fontWeight: '600',
    },
    linkVoltar: {
      marginTop: 18,
      alignItems: 'center',
    },
    linkVoltarTexto: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.primaria,
    },
  })
}
