# 🚀 Guia de Deploy - Sistema MEDLUX

## 📋 Opções de Deploy

### 1️⃣ **Vercel (Recomendado - Mais Fácil)**

#### Passo a Passo:

1. **Acesse:** https://vercel.com/signup
2. **Conecte com GitHub**
3. **Clique:** "New Project"
4. **Importe:** `medlux-reflective-complete`
5. **Configure:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. **Clique:** "Deploy"

✅ **Pronto!** Em 2-3 minutos seu app estará no ar em:
```
https://seu-projeto.vercel.app
```

---

### 2️⃣ **Netlify**

#### Via Interface:

1. **Acesse:** https://app.netlify.com/
2. **Clique:** "Add new site" → "Import an existing project"
3. **Conecte:** GitHub
4. **Selecione:** `medlux-reflective-complete`
5. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Clique:** "Deploy"

#### Via CLI:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Deploy
cd /home/user/webapp
netlify deploy --prod
```

---

### 3️⃣ **Cloudflare Pages**

1. **Acesse:** https://dash.cloudflare.com/
2. **Vá em:** Pages → "Create a project"
3. **Conecte:** GitHub
4. **Selecione:** `medlux-reflective-complete`
5. **Configure:**
   - Framework: `Vite`
   - Build command: `npm run build`
   - Build output: `dist`
6. **Clique:** "Save and Deploy"

---

### 4️⃣ **GitHub Pages**

```bash
cd /home/user/webapp

# Instalar gh-pages
npm install -D gh-pages

# Adicionar scripts no package.json
# "predeploy": "npm run build"
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

Acesse: `https://ranieriss.github.io/medlux-reflective-complete`

---

## ⚙️ Variáveis de Ambiente

### Criar arquivo `.env.production`

```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_publica
```

### Configurar na Plataforma:

**Vercel:**
1. Settings → Environment Variables
2. Adicionar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

**Netlify:**
1. Site settings → Environment variables
2. Adicionar as mesmas variáveis

**Cloudflare:**
1. Settings → Environment variables
2. Adicionar as mesmas variáveis

---

## 🔧 Deploy via CLI (Vercel)

### Método Mais Rápido:

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Ir para o diretório
cd /home/user/webapp

# 4. Deploy
vercel --prod

# Responda as perguntas:
# - Set up and deploy? Y
# - Which scope? (seu usuário)
# - Link to existing project? N
# - What's your project's name? medlux-reflective
# - In which directory? ./
# - Want to override settings? N
```

✅ **Pronto!** URL será exibida no terminal.

---

## 📱 Domínio Personalizado

### Vercel:

1. **Settings** → **Domains**
2. **Add Domain:** `medlux.com.br`
3. **Configurar DNS:**
   - Tipo: `CNAME`
   - Nome: `@` ou `www`
   - Valor: `cname.vercel-dns.com`

### Netlify:

1. **Domain settings** → **Add custom domain**
2. **Configurar DNS:**
   - Tipo: `A`
   - Nome: `@`
   - Valor: `75.2.60.5`

---

## 🔒 HTTPS (SSL)

✅ **Automático** em todas as plataformas:
- Vercel: SSL gratuito (Let's Encrypt)
- Netlify: SSL gratuito (Let's Encrypt)
- Cloudflare: SSL gratuito

---

## 📊 Monitoramento

### Vercel Analytics (Grátis)

1. **Dashboard** → **Analytics**
2. **Ativar:** Analytics & Speed Insights

### Google Analytics

Adicionar no `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

---

## 🔄 Deploy Automático (CI/CD)

### Configuração:

Todas as plataformas têm **deploy automático** por padrão:

1. **Push para main** → Deploy automático
2. **Pull Request** → Preview deploy
3. **Merge** → Deploy em produção

---

## 📦 Otimizações

### 1. Chunk Size

Já configurado no `vite.config.js`:

```javascript
build: {
  chunkSizeWarningLimit: 1000,
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['vue', 'vue-router', 'pinia'],
        ui: ['vuetify']
      }
    }
  }
}
```

### 2. Compressão

✅ Automática em todas as plataformas (Gzip/Brotli)

### 3. Cache

✅ Automático (imutável para assets com hash)

---

## 🧪 Testar Deploy Local

```bash
cd /home/user/webapp

# Build
npm run build

# Testar localmente
npm run preview

# Acessar: http://localhost:4173
```

---

## ⚠️ Checklist Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Build sem erros (`npm run build`)
- [ ] Testes passando
- [ ] README atualizado
- [ ] vercel.json criado
- [ ] .env.production configurado
- [ ] GitHub atualizado

---

## 🆘 Troubleshooting

### Erro: "Build failed"

```bash
# Limpar cache
rm -rf node_modules dist
npm install
npm run build
```

### Erro: "404 on refresh"

✅ Já resolvido no `vercel.json` (rewrites)

### Erro: "Environment variables not working"

- Verificar se começam com `VITE_`
- Rebuildar após adicionar variáveis
- Verificar em: Settings → Environment Variables

---

## 📞 Suporte

- **Vercel:** https://vercel.com/support
- **Netlify:** https://www.netlify.com/support/
- **Cloudflare:** https://developers.cloudflare.com/pages/

---

## 🎯 URLs Importantes

- **Repositório:** https://github.com/Ranieriss/medlux-reflective-complete
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Netlify Dashboard:** https://app.netlify.com/
- **Cloudflare Dashboard:** https://dash.cloudflare.com/

---

**Data:** 2026-02-15  
**Versão:** 1.0.0  
**Sistema:** MEDLUX Retrorrefletância
