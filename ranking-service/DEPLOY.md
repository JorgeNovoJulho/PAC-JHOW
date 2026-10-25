# Ativar envio automático de recordes

O jogo já possui fila local offline e envia pontuações ao endpoint HTTPS assim que estiver configurado em `data/leaderboard-config.json`. O serviço não está hospedado até você completar as etapas abaixo.

## Cloudflare Workers + D1

1. Crie uma conta Cloudflare e instale `wrangler` no computador: `npm install -g wrangler`; execute `wrangler login`.
2. Na pasta `ranking-service`, execute `wrangler d1 create pac-jhow-ranking`. Copie o identificador retornado para `wrangler.json`, no lugar de `REPLACE_WITH_D1_DATABASE_ID`.
3. Execute `wrangler d1 execute pac-jhow-ranking --remote --file=./schema.sql` para inicializar as tabelas.
4. Crie um GitHub fine-grained Personal Access Token restrito **apenas** ao repositório `JorgeNovoJulho/PAC-JHOW`, com permissão **Contents: Read and write**. Armazene-o **somente no Worker** usando `wrangler secret put GITHUB_TOKEN`. Nunca o coloque em GitHub, no jogo nem nesta conversa.
5. Defina um segredo aleatório para pseudonimização dos IPs: `wrangler secret put IP_SALT`. Use valor longo e exclusivo.
6. Execute `wrangler deploy`. Anote a URL HTTPS pública do Worker (por exemplo, domínio `workers.dev`).
7. Altere `data/leaderboard-config.json` na branch `main`, preenchendo `submissionUrl` com a URL pública do Worker terminada em `/scores` (exemplo: `https://SEU-WORKER.workers.dev/scores`).
8. Teste envio de recorde, aguarde o cron de cinco minutos e verifique `data/leaderboard.json`. O jogo atualizará o Top 10 automaticamente a cada cinco minutos.

## Segurança e limitações

- O GitHub é o canal público de leitura. O Worker, não o jogo, possui a credencial de escrita.
- O serviço impõe validação de formato, tamanho e limite de um envio por IP por minuto e rejeita IDs duplicados.
- **Não há prova de partida válida:** pontuações falsificadas ainda são possíveis; não use esse ranking para premiações. Para competição séria, inclua verificação autoritativa no servidor, autenticação e auditoria/antifraude.
- Nomes e pontuações são públicos; não peça dados pessoais dos jogadores.
- O serviço é independente do instalador; mudar a URL na configuração permite ativá-lo sem recompilar.
- Testar em Windows instalado antes da Release v1.0.5.
