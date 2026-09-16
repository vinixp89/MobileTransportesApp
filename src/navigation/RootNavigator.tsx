import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { useTema } from '../context/ThemeContext'
import ThemeToggleButton from '../components/ThemeToggleButton'
import LoginScreen from '../screens/LoginScreen'
import CadastroScreen from '../screens/CadastroScreen'
import EsqueciSenhaScreen from '../screens/EsqueciSenhaScreen'
import ConfirmarSmsScreen from '../screens/ConfirmarSmsScreen'
import HomeScreen from '../screens/HomeScreen'
import PedirCorridaScreen from '../screens/PedirCorridaScreen'
import AcompanharCorridaScreen from '../screens/AcompanharCorridaScreen'
import ChatCorridaScreen from '../screens/ChatCorridaScreen'
import PagamentoPixScreen from '../screens/PagamentoPixScreen'
import HistoricoScreen from '../screens/HistoricoScreen'
import PacotesScreen from '../screens/PacotesScreen'
import PlanosScreen from '../screens/PlanosScreen'
import SaldoCorridaScreen from '../screens/SaldoCorridaScreen'
import DoarCorridaScreen from '../screens/DoarCorridaScreen'
import NotificacoesScreen from '../screens/NotificacoesScreen'
import SobreAppScreen from '../screens/SobreAppScreen'
import ConfiguracoesContaScreen from '../screens/ConfiguracoesContaScreen'
import PoliticaPrivacidadeScreen from '../screens/PoliticaPrivacidadeScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

export default function RootNavigator() {
  const { usuario, verificandoSessao, perfil, carregandoPerfil } = useAuth()
  const { cores } = useTema()

  // carregandoPerfil evita mostrar a Home destravada por um instante antes de saber se o telefone
  // já foi confirmado (ver AuthContext) — mesmo spinner de verificandoSessao.
  if (verificandoSessao || (usuario && carregandoPerfil)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator color={cores.primaria} size="large" />
      </View>
    )
  }

  // perfil null (ex: falha de rede ao buscar) não trava o app — só bloqueia quando sabemos de
  // verdade que o telefone ainda não foi confirmado.
  const precisaConfirmarSms = Boolean(usuario) && perfil !== null && !perfil.telefoneVerificado

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: cores.primaria,
        headerStyle: { backgroundColor: cores.cartao },
        headerTitleStyle: { color: cores.texto },
        contentStyle: { backgroundColor: cores.fundo },
        headerRight: () => <ThemeToggleButton />,
      }}
    >
      {precisaConfirmarSms ? (
        <Stack.Screen name="ConfirmarSms" component={ConfirmarSmsScreen} options={{ headerShown: false }} />
      ) : usuario ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="PedirCorrida" component={PedirCorridaScreen} options={{ title: 'Pedir corrida' }} />
          <Stack.Screen name="AcompanharCorrida" component={AcompanharCorridaScreen} options={{ title: 'Acompanhar corrida' }} />
          <Stack.Screen name="ChatCorrida" component={ChatCorridaScreen} options={{ title: 'Chat com o motorista' }} />
          <Stack.Screen name="PagamentoPix" component={PagamentoPixScreen} options={{ title: 'Pagar com Pix' }} />
          <Stack.Screen name="Historico" component={HistoricoScreen} options={{ title: 'Histórico de corridas' }} />
          <Stack.Screen name="Pacotes" component={PacotesScreen} options={{ title: 'Pacote de corrida' }} />
          <Stack.Screen name="Planos" component={PlanosScreen} options={{ title: 'Planos' }} />
          <Stack.Screen name="SaldoCorrida" component={SaldoCorridaScreen} options={{ title: 'Saldo de corridas' }} />
          <Stack.Screen name="DoarCorrida" component={DoarCorridaScreen} options={{ title: 'Doar corrida' }} />
          <Stack.Screen name="Notificacoes" component={NotificacoesScreen} options={{ title: 'Caixa de entrada' }} />
          <Stack.Screen name="SobreApp" component={SobreAppScreen} options={{ title: 'Sobre o app' }} />
          <Stack.Screen name="ConfiguracoesConta" component={ConfiguracoesContaScreen} options={{ title: 'Configurações da conta' }} />
          <Stack.Screen name="PoliticaPrivacidade" component={PoliticaPrivacidadeScreen} options={{ title: 'Política de privacidade' }} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  )
}
