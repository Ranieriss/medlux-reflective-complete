# 🎯 EXECUTAR SQL NO SUPABASE - PASSO A PASSO

## ✅ PASSO 1: Abrir o Supabase

🔗 **Clique aqui**: https://earrnuuvdzawclxsyoxk.supabase.co

## ✅ PASSO 2: Ir no SQL Editor

No menu lateral esquerdo → Clique em **SQL Editor**

## ✅ PASSO 3: Nova Query

Clique no botão **+ New query** (canto superior)

## ✅ PASSO 4: Copiar o SQL

Você tem 2 opções:

### **OPÇÃO A - Copiar do arquivo:**
1. Abra o arquivo `supabase-calibracao-completo.sql` no seu editor
2. Selecione TUDO (Ctrl+A)
3. Copie (Ctrl+C)

### **OPÇÃO B - Copiar direto aqui:**

Vou gerar um comando para você visualizar o arquivo completo:

```bash
# No terminal, execute:
cat /home/user/webapp/supabase-calibracao-completo.sql
```

Depois copie TODO o conteúdo (são 463 linhas)

## ✅ PASSO 5: Colar no Supabase

Cole TODO o conteúdo na área de texto da query

## ✅ PASSO 6: EXECUTAR ▶️

Clique no botão **RUN** (▶️) no canto superior direito

## ✅ PASSO 7: Aguardar Sucesso

Você deve ver no output:

```
✅ Schema de Calibração criado com sucesso!
✅ 63 critérios inseridos
✅ Views criadas: vw_calibracoes_status, vw_dashboard_calibracoes
✅ Função criada: calcular_status_calibracao()
```

---

## 🎉 PRONTO!

Depois que executar com sucesso, **me avise** e eu crio a interface!

---

## ❌ SE DER ERRO:

**Erro comum**: "already exists"
- **Solução**: Pode ignorar, significa que já estava criado

**Erro de permissão**:
- **Solução**: Verifique se está logado como owner do projeto

**Erro de sintaxe**:
- **Solução**: Certifique-se de copiar TODO o arquivo, desde a primeira linha

---

## 📞 DÚVIDAS?

Me avise qual erro apareceu e eu te ajudo!
