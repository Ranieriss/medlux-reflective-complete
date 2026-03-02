# 🔴 PLANO DE CORREÇÃO DEFINITIVO - MEDLUX

**Data**: 16/02/2026 00:15 BRT  
**Status**: ANÁLISE PROFUNDA NECESSÁRIA

---

## 📋 Situação Atual

### ✅ O Que Funciona

1. ✅ Login na aplicação (tela de login responde)
2. ✅ Dashboard carrega (mostra 32 equipamentos)
3. ✅ Sessão restaura (console mostra "Sessão restaurada")
4. ✅ Equipamentos inseridos no banco (22 equipamentos via SQL)

### ❌ O Que NÃO Funciona

1. ❌ Botão "Nova Medição" não abre o formulário
2. ❌ Console mostra `usuario: undefined` após restauração
3. ❌ Erro "Nenhum equipamento disponível" ao clicar em Nova Medição

---

## 🔍 ANÁLISE DO PROBLEMA REAL

### Hipótese 1: Incompatibilidade de Estrutura do Banco

**Sintomas**:

- Queries com `.eq('ativo', true)` em tabelas sem coluna `ativo`
- Queries com `.eq('status', 'ativo')` podem não funcionar se a coluna for booleana

**Ação**: Verificar estrutura exata das tabelas no Supabase

### Hipótese 2: Timing de Reatividade do Pinia

**Sintomas**:

- `authStore.usuario.value` é `undefined` mesmo após `restaurarSessao()`
- `isAuthenticated` é `true`, mas `usuario` é `undefined`
- Dashboard funciona, mas CalibracoesLista não

**Possível Causa**:

- Dashboard não depende de `authStore.usuario.value`
- CalibracoesLista acessa `authStore.usuario.value` antes da reatividade atualizar

### Hipótese 3: Cache do Vercel/Navegador

**Sintomas**:

- Código atualizado no GitHub
- Servidor local (sandbox) atualiza via HMR
- Mas Vercel pode estar servindo versão cacheada

---

## 📝 PLANO DE AÇÃO PASSO A PASSO

### PASSO 1: Verificar Estrutura Real do Banco ⏳

Execute no Supabase SQL Editor:

```sql
-- 1. Ver TODAS as colunas da tabela usuarios
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'usuarios'
ORDER BY ordinal_position;

-- 2. Ver TODAS as colunas da tabela equipamentos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'equipamentos'
ORDER BY ordinal_position;

-- 3. Contar registros ativos
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_equipamentos FROM equipamentos;

-- 4. Ver 1 exemplo de cada tabela
SELECT * FROM usuarios LIMIT 1;
SELECT * FROM equipamentos LIMIT 1;
```

**Me envie o resultado completo dessas queries.**

---

### PASSO 2: Teste de Login Direto

Faça logout e login novamente:

1. Abra: https://medlux-reflective-complete.vercel.app
2. **Limpe cache**: Ctrl+Shift+Delete → Limpar tudo
3. Feche e abra o navegador novamente
4. Faça login: `joao.silva@medlux.com` / senha `1234`
5. Abra Console (F12)
6. **Me envie TODO o log do console** (screenshot ou texto)

---

### PASSO 3: Verificar Query de Equipamentos

No Console do navegador (F12), execute:

```javascript
// 1. Verificar authStore
const { useAuthStore } = await import("./src/stores/auth.js");
const authStore = useAuthStore();
console.log("=== AUTH STORE ===");
console.log("usuario:", authStore.usuario);
console.log("usuario.value:", authStore.usuario?.value);
console.log("isAuthenticated:", authStore.isAuthenticated);
console.log("isAdmin:", authStore.isAdmin);

// 2. Testar query direta
const { default: supabase } = await import("./src/services/supabase.js");
const { data, error } = await supabase
  .from("equipamentos")
  .select("*")
  .limit(5);

console.log("=== QUERY DIRETA ===");
console.log("data:", data);
console.log("error:", error);

// 3. Testar service
const { buscarEquipamentosDoUsuario } =
  await import("./src/services/equipamentoService.js");
const usuario =
  authStore.usuario?.value || JSON.parse(localStorage.getItem("medlux_auth"));
const equips = await buscarEquipamentosDoUsuario(usuario.id, usuario.perfil);
console.log("=== SERVICE ===");
console.log("equipamentos:", equips);
```

**Me envie o resultado completo.**

---

### PASSO 4: Análise de Código Atual

Vou revisar **TODOS** os arquivos críticos:

1. ✅ `src/stores/auth.js` - Store de autenticação
2. ✅ `src/services/equipamentoService.js` - Service de equipamentos
3. ✅ `src/services/supabase.js` - Configuração Supabase
4. ✅ `src/views/CalibracoesLista.vue` - Página de medições
5. ✅ `src/composables/useEquipamentos.js` - Composable de equipamentos

---

## 🎯 SOLUÇÕES POSSÍVEIS

### Solução A: Refatorar carregarEquipamentos()

Mudar a ordem de verificação:

```javascript
const carregarEquipamentos = async () => {
  loadingEquipamentos.value = true;
  try {
    // 1. Garantir que temos usuário
    let usuario = authStore.usuario?.value;

    if (!usuario) {
      // 2. Tentar localStorage primeiro
      const authData = localStorage.getItem("medlux_auth");
      if (authData) {
        usuario = JSON.parse(authData);
      }
    }

    if (!usuario) {
      // 3. Tentar restaurar sessão
      await authStore.restaurarSessao();
      usuario = authStore.usuario?.value;
    }

    if (!usuario) {
      throw new Error("Usuário não autenticado");
    }

    // 4. Buscar equipamentos
    const response = await buscarEquipamentosDoUsuario(
      usuario.id,
      usuario.perfil,
    );
    equipamentos.value = response;
  } catch (error) {
    console.error("Erro:", error);
    mostrarNotificacao(error.message, "error");
  } finally {
    loadingEquipamentos.value = false;
  }
};
```

### Solução B: Usar localStorage Diretamente

Evitar depender de `authStore.usuario.value`:

```javascript
const getUsuarioAtual = () => {
  // Tentar authStore primeiro
  if (authStore.usuario?.value) {
    return authStore.usuario.value;
  }

  // Fallback para localStorage
  const authData = localStorage.getItem("medlux_auth");
  if (authData) {
    return JSON.parse(authData);
  }

  return null;
};
```

### Solução C: Remover TODOS os filtros `.eq('ativo')`

Se a coluna não existe, remover completamente:

```javascript
// ANTES
.eq('ativo', true)

// DEPOIS
// (sem filtro)
```

---

## 📊 Dados Necessários Para Continuar

Para dar a solução definitiva, preciso que você:

1. **Execute o SQL do PASSO 1** e me envie o resultado
2. **Execute o JavaScript do PASSO 3** no console e me envie o resultado
3. **Me diga**: Quando você faz login, vai direto para o Dashboard ou fica na tela de login?
4. **Me confirme**: O email que você usa é `joao.silva@medlux.com` ou `ranieri.santos16@gmail.com`?

---

## ⚠️ Meu Compromisso

Peço desculpas pela frustração. Vou:

1. ✅ **Parar de fazer suposições** e verificar os dados reais do banco
2. ✅ **Testar cada hipótese** antes de propor correção
3. ✅ **Fazer apenas 1 correção por vez** e validar antes de continuar
4. ✅ **Documentar cada passo** para você entender o que está acontecendo

---

## 🔄 Próxima Ação

**Aguardo você executar os PASSOS 1 e 3 e me enviar os resultados.**

Só depois disso vou propor a correção definitiva, baseada em dados reais, não suposições.
