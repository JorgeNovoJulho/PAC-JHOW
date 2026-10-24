# PAC-JHOW — atualizações

A aplicação instalada tem uma área **⚙️ Opções** onde podes escolher de onde
vêm as atualizações:

1. **GitHub Releases (público)** — predefinido. Lê a última Release do
   repositório `JorgeNovoJulho/PAC-JHOW`. É a forma recomendada para o público.
2. **Servidor próprio / local** — um endereço HTTPS com os ficheiros de
   atualização. Para testes locais é permitido HTTP em `127.0.0.1`.

Em qualquer dos casos, a aplicação **não instala nada sozinha**: procura,
mostra a versão disponível, transfere depois de confirmares e só instala quando
carregas em **Instalar e reiniciar**.

## Testar no teu PC (servidor local)

### 1. Gerar o instalador

```powershell
cd "C:\Users\Acer Nitro 5\Desktop\pacman"
npm install
npm run dist
```

Isto cria em `dist\`:

- `PAC-JHOW-Setup-1.0.1.exe` (instalador)
- `PAC-JHOW-Setup-1.0.1.exe.blockmap`
- `latest.yml` (metadados que a aplicação consulta)

### 2. Ligar o servidor local

Faz duplo clique em **`INICIAR-SERVIDOR-ATUALIZACOES.bat`** ou corre:

```powershell
npm run update-server
```

O servidor fica em **<http://127.0.0.1:8787/>** e serve a pasta `dist`.

### 3. Instalar e configurar a aplicação

1. Instala o `PAC-JHOW-Setup-1.0.1.exe`.
2. Abre o PAC-JHOW e clica em **⚙️ Opções**.
3. Em **Origem das atualizações**, escolhe **Servidor próprio / local**.
4. Em **Endereço do servidor**, mete `http://127.0.0.1:8787/`.
5. Clica em **Guardar** e depois em **Procurar**.

### 4. Simular uma versão nova

Com a versão 1.0.1 instalada:

1. Muda `"version": "1.0.2"` no `package.json`.
2. Gera o novo instalador numa pasta separada (para não bloquear a aplicação
   que está aberta):

   ```powershell
   npx electron-builder --win nsis --x64 --config.directories.output=dist-1.0.2
   ```

3. Copia os três ficheiros novos para a pasta servida:

   ```powershell
   Copy-Item dist-1.0.2\latest.yml dist\
   Copy-Item dist-1.0.2\PAC-JHOW-Setup-1.0.2.exe dist\
   Copy-Item dist-1.0.2\PAC-JHOW-Setup-1.0.2.exe.blockmap dist\
   ```

4. Na aplicação instalada, abre **Opções → Procurar**. Deve aparecer a versão
   1.0.2. Carrega em **Transferir** e depois em **Instalar e reiniciar**.

> O servidor local está ligado a `127.0.0.1`: só o teu PC lhe consegue aceder.
> Para outro computador, usa um servidor HTTPS real (ver abaixo).

## Servidor real (produção)

O servidor pode ser qualquer alojamento estático com HTTPS — nginx, Apache,
Cloudflare Pages, Netlify, um VPS, etc. Basta publicar no mesmo caminho:

```text
https://atualizacoes.exemplo.com/pac-jhow/latest.yml
https://atualizacoes.exemplo.com/pac-jhow/PAC-JHOW-Setup-1.0.1.exe
https://atualizacoes.exemplo.com/pac-jhow/PAC-JHOW-Setup-1.0.1.exe.blockmap
```

Depois, nas **Opções**, escolhe **Servidor próprio / local** e mete o endereço
com barra no fim:

```text
https://atualizacoes.exemplo.com/pac-jhow/
```

Regras importantes:

- Usa **HTTPS**. A aplicação só aceita HTTP em `localhost`/`127.0.0.1`.
- Mantém o `latest.yml` e o `.exe` no mesmo caminho e com os nomes indicados.
- O `latest.yml` contém o `sha512` do instalador; a aplicação verifica a
  integridade depois de transferir.
- Para confirmar o estado, abre `https://.../pac-jhow/latest.yml` no navegador.

## GitHub Releases (recomendado para o projeto público)

O repositório é público, por isso qualquer pessoa pode propor melhorias através
de **Pull Requests**. No entanto, **não há atualização automática a partir de
código de PR**: isso permitiria executar código de terceiros sem revisão.

O fluxo seguro é:

1. Um contribuidor abre um Pull Request.
2. O responsável revê e faz merge na `main`.
3. O responsável sobe a versão no `package.json`, cria uma tag e faz push:

   ```powershell
   git tag v1.0.2
   git push origin v1.0.2
   ```

4. O workflow **Build Windows installer** (`.github/workflows/build-release.yml`)
   compila o instalador e publica automaticamente uma Release com:
   `PAC-JHOW-Setup-1.0.2.exe`, `.blockmap` e `latest.yml`.
5. Quem tem a aplicação com a origem **GitHub Releases** recebe a nova versão
   na próxima verificação (ou clicando em **Procurar**).

Para uma versão manual, também podes executar o workflow em
**Actions → Build Windows installer → Run workflow**. Nesse caso fica apenas
como artefacto de build, sem publicar Release.

### Assinatura de código

O instalador atual não está assinado digitalmente. Por isso o Windows pode
mostrar **“O Windows protegeu o seu PC”** (SmartScreen). Clica em
**Mais informações → Executar mesmo assim** apenas se confiares no ficheiro.

Para distribuição pública sem esse aviso, compra um certificado de assinatura
de código (EV ou OV), configura-o no `electron-builder` e mantém a chave privada
fora do repositório. A verificação `sha512` do `latest.yml` protege a
integridade do download, mas não substitui a assinatura do editor.

## Onde ficam os dados

- Jogo guardado, foto, música e opções: `%APPDATA%\PAC-JHOW\`
- Registo de atualizações: `%APPDATA%\PAC-JHOW\updates.log`
- Foto e música ficam no dispositivo onde foram escolhidas. Desinstalar a
  aplicação não apaga esses dados por predefinição.

## Problemas comuns

| Sintoma | O que verificar |
| --- | --- |
| “Não foi possível ligar ao servidor” | O servidor está ligado? O endereço tem a barra final? A firewall permite a porta? |
| “Não encontrou latest.yml” | O `latest.yml` está na raiz do endereço configurado? |
| Diz que já tem a versão mais recente | A versão do `latest.yml` é maior do que a versão instalada? |
| Transferência falha | O `.exe` e o `latest.yml` correspondem ao mesmo build? Há espaço em disco? |
| Instalação falha | Fecha outras instâncias do PAC-JHOW; o instalador é por utilizador e não precisa de administrador. |

## Atualizar o próprio servidor local

Sempre que gerares uma versão nova, substitui `latest.yml` e o instalador na
pasta `dist` (ou na pasta que passaste com `--dir`). Não é preciso reiniciar o
servidor se ele estiver a servir a pasta; basta atualizar os ficheiros.

## Ficheiros relevantes

- `electron/main.js` — janela, opções, verificação/transferência/instalação.
- `electron/preload.js` — ponte segura entre a interface e o processo principal.
- `settings.js` — área **⚙️ Opções** no jogo.
- `update-server/server.js` — servidor local de testes.
- `.github/workflows/build-release.yml` — build e Release automáticos.
