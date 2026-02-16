# Troubleshooting (Supabase Auth + Vercel)

## Invalid API key
**Sintoma**
- Mensagem: `Invalid API key` no browser/console.

**Causa provável**
- `VITE_SUPABASE_ANON_KEY` incorreta, vazia, com espaços, ou key de outro projeto.

**Correção**
1. Copiar novamente a **anon/public key** do projeto correto no Supabase.
2. Atualizar `VITE_SUPABASE_ANON_KEY` no Vercel (Production/Preview/Development).
3. Fazer novo deploy.

---

## POST /auth/v1/token?grant_type=password retornando 401/400
**Sintoma**
- Login falha com 400/401.

**Causa provável**
- Credenciais inválidas (email/senha).
- URL/chave de projeto erradas.
- Domínio/rede bloqueando requisição (CORS/rede).

**Correção**
1. Testar email/senha de um usuário válido no Supabase Auth.
2. Confirmar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` corretos.
3. Validar se o projeto deployado usa o mesmo projeto Supabase esperado.
4. Verificar conectividade/rede e bloqueios de navegador.

---

## `import.meta.env` indefinido
**Sintoma**
- Erros de leitura de env no cliente.

**Causa provável**
- Build sem variáveis `VITE_*`.
- Tentativa de usar variáveis sem prefixo `VITE_` no frontend.

**Correção**
1. Garantir uso de `import.meta.env.VITE_SUPABASE_URL` e `import.meta.env.VITE_SUPABASE_ANON_KEY`.
2. Definir variáveis no ambiente da Vercel e redeployar.
3. Não usar `process.env` no frontend Vite.

---

## Login não funciona após deploy, mas funciona local
**Sintoma**
- Em produção falha; local funciona.

**Causa provável**
- Variáveis não cadastradas em Production na Vercel.

**Correção**
1. Repetir cadastro das envs nos três ambientes da Vercel.
2. Rebuild/redeploy completo.

---

## Segurança: chave exposta
**Sintoma**
- Arquivos versionados com chaves reais.

**Causa provável**
- Scripts/testes/documentação com valores hardcoded.

**Correção**
1. Remover tokens reais do repositório.
2. Usar placeholders (`<SUPABASE_ANON_KEY>`) ou env vars.
3. Rotacionar a chave no Supabase se já houve exposição.
