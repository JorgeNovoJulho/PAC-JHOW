# Publicação segura — PAC-JHOW Android e Windows

## Situação
Os workflows de validação não publicam para jogadores. O novo `android-signed-release.yml` é **manual** e exige aprovação do environment `android-production`. Ele só publica um APK se os testes web e a compilação release passarem e a assinatura for verificada. Nenhuma assinatura digital nem segredo deve ser salvo no GitHub como arquivo de código.

## Configuração única do Android
1. Gere e guarde fora do repositório um keystore permanente de assinatura Android. Faça duas cópias de segurança criptografadas e registre alias, senhas e certificado.
2. Em GitHub → Settings → Environments, crie `android-production` com **required reviewers** e restrinja as branches autorizadas.
3. Configure estes secrets no environment:
   - `ANDROID_KEYSTORE_BASE64`: conteúdo binário do keystore codificado em Base64
   - `ANDROID_KEYSTORE_PASSWORD`: senha do keystore
   - `ANDROID_KEY_ALIAS`: alias da chave
   - `ANDROID_KEY_PASSWORD`: senha da chave
4. Em Actions, execute **Android signed release (manual approval)** e informe versão sem prefixo `v` e canal `beta` ou `stable`.
5. Após aprovação, teste o APK em um celular real, confira o certificado e atualize o link de compartilhamento.

**Atenção:** os APKs 1.1.x anteriores foram assinados com chaves debug geradas no ambiente de compilação; o primeiro APK assinado com chave permanente poderá exigir reinstalação, com possível perda do progresso local. Depois da migração, use sempre o mesmo keystore e `applicationId`.

## Android vs Windows
- O código de jogo (labirinto, pontuação, regras, HUD) é compartilhado.
- Os controles (joystick/touch vs teclado/mouse) são específicos da plataforma.
- Os testes Android incluem capturas de tela em vários tamanhos; o Windows tem build de validação separado.
- O atualizador Android consulta apenas Releases Android e solicita confirmação da instalação; **não faz instalação silenciosa**.
- Na etapa atual, Windows e Android são validados separadamente. Uma publicação conjunta com versões alinhadas permanece pendente, assim como testes em hardware real.

## Ranking global e fotos
O servidor oficial publica pontuações verificadas. Foto e perfil público **não devem ser inferidos** de arquivos pessoais do usuário e **não devem ser publicados automaticamente**.
Antes de criar ranking com fotos, implementar consentimento explícito, armazenamento seguro de imagens, moderação, opção de remoção e limites de upload. Não incluir fotos ou identificadores privados em `leaderboard.json` sem essas proteções.

## Checklist antes de liberar
- [ ] Testes de viewport Android e desktop aprovados.
- [ ] APK release assinado; assinatura verificada e certificado registrado.
- [ ] Instalação limpa e atualização sobre versão já assinada testadas.
- [ ] Jogabilidade, áudio, fotos, ranking e suspensão/retorno testados no Android real.
- [ ] Build Windows e regressão visual/jogabilidade verificados.
- [ ] Release, hash SHA-256, changelog e links de download revisados.
