# 🔧 DEBUG: Equipamentos Não Carregando

## ✅ Correção Aplicada

**Problema:** Ao abrir "Nova Medição", o campo Equipamento estava vazio.

**Causa:** A função `abrirDialogNovo()` não chamava `carregarEquipamentos()`.

**Solução:** Adicionado `await carregarEquipamentos()` antes de abrir o dialog.

---

## 📋 Como Verificar se Está Funcionando

### 1. Abra o Console do Navegador
- **Chrome/Edge:** F12 → Aba "Console"
- **Firefox:** F12 → Aba "Console"

### 2. Recarregue a Página
```
Ctrl + Shift + R  (força reload sem cache)
```

### 3. Clique em "Nova Medição"

### 4. Verifique os Logs
Deve aparecer:
```
✅ X equipamentos carregados para operador
```

---

## 🔍 Verificações Adicionais

### Verificar Vínculos do Usuário

Execute no Supabase SQL Editor:

```sql
-- Ver vínculos do usuário donevir
SELECT 
  v.*,
  u.nome as usuario_nome,
  u.email as usuario_email,
  e.codigo as equipamento_codigo,
  e.nome as equipamento_nome
FROM vinculos v
JOIN usuarios u ON v.usuario_id = u.id
JOIN equipamentos e ON v.equipamento_id = e.id
WHERE u.email = 'donevir@medlux.com'
  AND v.ativo = true
ORDER BY v.created_at DESC;
```

Resultado esperado:
```
usuario_nome | email              | equipamento_codigo | equipamento_nome
-------------|--------------------|--------------------|------------------
Donevir      | donevir@medlux.com | RH01              | Retrorrefletômetro...
```

---

## 🐛 Se Ainda Não Aparecer

### Problema 1: Vínculo Não Existe

**Solução:** Criar vínculo manualmente

```sql
-- Buscar IDs
SELECT id, email FROM usuarios WHERE email = 'donevir@medlux.com';
SELECT id, codigo FROM equipamentos WHERE codigo = 'RH01';

-- Criar vínculo
INSERT INTO vinculos (usuario_id, equipamento_id, ativo, data_inicio)
VALUES (
  (SELECT id FROM usuarios WHERE email = 'donevir@medlux.com'),
  (SELECT id FROM equipamentos WHERE codigo = 'RH01'),
  true,
  CURRENT_DATE
);
```

### Problema 2: Equipamento Não Existe

**Solução:** Criar equipamento

1. Vá em **"Equipamentos"** no menu
2. Clique **"Novo Equipamento"**
3. Preencha:
   - Código: `RH01`
   - Nome: `Retrorrefletômetro Horizontal 15m`
   - Tipo: `horizontal`
   - Fabricante: `Delta`
   - Modelo: `LTL-XL`
4. Salve

### Problema 3: Cache do Navegador

**Solução:** Limpar cache

```
Chrome/Edge: Ctrl + Shift + Delete
Marcar: "Imagens e arquivos em cache"
Período: "Todo o período"
```

---

## 📊 Logs Esperados no Console

### Ao Carregar a Página
```javascript
✅ 15 medições carregadas para operador
✅ 1 equipamentos carregados para operador
```

### Ao Abrir "Nova Medição"
```javascript
✅ 1 equipamentos carregados para operador
// Equipamento deve aparecer no dropdown
```

### Se For Operador com 1 Equipamento
```javascript
✅ 1 equipamentos carregados para operador
// Equipamento selecionado automaticamente
```

---

## 🔄 Código da Correção

```javascript
const abrirDialogNovo = async () => {  // ← ASYNC adicionado
  modoEdicao.value = false
  formMedicaoData.value = { ...formMedicaoInicial }
  resultadoValidacao.value = null
  
  formMedicaoData.value.tecnico_responsavel = authStore.nomeUsuario
  
  const hoje = new Date()
  const proxima = new Date(hoje.setFullYear(hoje.getFullYear() + 1))
  formMedicaoData.value.proxima_calibracao = proxima.toISOString().split('T')[0]
  
  // ✅ NOVA LINHA: Carregar equipamentos
  await carregarEquipamentos()  // ← ADICIONADO
  
  if (authStore.isOperador && equipamentos.value.length === 1) {
    formMedicaoData.value.equipamento_id = equipamentos.value[0].id
    onEquipamentoChange(equipamentos.value[0].id)
  }
  
  dialogMedicao.value = true
}
```

---

## ✅ Commit e Push

```bash
Commit: 89adc91
Mensagem: "fix: Carregar equipamentos ao abrir dialog de nova medição"
Status: ✅ Enviado para GitHub
```

---

## 🎯 Próximo Teste

1. **Recarregue a aplicação** (Ctrl + Shift + R)
2. **Faça login** como `donevir@medlux.com`
3. **Vá em "Minhas Medições"**
4. **Clique em "Nova Medição"**
5. **Verifique se o campo "Equipamento" aparece preenchido**

Se ainda não funcionar, me envie:
- Screenshot do console (F12)
- Screenshot da tela de Nova Medição
- Resultado da query SQL de verificação de vínculos

---

**Arquivo:** DEBUG_EQUIPAMENTOS.md  
**Data:** 2026-02-15  
**Commit:** 89adc91
