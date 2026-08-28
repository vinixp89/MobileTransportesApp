import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'EsqueciSenha'>

// Fluxo em 2 passos: primeiro pede o e-mail (o backend sempre responde com sucesso, exista ou
// não a conta, pra não vazar quais e-mails têm cadastro); depois o código de 6 dígitos que chegou
// por e-mail + a senha nova. Ao redefinir com sucesso, o backend já loga automaticamente.
export default function EsqueciSenhaScreen({ navigation }: Props) {
  const { carregando, esqueciSenha, redefinirSenha } = useAuth()
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [etapa, setEtapa] = useState<'email' | 'codigo'>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')

  async function handleEnviarEmail() {
    setErro('')

    const resultado = await esqueciSenha(email)

    if (!resultado.sucesso) {
      setErro(resultado.mensagem ?? 'Não foi possível enviar o código.')
      return
    }

    setMensagem(resultado.mensagem)
    setEtapa('codigo')
  }

  async function handleRedefinir() {
    setErro('')

    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    const resultado = await redefinirSenha(email, codigo, novaSenha)

    if (!resultado.sucesso) {
      setErro(resultado.mensagem ?? 'Não foi possível redefinir a senha.')
    }
    // Sucesso: o AuthContext já loga o usuário sozinho — a navegação troca pra Home automaticamente.
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Esqueci minha senha</Text>

        {etapa === 'email' ? (
          <>
            <Text style={styles.subtitulo}>Informe seu e-mail — vamos mandar um código pra redefinir sua senha.</Text>

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

            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleEnviarEmail}
              disabled={carregando || !email}
              style={({ pressed }) => [
                styles.botao,
                (carregando || !email) && styles.botaoDesabilitado,
                pressed && styles.botaoPressionado,
              ]}
            >
              {carregando ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.botaoTexto}>Enviar código</Text>}
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.subtitulo}>{mensagem}</Text>

            <View style={styles.campo}>
              <Text style={styles.rotulo}>Código recebido por e-mail</Text>
              <TextInput
                value={codigo}
                onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.inputCodigo]}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.rotulo}>Nova senha</Text>
              <TextInput
                value={novaSenha}
                onChangeText={setNovaSenha}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <View style={styles.campo}>
              <Text style={styles.rotulo}>Confirmar nova senha</Text>
              <TextInput
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry
                style={styles.input}
              />
            </View>

            {erro ? (
              <View style={styles.erroCaixa}>
                <Text style={styles.erroTexto}>{erro}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleRedefinir}
              disabled={carregando || codigo.length !== 6 || !novaSenha || !confirmarSenha}
              style={({ pressed }) => [
                styles.botao,
                (carregando || codigo.length !== 6 || !novaSenha || !confirmarSenha) && styles.botaoDesabilitado,
                pressed && styles.botaoPressionado,
              ]}
            >
              {carregando ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.botaoTexto}>Redefinir senha</Text>}
            </Pressable>

            <Pressable onPress={() => setEtapa('email')} hitSlop={8} style={styles.linkVoltar}>
              <Text style={styles.linkVoltarTexto}>Não recebi o código — tentar de novo</Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.linkVoltar}>
          <Text style={styles.linkVoltarTexto}>Voltar pro login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function criarEstilos(cores: Cores) {
  return StyleSheet.create({
    tela: {
      flex: 1,
      backgroundColor: cores.fundo,
    },
    conteudo: {
      flexGrow: 1,
      justifyContent: 'center',
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
      marginBottom: 24,
    },
    campo: {
      marginBottom: 16,
    },
    rotulo: {
      fontSize: 13,
      fontWeight: '600',
      color: cores.texto,
      marginBottom: 6,
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
    inputCodigo: {
      textAlign: 'center',
      fontSize: 20,
      letterSpacing: 8,
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
    botao: {
      backgroundColor: cores.primaria,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
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
