# Vai na Boa — App do Cliente (Android)

App mobile do perfil **Cliente**, em React Native + Expo, consumindo a mesma API .NET do
[TransportesApp](https://github.com/vinixp89/TransportesApp) que o
[FrontTransportesApp](https://github.com/vinixp89/FrontTransportesApp) (versão web) já usa.

## O que já tem

- Login (JWT, mesmo endpoint `/Auth/login` da web), com sessão persistida no aparelho.
- Home com os cards de ação do Cliente (Pedir corrida, Pacote de corrida, Planos).
- Navegação entre telas (React Navigation).

As telas de "Pedir corrida", "Pacote de corrida" e "Planos" ainda são placeholders
("Em construção") — só a navegação já está pronta, o conteúdo de cada uma é o próximo passo.

## Rodando o projeto

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar a URL da API

Copie o `.env.example` pra `.env` e ajuste a URL da API .NET:

```bash
cp .env.example .env
```

- **Emulador Android**: `http://10.0.2.2:5000/api` (o Android mapeia esse IP pro `localhost` da
  sua máquina).
- **Celular físico**: use o IP da sua máquina na rede local (ex: `http://192.168.0.10:5000/api`)
  — `localhost` não funciona nesse caso porque é o próprio celular, não o computador.

### 3. Subir o app

```bash
npm run start
```

Isso abre o Metro Bundler com um QR code no terminal. Duas formas de testar:

- **No seu celular Android**: instale o app **Expo Go** (Play Store) e escaneie o QR code —
  precisa estar na mesma rede Wi-Fi que o computador.
- **No emulador Android**: com o Android Studio + um emulador já configurados, rode
  `npm run android` (ou aperte `a` no terminal do Metro).

Também dá pra rodar no navegador com `npm run web`, útil pra iterar rápido no layout (algumas
APIs nativas, como o armazenamento seguro do token, não funcionam 100% no navegador — só no
celular/emulador de verdade).

## Estrutura

```
src/
  api/          axios + client HTTP, armazenamento do token (SecureStore)
  context/      AuthContext (login/logout/sessão)
  navigation/   RootNavigator (troca Login ⇄ telas logadas)
  screens/      cada tela do app
  theme/        cores da marca
```

## Próximos passos

- Tela de "Pedir corrida" de verdade (endereço, mapa, estimativa de valor, confirmação).
- Pacotes de corrida e Planos (catálogo, assinatura/compra).
- Carteira e extrato.
- Ícone e splash screen com a arte oficial da marca (hoje usa os placeholders padrão do Expo).
