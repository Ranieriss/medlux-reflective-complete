# 🐛 Guia de Debug - Problema "Usuário não autenticado"

**Data:** 15 de Fevereiro de 2026  
**Problema:** Admin logado mas recebe erro "Usuário não autenticado" ao clicar em "Nova Medição"

---

## 🔍 Diagnóstico

### Sintomas

- ✅ Usuário consegue fazer login
- ✅ Nome aparece no header (Paulo Ranieri dos Santos)
- ✅ Badge "Administrador" visível
- ❌ Ao clicar "Nova Medição" → erro "Usuário não autenticado"
- ❌ Dropdown de equipamentos vazio

### Causa Raiz

`authStore.usuario.value` retorna `null` apesar do usuário estar logado.

---

## 🛠️ Correções Aplicadas

### 1. Tentativa de Restauração de Sessão

**Arquivo:** `src/views/CalibracoesLista.vue`

```javascript
const carregarEquipamentos = async () => {
  const usuario = authStore.usuario.value;

  if (!usuario) {
    // 🆕 NOVO: Tentar restaurar sessão
    await authStore.restaurarSessao();

    const usuarioRestaurado = authStore.usuario.value;
    if (!usuarioRestaurado) {
      mostrarNotificacao("Sessão expirada. Faça login novamente.", "error");
      return;
    }
  }

  // Continuar carregamento...
};
```

### 2. Logs de Debug Detalhados

```javascript
console.log("🔍 DEBUG: authStore completo:", {
  usuario: authStore.usuario.value,
  isAuthenticated: authStore.isAuthenticated,
  isAdmin: authStore.isAdmin,
  nomeUsuario: authStore.nomeUsuario,
});
```

---

## 🧪 Como Testar

### Opção 1: Console do Navegador

1. Abra a aplicação: https://medlux-reflective-complete.vercel.app
2. Faça login como Admin
3. Abra DevTools (F12)
4. Cole no Console:

```javascript
// Verificar localStorage
const auth = localStorage.getItem("medlux_auth");
console.log("localStorage:", auth ? JSON.parse(auth) : "Vazio");

// Copiar script completo
fetch("/test-auth.js")
  .then((r) => r.text())
  .then(eval);
```

### Opção 2: Debug HTML

1. Baixe: `debug-auth.html`
2. Abra em uma nova aba
3. Verifique status:
   - ✅ LocalStorage presente?
   - ✅ Auth Store carregado?
   - ✅ Sincronização OK?

---

## 📋 Checklist de Verificação

Quando o erro ocorrer, verifique:

### No Console (DevTools)

```javascript
// 1. LocalStorage
localStorage.getItem("medlux_auth");
// Esperado: JSON com dados do usuário

// 2. Auth Store (se Vue DevTools instalado)
// Abra Vue DevTools → Pinia → auth
// Verifique:
// - usuario.value → deve ter { id, nome, email, perfil }
// - isAuthenticated → deve ser true
```

### Logs Esperados

Ao clicar "Nova Medição", você deve ver:

```
🔵 Abrindo dialog de nova medição...
📅 Data de calibração definida: { hoje: ..., proxima: ... }
⏳ Carregando equipamentos antes de abrir dialog...

🔍 DEBUG: authStore completo: {
  usuario: { id: "...", nome: "Paulo Ranieri dos Santos", ... },
  isAuthenticated: true,
  isAdmin: true,
  nomeUsuario: "Paulo Ranieri dos Santos"
}

👤 Usuário logado: { id: "...", perfil: "administrador" }
⏳ Buscando equipamentos...
📦 Resposta buscarEquipamentosDoUsuario: [...]
✅ 22 equipamentos carregados
✅ Dialog aberto com sucesso!
```

### Se Aparecer Erro

```
❌ Usuário não autenticado
❌ localStorage: { ... dados ... }
🔄 Tentando restaurar sessão...
```

**Ações:**

