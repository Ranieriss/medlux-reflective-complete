# 🚨 SOLUÇÃO: Tabelas não encontradas no Supabase

## ❌ ERRO ATUAL:

```
Could not find the table 'public.vinculos'
Could not find the table 'public.auditoria'
```

**Causa**: As tabelas ainda não foram criadas no Supabase!

---

## ✅ SOLUÇÃO DEFINITIVA (5 minutos):

### **EXECUTAR 1 ÚNICO SCRIPT SQL**

1. **Acesse**: https://earrnuuvdzawclxsyoxk.supabase.co

2. **Menu Lateral** → **SQL Editor**

3. **Clique**: + **New query**

4. **Copie o arquivo**: `supabase-COMPLETO-UNICO.sql`
   - São 741 linhas
   - Contém TUDO que você precisa

5. **Cole TODO** o conteúdo no editor

6. **Clique RUN** ▶️

7. **Aguarde** ~10 segundos

---

## 📋 O QUE ESSE SCRIPT FAZ:

### ✅ Cria 7 Tabelas:

1. **usuarios** → Gestão de usuários
2. **equipamentos** → Seus 23 equipamentos
3. **vinculos** → Custódia (ESTAVA FALTANDO!)
4. **historico_calibracoes** → Calibrações
5. **auditoria** → Logs de ações (ESTAVA FALTANDO!)
6. **logs_erro** → Erros do sistema
7. **criterios_retrorrefletancia** → 63 critérios ABNT

### ✅ Cria 4 Views SQL:

1. vw_equipamentos_status_calibracao
2. vw_dashboard_stats
3. vw_calibracoes_status
4. vw_dashboard_calibracoes

### ✅ Cria 2 Funções:

1. registrar_auditoria()
2. calcular_status_calibracao()

### ✅ Configura Segurança:

- Row Level Security (RLS)
- Políticas de acesso
- Triggers automáticos

---

## 🎯 APÓS EXECUTAR COM SUCESSO:

Você vai ver no output:

```
✅ Schema de Calibração criado com sucesso!
✅ 63 critérios inseridos
```

---

## 🔄 DEPOIS, FAÇA:

1. **Recarregue a página** do MEDLUX (F5)
2. **Faça login** novamente: admin@medlux.com / 2308
3. **Teste os menus**:
   - ✅ Vínculos (deve funcionar!)
   - ✅ Auditoria (deve funcionar!)
   - ✅ Todos os outros

---

## ⚠️ SE DER ERRO:

**"relation already exists"**

- ✅ Pode IGNORAR! Significa que já estava criado

**"permission denied"**

- ❌ Verifique se você está logado como OWNER do projeto

**"syntax error"**

- ❌ Certifique-se de copiar TODO o arquivo desde a primeira linha

---

## 📞 ME AVISE:

Depois de executar, me diga:

- ✅ "Executei com sucesso!"
- ❌ "Deu erro: [cole a mensagem]"

Aí eu te ajudo!

---

**Arquivo a executar**: `supabase-COMPLETO-UNICO.sql`  
**Linhas**: 741  
**Tamanho**: ~31 KB  
**Tempo**: ~10 segundos para executar
