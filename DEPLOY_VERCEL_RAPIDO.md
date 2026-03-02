# 🚀 Deploy RÁPIDO no Vercel (5 minutos)

## ✅ **MÉTODO MAIS FÁCIL E RÁPIDO**

### **PASSO 1: Acessar Vercel**

👉 **https://vercel.com/new**

---

### **PASSO 2: Fazer Login**

1. Clique em **"Continue with GitHub"**
2. Autorize o Vercel a acessar seus repositórios

---

### **PASSO 3: Importar Repositório**

1. Na página "Import Git Repository"
2. Procure: **medlux-reflective-complete**
3. Clique em **"Import"**

---

### **PASSO 4: Configurar Projeto**

Na tela de configuração:

#### **Project Name:**

```
medlux-reflective
```

#### **Framework Preset:**

Selecione: **Vite** (ou **Vue.js**)

#### **Build Command:**

```
npm run build
```

#### **Output Directory:**

```
dist
```

#### **Install Command:**

```
npm install
```

---

### **PASSO 5: Adicionar Variáveis de Ambiente**

**MUITO IMPORTANTE!** Clique em **"Environment Variables"** e adicione:

Antes de preencher no Vercel, pegue os valores corretos no **Supabase → Settings → API**.

- Use **Project URL** para `VITE_SUPABASE_URL`.
- Use **Publishable/anon key** (geralmente começa com `eyJ...`) para `VITE_SUPABASE_ANON_KEY`.
- `prj_...` **não** é anon key (não funciona no frontend).

#### **Variável 1:**

**Name:**

```
VITE_SUPABASE_URL
```

**Value:**

```
https://earrnuuvdzawclxsyoxk.supabase.co
```

#### **Variável 2:**

**Name:**

```
VITE_SUPABASE_ANON_KEY
```

**Value:**

```
<SUPABASE_ANON_KEY>
```

---

### **PASSO 6: Deploy**

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. ✅ **Pronto!** Sua aplicação estará online

> Se você alterar qualquer Environment Variable depois do primeiro deploy, faça **Redeploy** para aplicar os novos valores no build.

---

## 🌐 **URL Final**

Após o deploy, você receberá uma URL tipo:

```
https://medlux-reflective.vercel.app
```

---

## ✅ **VANTAGENS DO VERCEL**

- ✅ **Mais simples** que Cloudflare
- ✅ **Deploy automático** do GitHub
- ✅ **HTTPS grátis**
- ✅ **CDN global**
- ✅ **100% gratuito** para projetos pessoais

---

## 🎯 **LINK DIRETO**

👉 **https://vercel.com/new**

---

## 📸 **Me Envie Screenshots**

Tire screenshots de:

1. ✅ Tela de configuração (antes de clicar Deploy)
2. ✅ Tela de sucesso (após deploy)
3. ✅ Aplicação funcionando

---

## 🆘 **Se Tiver Dúvidas**

Me envie screenshot de qualquer etapa que tiver dúvida!

**Boa sorte! 🚀**

---

## ✅ Checklist pós-configuração

- [ ] `VITE_SUPABASE_URL` preenchida com `https://<project-ref>.supabase.co`.
- [ ] `VITE_SUPABASE_ANON_KEY` preenchida com chave `eyJ...`.
- [ ] Nenhum valor `prj_...` foi usado como anon key.
- [ ] Variáveis definidas em Production/Preview/Development.
- [ ] **Redeploy** executado após mudança de variáveis.
- [ ] Login testado e sem erro 401 em `/auth/v1/token`.
