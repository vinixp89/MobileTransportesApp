import { useEffect, useState } from 'react'
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
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import EnderecoFields, { enderecoVazio, type Endereco } from '../components/EnderecoFields'
import type { Cores } from '../theme/colors'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'Cadastro'>

type PromocaoStatus = { limite: number; concedidas: number; vagasRestantes: number }

// Formulário de cadastro de Cliente — espelha os campos exigidos pelo backend
// (POST /Auth/registrar-cliente: email, senha, cliente{nome,cpf,telefone,endereço}).
export default function CadastroScreen({ navigation }: Props) {
  const { carregando, cadastrar } = useAuth()
  const { cores } = useTema()
  const styles = criarEstilos(cores)

  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [endereco, setEndereco] = useState<Endereco>(enderecoVazio)
  const [erro, setErro] = useState('')
  const [promocao, setPromocao] = useState<PromocaoStatus | null>(null)

  // Banner da promoção de lançamento (ver PromocoesController/PromocaoLancamentoService) — endpoint
  // público, então falha em silêncio (sem token ainda, sem conta criada) se a API não responder.
  useEffect(() => {
    api
      .get<PromocaoStatus>('/Promocoes/lancamento')
      .then(({ data }) => setPromocao(data))
      .catch(() => {})
  }, [])

  const enderecoResolvido = Boolean(endereco.logradouro)
  const camposObrigatoriosPreenchidos =
    nome && cpf && telefone && email && senha && confirmarSenha && enderecoResolvido

  async function handleCadastrar() {
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem.')
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
    }
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>Preencha seus dados pra começar a pedir corridas.</Text>

        {promocao && promocao.vagasRestantes > 0 ? (
          <View style={styles.promoCaixa}>
            <Text style={styles.promoTitulo}>🎉 Promoção de lançamento</Text>
            <Text style={styles.promoTexto}>
              Restam {promocao.vagasRestantes} de {promocao.limite} vagas! Cadastre-se agora e ganhe 1 corrida grátis
              (faixa Amarela).
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

        {erro ? (
          <View style={styles.erroCaixa}>
            <Text style={styles.erroTexto}>{erro}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={handleCadastrar}
          disabled={carregando || !camposObrigatoriosPreenchidos}
          style={({ pressed }) => [
            styles.botao,
            (carregando || !camposObrigatoriosPreenchidos) && styles.botaoDesabilitado,
            pressed && styles.botaoPressionado,
          ]}
        >
          {carregando ? <ActivityIndicator color={cores.branco} /> : <Text style={styles.botaoTexto}>Criar conta</Text>}
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.linkVoltar}>
          <Text style={styles.linkVoltarTexto}>Já tenho conta — Entrar</Text>
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
