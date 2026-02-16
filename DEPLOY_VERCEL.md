# Deploy no Vercel (Vite + Supabase Auth)

## 1) Pré-requisitos
- Projeto Supabase ativo.
- **Project URL** (ex.: `https://<project-ref>.supabase.co`).
- **Anon/Public key** (NÃO usar `service_role`).

## 2) Variáveis de ambiente no Vercel
No painel da Vercel:
1. Abra **Project Settings** → **Environment Variables**.
2. Cadastre as variáveis abaixo em **Production**, **Preview** e **Development**:

- `VITE_SUPABASE_URL` = URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` = chave anon/public do Supabase

> Observação: em Vite, apenas variáveis com prefixo `VITE_` ficam disponíveis no frontend via `import.meta.env`.

## 3) Build Settings esperadas
- Framework: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`

Essas configurações já estão alinhadas no projeto.

## 4) SPA Routing
Este projeto usa Vue Router (SPA). O arquivo `vercel.json` contém rewrite global para `index.html`, garantindo fallback de rotas (`/login`, `/dashboard`, etc.).

## 5) Fluxo de deploy
1. Commit/push na branch.
2. Vercel dispara build automaticamente.
3. Após deploy, acesse `/login`.
4. Valide login com usuário real do Supabase.

## 6) Checklist rápido
- [ ] `VITE_SUPABASE_URL` definida em Production/Preview/Development.
- [ ] `VITE_SUPABASE_ANON_KEY` definida em Production/Preview/Development.
- [ ] Não existe `service_role` no frontend.
- [ ] Build finalizou com sucesso no Vercel.
- [ ] Login funcionando com `supabase.auth.signInWithPassword`.
