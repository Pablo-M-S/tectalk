# TecTalk Mobile

App Expo (SDK 58) + Expo Router + TypeScript. Consome a API em `apps/api`.

## Primeira vez

```bash
cd apps/mobile
npm install
npx expo install --fix      # alinha todas as versões ao SDK
eas init                    # cria o projeto no Expo
eas update:configure        # grava updates.url e runtimeVersion no app.json
eas build -p android --profile preview   # gera o APK de teste
```

Commite `package.json`, `package-lock.json` e `app.json` depois desses passos.

## Atualizações sem novo APK (OTA)

Cada push em `main` que mexe em `apps/mobile` publica o JavaScript novo no canal `preview`
(workflow `.github/workflows/eas-update.yml`, secret `EXPO_TOKEN`). O app baixa a atualização
sozinho ao abrir ou voltar para o primeiro plano e mostra um aviso para reiniciar.

Quando é preciso um APK novo: mudou dependência nativa, plugin ou permissão. Nesses casos,
aumente `version` no `app.json` (a `runtimeVersion` segue a versão) e rode o build de novo.

## API

A URL fica em `extra.apiUrl` no `app.json` (ou `EXPO_PUBLIC_API_URL`).
O servidor gratuito dorme por inatividade; o app o acorda ao abrir.
