export type RootStackParamList = {
  Login: undefined
  Cadastro: undefined
  EsqueciSenha: undefined
  Home: undefined
  PedirCorrida: undefined
  AcompanharCorrida: { corridaId: string }
  PagamentoPix: {
    pagamentoGatewayId: string
    qrCodeCopiaCola: string
    qrCodeBase64: string
    // Pra onde ir quando o pagamento aprovar (ou o cliente desistir) — varia conforme o que está
    // sendo pago (corrida avulsa ou pacote de corridas), ver PagamentoPixScreen.
    aoAprovar: { tipo: 'corrida'; corridaId: string } | { tipo: 'pacote' }
  }
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
