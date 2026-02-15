# 🚀 MEDLUX Reflective - Guia de Integração com Supabase

## 📋 Checklist de Implementação

### ✅ Fase 1: Configuração do Supabase (15 minutos)
- [ ] Criar conta no Supabase
- [ ] Criar projeto "medlux-reflective"
- [ ] Copiar credenciais (URL + API Key)
- [ ] Executar script SQL no editor do Supabase

### ✅ Fase 2: Configuração do Frontend (já feito)
- [x] Instalar @supabase/supabase-js
- [ ] Criar arquivo de configuração
- [ ] Criar serviço de integração
- [ ] Migrar autenticação

### ✅ Fase 3: Migração de Dados
- [ ] Importar 23 equipamentos do backup
- [ ] Criar usuários iniciais
- [ ] Testar sincronização

---

## 🎯 Passo 1: Criar Projeto no Supabase

### 1.1 Acessar Supabase
1. Abra: **https://supabase.com**
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou Email

### 1.2 Criar Novo Projeto
1. Clique em **"New Project"**
2. Preencha os dados:
   ```
   Name: medlux-reflective
   Database Password: [CRIE UMA SENHA FORTE - ANOTE!]
   Region: South America (São Paulo) ou US East (Ohio)
   Pricing Plan: Free
   ```
3. Clique em **"Create new project"**
4. **Aguarde 2-3 minutos** (o Supabase vai provisionar o banco PostgreSQL)

### 1.3 Copiar Credenciais
Quando o projeto estiver pronto:
1. No menu lateral esquerdo, clique em **⚙️ Project Settings**
2. Clique em **API** (no submenu)
3. Na seção "Project API keys", você verá:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: Uma chave longa começando com `eyJ...`

**📝 COPIE ESSAS DUAS INFORMAÇÕES E COLE AQUI (ou me envie):**

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🗄️ Passo 2: Criar Banco de Dados

### 2.1 Abrir SQL Editor
1. No menu lateral esquerdo, clique em **🔧 SQL Editor**
2. Clique em **"+ New query"**

### 2.2 Executar Script SQL
1. Abra o arquivo `supabase-schema.sql` (na raiz do projeto)
2. **Copie TODO o conteúdo** do arquivo
3. **Cole no SQL Editor** do Supabase
4. Clique em **"RUN"** (ou pressione Ctrl+Enter)
5. Aguarde a execução (leva ~10 segundos)
6. Você verá mensagens de sucesso:
   ```
   ✅ Schema do MEDLUX Reflective criado com sucesso!
   📊 Tabelas: usuarios, equipamentos, vinculos, historico_calibracoes, auditoria, logs_erro
   🔒 RLS habilitado em todas as tabelas
   👤 Usuário admin criado: admin@medlux.com / admin123
   ```

### 2.3 Verificar Tabelas Criadas
1. No menu lateral, clique em **🗄️ Table Editor**
2. Você deve ver 6 tabelas:
   - ✅ `usuarios`
   - ✅ `equipamentos`
   - ✅ `vinculos`
   - ✅ `historico_calibracoes`
   - ✅ `auditoria`
   - ✅ `logs_erro`

---

## 🔧 Passo 3: Configurar Frontend (VOU FAZER)

Assim que você me enviar as credenciais, vou:

1. **Criar arquivo `.env`** com suas credenciais
2. **Criar serviço Supabase** (`src/services/supabase.js`)
3. **Migrar autenticação** de IndexedDB para Supabase Auth
4. **Migrar CRUD de equipamentos** para usar API do Supabase
5. **Implementar sincronização em tempo real**
6. **Importar seus 23 equipamentos** do backup

---

## 📊 Passo 4: Importar Dados do Backup (VOU FAZER)

Vou criar um script que:
1. Lê o arquivo `medlux-backup-2026-02-13.json`
2. Converte os dados para o formato do Supabase
3. Insere os 23 equipamentos no banco
4. Cria usuários fictícios para testar vínculos

---

## 🧪 Passo 5: Testar Sincronização

Depois da implementação, você vai poder:

### Teste de Sincronização:
1. **Computador 1**: Abrir o app e criar um equipamento
2. **Computador 2**: Abrir o app (mesma URL) → Ver o equipamento aparecer automaticamente
3. **Computador 1**: Editar o equipamento
4. **Computador 2**: Ver a alteração em tempo real (sem recarregar!)

### Teste de Multi-Usuário:
1. **Usuário 1**: Login com `admin@medlux.com`
2. **Usuário 2**: Login com `joao.silva@medlux.com` (em outro navegador/aba anônima)
3. **Usuário 1**: Criar equipamento
4. **Usuário 2**: Ver equipamento aparecer em tempo real

---

## ⚙️ Configurações de Segurança

### Row Level Security (RLS)
O script já habilita RLS para segurança. Por enquanto, as políticas permitem:
- ✅ Todos os usuários autenticados podem ler/escrever
- ✅ Auditoria é inserida automaticamente
- ✅ Logs de erro são apenas leitura

**No futuro**, podemos restringir:
- Administradores: acesso total
- Gestores: leitura total, escrita parcial
- Técnicos: apenas leitura e criar vínculos

---

## 🎉 Próximos Passos

Assim que você me enviar:
- ✅ **SUPABASE_URL**
- ✅ **SUPABASE_ANON_KEY**

Eu vou:
1. ⏱️ Configurar o frontend (30 minutos)
2. ⏱️ Migrar autenticação (20 minutos)
3. ⏱️ Migrar CRUD de equipamentos (40 minutos)
4. ⏱️ Implementar sincronização em tempo real (30 minutos)
5. ⏱️ Importar seus 23 equipamentos (15 minutos)

**Tempo total estimado: ~2h30**

---

## 📞 Precisa de Ajuda?

Se tiver qualquer dúvida durante o processo:
1. Tire um print da tela
2. Me envie aqui
3. Vou te ajudar imediatamente!

---

## 🔒 Segurança das Credenciais

**IMPORTANTE**: 
- ✅ A `anon/public key` é segura para usar no frontend
- ✅ Ela só funciona com as políticas RLS ativas
- ❌ NUNCA compartilhe a `service_role key` (chave secreta)
- ✅ Vou criar um arquivo `.env.local` que NÃO vai para o Git

---

**🚀 Está pronto para começar? Me envie as credenciais quando tiver!**
