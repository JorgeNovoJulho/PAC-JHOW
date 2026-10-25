# Ranking mundial — PAC-JHOW

O jogo lê `data/leaderboard.json` a partir da branch `main` do GitHub e atualiza a visualização automaticamente a cada cinco minutos, com conexão à internet. O placar local continua independente e offline.

## Estado atual
O placar mundial é **somente leitura** e está inicialmente vazio. A publicação de recordes de jogadores **ainda não é automática**. Para aceitar envios automáticos sem expor credenciais no instalador, será necessário um backend com endpoint HTTPS, regras de autenticação, validação de partidas, limites de envio, deduplicação e proteção antifraude. Esse serviço poderá publicar periodicamente dados saneados no arquivo JSON por uma GitHub Action autenticada no servidor, nunca no cliente Electron.

**Não** colocar tokens pessoais, `GITHUB_TOKEN`, PATs ou credenciais administrativas no JavaScript distribuído ao jogador. Não interpretar como confiáveis as pontuações locais: o jogador pode alterar `localStorage`.

## Formato do arquivo
```json
{
  "schemaVersion": 1,
  "updatedAt": null,
  "scores": [
    { "name": "Exemplo", "score": 12345, "level": 4 }
  ]
}
```

Substituir os dados de exemplo por scores validados quando o serviço de submissão estiver pronto. A interface renderiza até 10 pontuações, ordenadas, sem interpretar nomes como HTML.
