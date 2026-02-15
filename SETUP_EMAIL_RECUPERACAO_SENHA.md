# 📧 CONFIGURAÇÃO DE EMAIL NO SUPABASE

## ⚠️ IMPORTANTE
Para que o sistema de recuperação de senha funcione corretamente, é necessário configurar um provedor de email no Supabase Dashboard.

---

## 🚀 PASSOS PARA CONFIGURAR

### 1. Acessar Supabase Dashboard
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login com sua conta
3. Selecione o projeto MEDLUX Reflective

### 2. Configurar Provedor de Email

#### Opção A: Usar Email Padrão do Supabase (Para Testes)
1. Vá em **Authentication** → **Providers**
2. Clique em **Email**
3. Certifique-se que está habilitado
4. Role até **Enable email confirmations** e **ative** se necessário

⚠️ **LIMITAÇÃO**: O email padrão do Supabase tem limite de 4 emails por hora e pode cair na pasta de spam.

#### Opção B: Configurar SMTP Customizado (Recomendado para Produção)
1. Vá em **Project Settings** (ícone de engrenagem)
2. Clique em **Auth** (menu lateral)
3. Role até a seção **SMTP Settings**
4. Clique em **Enable Custom SMTP**

**Configurações para SendGrid:**
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: [Sua API Key do SendGrid]
Sender Email: noreply@seudominio.com
Sender Name: MEDLUX Reflective
```

**Configurações para Mailgun:**
```
Host: smtp.mailgun.org
Port: 587
Username: [Seu username do Mailgun]
Password: [Sua senha do Mailgun]
Sender Email: noreply@seudominio.com
Sender Name: MEDLUX Reflective
```

**Configurações para Gmail:**
```
Host: smtp.gmail.com
Port: 587
Username: seuemail@gmail.com
Password: [Senha de App do Gmail - NÃO a senha normal]
Sender Email: seuemail@gmail.com
Sender Name: MEDLUX Reflective
```

> 💡 **Dica Gmail**: Você precisa gerar uma "Senha de App" em vez de usar sua senha normal:
> 1. Acesse [myaccount.google.com](https://myaccount.google.com)
> 2. Vá em **Segurança** → **Verificação em duas etapas** (ative se não estiver)
> 3. Vá em **Senhas de app**
> 4. Gere uma senha para "Email"
> 5. Use essa senha de 16 dígitos no campo Password

### 3. Personalizar Template de Email

1. Vá em **Authentication** → **Email Templates**
2. Clique em **Reset Password**
3. Personalize o template (opcional):

```html
<h2>Recuperação de Senha - MEDLUX Reflective</h2>
<p>Olá,</p>
<p>Você solicitou a recuperação de senha do sistema MEDLUX Reflective.</p>
<p>Clique no botão abaixo para redefinir sua senha:</p>
<p><a href="{{ .ConfirmationURL }}" style="background-color: #0074D9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a></p>
<p>Ou copie e cole o link abaixo no navegador:</p>
<p>{{ .ConfirmationURL }}</p>
<p>Este link expira em 60 minutos.</p>
<p>Se você não solicitou esta recuperação, ignore este email.</p>
<hr>
<p style="color: #666; font-size: 12px;">MEDLUX Reflective - Sistema de Gestão de Equipamentos</p>
```

4. Clique em **Save**

---

## 🧪 TESTAR RECUPERAÇÃO DE SENHA

### 1. Testar na Interface
1. Acesse a tela de login: `http://localhost:3000/login`
2. Clique em **"Esqueci minha senha"**
3. Digite um email cadastrado no sistema
4. Clique em **"Enviar Link"**

### 2. Verificar Email
1. Abra o email cadastrado
2. Verifique a pasta de **entrada** e **spam**
3. Procure por email de "MEDLUX Reflective" ou "Supabase"

### 3. Redefinir Senha
1. Clique no link do email
2. Será redirecionado para: `http://localhost:3000/redefinir-senha`
3. Digite a nova senha (mínimo 6 caracteres, 1 maiúscula, 1 número)
4. Clique em **"Redefinir Senha"**
5. Será redirecionado para o login
6. Faça login com a nova senha

---

## 🐛 TROUBLESHOOTING

### ❌ Email não chega
**Possíveis causas:**
1. **Provedor de email não configurado**
   - Solução: Configure SMTP customizado (Opção B)

2. **Email na pasta de spam**
   - Solução: Verifique pasta de spam e marque como "não é spam"

3. **Limite de envio atingido** (email padrão Supabase)
   - Solução: Aguarde 1 hora ou configure SMTP customizado

4. **Email não cadastrado no sistema**
   - Solução: Verifique se o usuário existe na tabela `usuarios`

### ❌ Link de recuperação expirado
**Causa:** Links expiram em 60 minutos
**Solução:** Solicitar novo link de recuperação

### ❌ Erro ao redefinir senha
**Possíveis causas:**
1. **Senha não atende requisitos**
   - Mínimo 6 caracteres
   - Pelo menos 1 letra maiúscula
   - Pelo menos 1 número

2. **Token inválido na URL**
   - Solução: Solicitar novo link de recuperação

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

- [ ] Supabase Auth habilitado
- [ ] SMTP configurado (SendGrid, Mailgun, Gmail, etc.)
- [ ] Template de email personalizado (opcional)
- [ ] Teste realizado com email válido
- [ ] Email recebido com sucesso
- [ ] Link funcionando corretamente
- [ ] Redefinição de senha testada

---

## 📞 SUPORTE

### Documentação Oficial
- [Supabase Auth - Password Recovery](https://supabase.com/docs/guides/auth/passwords)
- [Supabase SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)

### Provedores de Email Recomendados
1. **SendGrid** (Grátis: 100 emails/dia)
   - [sendgrid.com](https://sendgrid.com)
   
2. **Mailgun** (Grátis: 5.000 emails/mês - 3 meses)
   - [mailgun.com](https://mailgun.com)
   
3. **Resend** (Grátis: 100 emails/dia)
   - [resend.com](https://resend.com)

---

## ✅ PRÓXIMOS PASSOS

Após configurar o email:

1. **Testar com usuários reais**
   - Use emails válidos dos técnicos/operadores

2. **Configurar RLS (Row Level Security)**
   - Proteger tabela `usuarios` para apenas admins

3. **Monitorar logs de email**
   - Supabase Dashboard → Logs → Auth

4. **Adicionar rate limiting**
   - Evitar spam de solicitações de recuperação

---

**Última atualização**: 2026-02-15
**Versão**: 1.0.0
