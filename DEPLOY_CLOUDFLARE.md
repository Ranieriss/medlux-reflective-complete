# 🚀 Guia de Deploy - Cloudflare Pages

## ✅ Status
- ✅ Build de produção concluído (pasta `dist/` criada com sucesso)
- ✅ Aplicação pronta para deploy
- ⏳ Aguardando configuração no Cloudflare Pages

---

## 📋 Pré-requisitos

1. **Conta Cloudflare** (gratuita)
   - Criar em: https://dash.cloudflare.com/sign-up
   - Escolher plano FREE (ilimitado e gratuito para sempre)

2. **Repositório GitHub**
   - ✅ Já configurado: https://github.com/Ranieriss/medlux-reflective-complete

---

## 🎯 Método 1: Deploy via Interface Web (RECOMENDADO)

### Passo 1: Acessar Cloudflare Pages
1. Fazer login em: https://dash.cloudflare.com/
2. No menu lateral, clicar em **"Workers & Pages"**
3. Clicar em **"Create application"**
4. Selecionar a aba **"Pages"**
5. Clicar em **"Connect to Git"**

### Passo 2: Conectar GitHub
1. Clicar em **"Connect GitHub"**
2. Autorizar o Cloudflare a acessar seus repositórios
3. Selecionar o repositório: **medlux-reflective-complete**

### Passo 3: Configurar Build
Preencher as seguintes configurações:

- **Project name**: `medlux-reflective` (ou escolha outro nome único)
- **Production branch**: `main`
- **Build command**: `npm run build`
- **Build output directory**: `dist`

### Passo 4: Configurar Variáveis de Ambiente
⚠️ **IMPORTANTE**: Antes de fazer o deploy, adicionar estas variáveis:

Clicar em **"Environment variables"** → **"Add variable"**

```
VITE_SUPABASE_URL=https://earrnuuvdzawclxsyoxk.supabase.co
```

```
VITE_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

### Passo 5: Iniciar Deploy
1. Clicar em **"Save and Deploy"**
2. Aguardar o build (≈ 2-3 minutos)
3. ✅ Após conclusão, sua aplicação estará disponível em:
   - URL padrão: `https://medlux-reflective.pages.dev`
   - Ou nome personalizado que você escolheu

---

## 🎯 Método 2: Deploy via Wrangler CLI (Alternativo)

### Passo 1: Instalar Wrangler (já está instalado no projeto)
```bash
cd /home/user/webapp
npm install --save-dev wrangler
```

### Passo 2: Login no Cloudflare
```bash
npx wrangler login
```
Isso abrirá uma janela do navegador para autenticação.

### Passo 3: Deploy
```bash
npx wrangler pages deploy dist --project-name=medlux-reflective
```

### Passo 4: Configurar Variáveis de Ambiente
Após o primeiro deploy, acessar o Cloudflare Dashboard:
1. Ir em **Workers & Pages**
2. Selecionar o projeto **medlux-reflective**
3. Ir em **Settings** → **Environment variables**
4. Adicionar as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

## 🔧 Configurações Adicionais (Opcional)

### Domínio Personalizado
1. No Cloudflare Pages Dashboard
2. Selecionar seu projeto
3. Ir em **Custom domains**
4. Adicionar seu domínio (ex: `medlux.com.br`)
5. Seguir instruções para configurar DNS

### Redirecionamentos (SPA)
O Cloudflare Pages já configura automaticamente redirecionamentos para SPAs Vue/React.

Se precisar de redirecionamentos customizados, criar arquivo `public/_redirects`:
```
/*    /index.html   200
```

---

## 📊 URLs Finais Esperadas

Após o deploy, sua aplicação estará disponível em:

**Production URL**: `https://medlux-reflective.pages.dev`
- Login: `https://medlux-reflective.pages.dev/login`
- Dashboard: `https://medlux-reflective.pages.dev/dashboard`
- Medição Horizontal: `https://medlux-reflective.pages.dev/medicoes-horizontal`
- Medição Vertical: `https://medlux-reflective.pages.dev/medicoes-vertical`
- Dispositivos: `https://medlux-reflective.pages.dev/dispositivos`

---

## 🔐 Segurança

### Variáveis de Ambiente
✅ As variáveis de ambiente configuradas no Cloudflare são:
- Privadas e seguras
- Não aparecem no código fonte
- Injetadas apenas no momento do build

### HTTPS
✅ Cloudflare fornece automaticamente:
- Certificado SSL/TLS gratuito
- HTTPS obrigatório
- CDN global

---

## 🔄 Deploys Automáticos

Após configuração inicial, todo **git push** para o branch `main` dispara automaticamente:
1. ✅ Build da aplicação
2. ✅ Deploy para produção
3. ✅ Atualização instantânea
4. ✅ Notificação por email

---

## 🎉 Vantagens do Cloudflare Pages

- ✅ **Gratuito** para uso ilimitado
- ✅ **HTTPS** automático
- ✅ **CDN Global** (velocidade máxima mundial)
- ✅ **Deploy automático** do GitHub
- ✅ **Rollback** fácil para versões anteriores
- ✅ **Preview deployments** para cada PR
- ✅ **Domínios personalizados** ilimitados
- ✅ **DDoS protection** automática

---

## 📝 Checklist Final

Antes de fazer o deploy:
- [ ] Repositório GitHub atualizado
- [ ] Build local funcionando (`npm run build` sem erros)
- [ ] Variáveis de ambiente anotadas
- [ ] Conta Cloudflare criada
- [ ] Deploy via interface web iniciado
- [ ] Variáveis de ambiente configuradas no Cloudflare
- [ ] Deploy finalizado com sucesso
- [ ] Teste da aplicação em produção

---

## 🆘 Troubleshooting

### Erro: "Build failed"
**Solução**: Verificar se as variáveis de ambiente foram configuradas corretamente no Cloudflare.

### Erro: "Page not found" ao acessar rotas
**Solução**: O Cloudflare Pages já faz redirecionamento automático para SPAs. Se o erro persistir, criar arquivo `public/_redirects` com conteúdo:
```
/*    /index.html   200
```

### Erro: "Supabase connection failed"
**Solução**: Verificar se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão corretas no painel do Cloudflare.

---

## 📞 Suporte

- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Cloudflare Community**: https://community.cloudflare.com/
- **GitHub Issues**: https://github.com/Ranieriss/medlux-reflective-complete/issues

---

## 🎯 Próximo Passo

**Recomendação**: Use o **Método 1 (Interface Web)** - é o mais simples e intuitivo.

1. Acesse: https://dash.cloudflare.com/
2. Siga os passos do **Método 1** acima
3. Aguarde 2-3 minutos para o deploy
4. Acesse sua aplicação no link fornecido

**Boa sorte! 🚀**