1. Se "✅ Sessão restaurada" → Funcionou!
2. Se "Sessão expirada" → Fazer logout/login

---

## 🔧 Soluções Rápidas

### Solução 1: Recarregar Página

```javascript
window.location.reload();
```

### Solução 2: Restaurar Sessão Manual

```javascript
// No console
const authStore = useAuthStore();
await authStore.restaurarSessao();
```

### Solução 3: Limpar Cache e Relogar

```javascript
localStorage.removeItem("medlux_auth");
// Depois fazer login novamente
```

### Solução 4: Limpar Todo o Cache

```javascript
localStorage.clear();
sessionStorage.clear();
// Depois fazer login novamente
```

---

## 📊 Verificar Dados no Supabase

### SQL para verificar usuário

```sql
-- Verificar se usuário existe e está ativo
SELECT id, nome, email, perfil, ativo, ultimo_acesso
FROM usuarios
WHERE email = 'paulo.ranieri@gmail.com'  -- Seu email
AND ativo = true;
```

### SQL para verificar equipamentos

```sql
-- Admin deve ver TODOS os equipamentos
SELECT id, codigo, nome, tipo, ativo
FROM equipamentos
WHERE ativo = true
ORDER BY codigo;
```

### SQL para verificar vínculos

```sql
-- Verificar vínculos do usuário
SELECT v.id, v.usuario_id, v.equipamento_id, v.ativo,
       e.codigo, e.nome
FROM vinculos v
JOIN equipamentos e ON e.id = v.equipamento_id
WHERE v.usuario_id = 'SEU_ID_AQUI'
AND v.ativo = true
AND v.data_fim IS NULL;
```

---

## 🚀 Deploy e Teste

### Testar Localmente

```bash
# 1. Pull das alterações
git pull origin main

# 2. Instalar dependências (se necessário)
npm install

# 3. Rodar localmente
npm run dev

# 4. Abrir no navegador
# http://localhost:3000
```

### Testar em Produção

1. Aguardar deploy automático Vercel (~2 min)
2. Acessar: https://medlux-reflective-complete.vercel.app
3. Limpar cache do navegador (Ctrl+Shift+Delete)
4. Fazer login
5. Testar "Nova Medição"

---

## 📞 Se o Problema Persistir

### Informações para Coletar

1. **Console Logs**
   - Copiar TODOS os logs do console
   - Incluir mensagens de erro completas

2. **Network Tab**
   - Verificar requisição para `equipamentos`
   - Status code (200, 401, 500?)
   - Response body

3. **Application Tab**
   - LocalStorage → `medlux_auth`
   - Copiar JSON completo

4. **Vue DevTools**
   - Pinia → auth → usuario
   - Screenshot do estado

5. **Timestamp**
   - Quando ocorreu o erro
   - Navegador e versão

### Enviar para Debug

Criar issue no GitHub com:

- Screenshots do console
- Dados do localStorage (sem senha!)
- Logs completos
- Passos para reproduzir

---

## 📚 Arquivos de Debug Criados

1. **debug-auth.html**
   - Dashboard visual de debug
   - Verifica localStorage e Auth Store
   - Ações de debug (limpar cache, restaurar sessão)

2. **test-auth.js**
   - Script rápido para console
   - Verifica dados básicos
   - Instruções passo a passo

3. **DEBUG_AUTH.md** (este arquivo)
   - Guia completo de troubleshooting
   - Checklist de verificação
   - Soluções rápidas

---

## ✅ Status das Correções

- ✅ Tentativa de restauração de sessão (commit `9ac5961`)
- ✅ Logs de debug detalhados
- ✅ Verificação dupla do usuário
- ✅ Mensagem clara de erro
- ✅ Ferramentas de debug criadas

**Próximo teste:** Aguardar deploy e verificar em produção

---

**Última atualização:** 2026-02-15 20:15  
**Commit:** `9ac5961`  
**Status:** ✅ Correções aplicadas, aguardando teste
