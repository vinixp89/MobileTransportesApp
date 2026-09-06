export type RootStackParamList = {
  Login: undefined
  Cadastro: undefined
  EsqueciSenha: undefined
  Home: undefined
  PedirCorrida: undefined
  AcompanharCorrida: { corridaId: string }
  PagamentoPix: { corridaId: string; pagamentoGatewayId: string; qrCodeCopiaCola: string; qrCodeBase64: string }
  Historico: undefined
  Pacotes: undefined
  Planos: undefined
  SaldoCorrida: undefined
  DoarCorrida: undefined
  Notificacoes: undefined
  SobreApp: undefined
  ConfiguracoesConta: undefined
  PoliticaPrivacidade: undefined
}
