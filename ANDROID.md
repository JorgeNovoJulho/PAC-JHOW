# PAC-JHOW Android — versão inicial de teste

O jogo web é reaproveitado em uma WebView Android pelo Capacitor, sem substituir a compilação Windows existente. O arquivo .github/workflows/android-build.yml gera um APK **debug para testes** e publica em GitHub Actions > Artifacts (não em Releases).

## Instalar o APK de teste
Execute manualmente o workflow "Android APK (test build)" em Actions após integrar a branch. Baixe o artifact, extraia o ZIP e copie app-debug.apk para o dispositivo. O Android poderá solicitar autorização de instalação para a origem do arquivo. Este APK é de desenvolvimento e **não é uma versão final assinada para distribuição**.

## Observações
- O projeto nativo Android é gerado durante a compilação; alterações nativas persistentes exigem versionamento apropriado em uma etapa posterior.
- Os controles por toque usam o mesmo sistema de comandos de teclado do jogo. Testar início, pausa, corrida, bomba, tiro, fotos, áudio, salvamento e ranking em aparelho real.
- O sistema Electron Updater é Windows-only. APK Android exige novas versões e fluxo de instalação próprio, com confirmação do usuário, ou distribuição pela Play Store.
- Antes de publicar a versão de produção: criar keystore de assinatura Android com armazenamento seguro, versionCode crescente, assinar um APK/AAB release, configurar updates Android e confirmar compatibilidade e armazenamento.
- As mudanças de lógica do jogo permanecem nos arquivos compartilhados da raiz.

## Correção de layout mobile

No Android, a partida usa um layout horizontal dedicado, com labirinto centralizado, HUD compacto superior, direcional à esquerda e ações à direita. Em retrato, aparece orientação para girar o telefone. As opções ficam acessíveis pelo ícone ⚙. O desktop mantém o layout original. Esta etapa ainda exige validação de legibilidade e interação em aparelhos reais.

## Layout em retrato (referência arcade)

O modo retrato mantém o labirinto no alto, HUD compacto, direcional ao centro inferior, bomba/corrida à esquerda e tiro/pausa à direita. O modo paisagem anterior continua como alternativa. Testar especificamente aparelhos pequenos e a área de recortes/câmera, pois o APK ainda é beta.

## Ícone oficial Android

A arte oficial deve ser enviada como `assets/android-icon.png` (PNG quadrado de 512×512). O workflow executa `scripts/apply-android-icon.py` para gerar ícones padrão, redondos e adaptativos nas densidades mipmap do Android. Sem esse arquivo, o APK não será compilado, evitando distribuir o ícone genérico do Capacitor. O ícone aparecerá no launcher do dispositivo após instalar a nova compilação.
