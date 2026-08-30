# Sobrevivência Central V4.0.0

Projeto Capacitor Android. A versão web permanece funcional; o APK usa os mesmos HTML/CSS/JS locais e acrescenta a ponte `CentralBridge` para abrir apps e pastas pelo Android.

## GitHub Actions
O workflow `.github/workflows/build-apk.yml` gera `app-debug.apk` como Artifact.

## Arquivos binários
PDFs, vídeos e imagens da Biblioteca não são colocados em localStorage, IndexedDB, backup JSON nem dentro do APK. O APK guarda apenas metadados/URIs de permissão; os arquivos continuam no armazenamento do aparelho.

## Central V4
Inclui painel do segundo espaço, prontidão, cenários integrados, favoritos de recursos, cartões rápidos, protocolos pessoais, busca central, status técnico, bateria no APK, Biblioteca via Storage Access Framework e abertura de apps conhecidos pelo pacote Android.


## Estrutura do repositório — versão sem pastas

Todos os arquivos do projeto ficam diretamente na raiz do repositório:

- index.html
- manifest.json
- icone.png
- service-worker.js
- capacitor.config.json
- package.json
- prepare-web.mjs
- native-entry.js
- CentralBridgePlugin.java.txt
- patch-android.mjs
- README-APK.md

A única exceção é:

`.github/workflows/build-apk.yml`

Essa pasta é obrigatória para que o GitHub Actions reconheça o workflow.

As pastas `www/`, `android/` e `dist/` são geradas automaticamente durante o build e NÃO precisam ser adicionadas manualmente ao repositório.
