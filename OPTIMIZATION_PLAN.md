# ⚡ MEDLUX Reflective - Plano de Otimização

**Data:** 15 de Fevereiro de 2026  
**Versão:** 1.0  
**Período:** 30 dias  
**Objetivo:** Eliminar gargalos, melhorar segurança e preparar para escala

---

## 📊 Sumário Executivo

Este documento detalha **23 otimizações prioritárias** divididas em 3 categorias (P0, P1, P2) com impacto estimado de:

- 🔒 **Segurança:** +85% (redução de vulnerabilidades)
- ⚡ **Performance:** +60% (redução de tempo de carregamento)
- 🧹 **Qualidade:** +45% (manutenibilidade e testabilidade)
- 💾 **Bundle Size:** -30% (de 906 kB para ~635 kB)

**Esforço Total Estimado:** 15 dias de trabalho  
**ROI Esperado:** Alto (crítico para produção)

---

## 🎯 Otimizações por Prioridade

### 🔴 P0 - Crítico (Dia 1-2) - 3 itens

Total: **1 dia + 3 horas**

---

#### **OPT-001: Corrigir bug de carregamento de equipamentos** 🔴

**Problema:**  
Equipamentos não aparecem no dropdown de medições devido a acesso incorreto ao ref `authStore.usuario`.

**Localização:**
- `src/views/CalibracoesLista.vue` linhas 811, 841, 842

**Código Atual:**
```javascript
const usuario = authStore.usuario  // ❌ Retorna Proxy(Ref)
```

**Código Corrigido:**
```javascript
const usuario = authStore.usuario.value  // ✅ Acessa o valor real
```

**Impacto:**
- 🔴 **Severidade:** CRÍTICO
- 👥 **Usuários Afetados:** 100% (funcionalidade principal quebrada)
- 🎯 **Funcionalidade:** Criar nova medição

**Estimativa:**
- ⏱️ **Esforço:** 1 hora
- 📈 **Ganho:** +100% (funcionalidade restaurada)
- 🧪 **Teste:** Criar medição como operador e admin

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b fix/equipamentos-carregamento

# 2. Editar arquivo
# src/views/CalibracoesLista.vue linha 811:
# ANTES: const usuario = authStore.usuario
# DEPOIS: const usuario = authStore.usuario.value

# 3. Testar
npm run dev
# - Login como operador
# - Clicar em "Nova Medição"
# - Verificar que equipamentos aparecem no dropdown

# 4. Commit e push
git add src/views/CalibracoesLista.vue
git commit -m "fix: Corrigir acesso a authStore.usuario.value em CalibracoesLista"
git push origin fix/equipamentos-carregamento

# 5. Criar PR
gh pr create --title "Fix: Carregamento de equipamentos" --body "Corrige bug crítico onde equipamentos não aparecem no dropdown de medições"
```

**Validação:**
- [ ] Operador vê equipamentos vinculados
- [ ] Admin vê todos os equipamentos
- [ ] Auto-seleção funciona para operador com 1 equipamento
- [ ] onEquipamentoChange dispara corretamente

---

#### **OPT-002: Implementar hash seguro de senhas** 🔒

**Problema:**  
Senhas comparadas em texto plano, armazenadas sem criptografia adequada.

**Localização:**
- `src/stores/auth.js` linha 36
- Backend Supabase (função de autenticação)

**Código Atual:**
```javascript
// ❌ CRÍTICO: Comparação em texto plano
if (usuarios.senha_hash !== senha) {
  return { sucesso: false, mensagem: 'Senha incorreta' }
}
```

**Solução Proposta:**

**Backend (Supabase Function):**
```sql
-- 1. Instalar extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Criar função de autenticação segura
CREATE OR REPLACE FUNCTION autenticar_usuario(
  p_email TEXT,
  p_senha TEXT
)
RETURNS TABLE(
  sucesso BOOLEAN,
  mensagem TEXT,
  usuario_id UUID,
  usuario_data JSONB
) AS $$
DECLARE
  v_usuario RECORD;
BEGIN
  -- Buscar usuário
  SELECT * INTO v_usuario
  FROM usuarios
  WHERE email = p_email
    AND ativo = TRUE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Usuário não encontrado ou inativo', NULL::UUID, NULL::JSONB;
    RETURN;
  END IF;

  -- Verificar senha com bcrypt
  IF crypt(p_senha, v_usuario.senha_hash) = v_usuario.senha_hash THEN
    -- Atualizar último acesso
    UPDATE usuarios
    SET ultimo_acesso = NOW()
    WHERE id = v_usuario.id;

    RETURN QUERY SELECT 
      TRUE,
      'Login realizado com sucesso',
      v_usuario.id,
      to_jsonb(v_usuario) - 'senha_hash';
  ELSE
    RETURN QUERY SELECT FALSE, 'Senha incorreta', NULL::UUID, NULL::JSONB;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Script de migração de senhas existentes
UPDATE usuarios
SET senha_hash = crypt(senha_hash, gen_salt('bf', 10))
WHERE senha_hash NOT LIKE '$2%';  -- Já não é bcrypt

-- 4. Criar função para reset de senha
CREATE OR REPLACE FUNCTION redefinir_senha(
  p_usuario_id UUID,
  p_senha_nova TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE usuarios
  SET senha_hash = crypt(p_senha_nova, gen_salt('bf', 10)),
      updated_at = NOW()
  WHERE id = p_usuario_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Frontend (auth.js):**
```javascript
// src/stores/auth.js
const login = async (email, senha) => {
  try {
    // Chamar função RPC do Supabase
    const { data, error } = await supabase
      .rpc('autenticar_usuario', {
        p_email: email,
        p_senha: senha
      })

    if (error) {
      console.error('Erro na autenticação:', error)
      return { sucesso: false, mensagem: 'Erro ao realizar login' }
    }

    const resultado = data[0]  // RPC retorna array

    if (!resultado.sucesso) {
      return { sucesso: false, mensagem: resultado.mensagem }
    }

    // Usuário autenticado
    usuario.value = resultado.usuario_data
    isAuthenticated.value = true

    // Salvar no localStorage (SEM senha)
    const dadosArmazenar = {
      id: resultado.usuario_data.id,
      email: resultado.usuario_data.email,
      nome: resultado.usuario_data.nome,
      perfil: resultado.usuario_data.perfil
      // ✅ SEM senha_hash
    }
    localStorage.setItem('medlux_auth', JSON.stringify(dadosArmazenar))
    
    console.log('✅ Login realizado com sucesso')
    return { sucesso: true }

  } catch (error) {
    console.error('❌ Erro no login:', error)
    return { sucesso: false, mensagem: 'Erro ao realizar login' }
  }
}
```

**Impacto:**
- 🔒 **Severidade:** CRÍTICA (vulnerabilidade de segurança)
- 🎯 **Ganho:** +95% segurança de autenticação
- 📊 **Conformidade:** OWASP A02:2021

**Estimativa:**
- ⏱️ **Esforço:** 1 dia (4h backend + 2h frontend + 2h migração)
- 🧪 **Teste:** Login com usuários existentes e novos

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b security/bcrypt-passwords

# 2. Backend (Supabase SQL Editor)
# - Executar script SQL acima
# - Testar função autenticar_usuario

# 3. Frontend
# - Editar src/stores/auth.js
# - Remover comparação direta de senha
# - Chamar RPC autenticar_usuario

# 4. Migração de dados
# - Executar UPDATE usuarios (re-hash de senhas)
# - Validar que todos os usuários conseguem logar

# 5. Commit e push
git add src/stores/auth.js
git commit -m "security: Implementar bcrypt para senhas"
git push origin security/bcrypt-passwords

# 6. Criar PR
gh pr create --title "Security: Implementar hash bcrypt de senhas" \
  --body "Implementa bcrypt no backend e migra senhas existentes. Resolve vulnerabilidade crítica A02:2021 OWASP."
```

**Validação:**
- [ ] Login funciona com senhas migradas
- [ ] Novas senhas são hasheadas com bcrypt
- [ ] localStorage não contém senha_hash
- [ ] Função redefinir_senha funciona
- [ ] Audit: Verificar que senhas antigas foram migradas

---

#### **OPT-003: Implementar handlers de menu** 🔧

**Problema:**  
Botões "Perfil" e "Configurações" não executam nenhuma ação.

**Localização:**
- `src/views/Layout.vue` linhas 57, 62

**Código Atual:**
```vue
<v-list-item 
  prepend-icon="mdi-account-cog" 
  title="Perfil"
  @click="irParaPerfil"  <!-- ❌ Função não existe -->
/>
<v-list-item 
  prepend-icon="mdi-cog" 
  title="Configurações"
  @click="irParaConfiguracoes"  <!-- ❌ Função não existe -->
/>
```

**Solução:**

**Opção A: Navegação para rotas existentes**
```javascript
// src/views/Layout.vue <script setup>
const irParaPerfil = () => {
  router.push('/sistema')  // Reutiliza tela de sistema
}

const irParaConfiguracoes = () => {
  router.push('/sistema')  // Mesmo destino
}
```

**Opção B: Criar rotas dedicadas (recomendado)**
```javascript
// src/router/index.js
{
  path: 'perfil',
  name: 'Perfil',
  component: () => import('@/views/PerfilView.vue'),
  meta: { title: 'Meu Perfil' }
},
{
  path: 'configuracoes',
  name: 'Configuracoes',
  component: () => import('@/views/ConfiguracoesView.vue'),
  meta: { title: 'Configurações' }
}

// src/views/Layout.vue
const irParaPerfil = () => {
  router.push('/perfil')
}

const irParaConfiguracoes = () => {
  router.push('/configuracoes')
}
```

**Criar PerfilView.vue:**
```vue
<template>
  <v-container>
    <h1>Meu Perfil</h1>
    <v-card>
      <v-card-text>
        <v-form>
          <v-text-field
            v-model="usuario.nome"
            label="Nome"
            prepend-icon="mdi-account"
          />
          <v-text-field
            v-model="usuario.email"
            label="E-mail"
            prepend-icon="mdi-email"
            disabled
          />
          <v-select
            v-model="usuario.perfil"
            :items="['administrador', 'tecnico', 'operador']"
            label="Perfil"
            prepend-icon="mdi-shield-account"
            disabled
          />
          
          <v-divider class="my-4" />
          
          <h3>Alterar Senha</h3>
          <v-text-field
            v-model="senhaAtual"
            label="Senha Atual"
            type="password"
            prepend-icon="mdi-lock"
          />
          <v-text-field
            v-model="senhaNova"
            label="Nova Senha"
            type="password"
            prepend-icon="mdi-lock-reset"
          />
          
          <v-btn color="primary" @click="salvarPerfil">
            Salvar Alterações
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const usuario = ref({ ...authStore.usuario.value })
const senhaAtual = ref('')
const senhaNova = ref('')

async function salvarPerfil() {
  // TODO: Implementar atualização de perfil
}
</script>
```

**Impacto:**
- 🟡 **Severidade:** MÉDIA
- 🎯 **Ganho:** +UX (funcionalidade prometida entregue)

**Estimativa:**
- ⏱️ **Esforço:** 2 horas
- 📈 **Ganho:** Melhor experiência do usuário

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b feature/menu-handlers

# 2. Criar novos componentes
touch src/views/PerfilView.vue
touch src/views/ConfiguracoesView.vue

# 3. Editar router
# Adicionar rotas em src/router/index.js

# 4. Editar Layout.vue
# Implementar funções irParaPerfil e irParaConfiguracoes

# 5. Testar
npm run dev
# Clicar em Perfil → deve navegar
# Clicar em Configurações → deve navegar

# 6. Commit e push
git add .
git commit -m "feat: Implementar navegação para Perfil e Configurações"
git push origin feature/menu-handlers

# 7. Criar PR
gh pr create --title "Feature: Implementar handlers de menu" \
  --body "Adiciona páginas de Perfil e Configurações e conecta botões do menu."
```

**Validação:**
- [ ] Botão "Perfil" navega para /perfil
- [ ] Botão "Configurações" navega para /configuracoes
- [ ] Páginas renderizam corretamente
- [ ] Dados do usuário são carregados

---

### 🟡 P1 - Alto (Dia 3-10) - 6 itens

Total: **6 dias**

---

#### **OPT-004: Modularizar CalibracoesLista.vue** ⚡

**Problema:**  
Componente monolítico com 1.228 linhas (template + lógica + estilos).

**Localização:**
- `src/views/CalibracoesLista.vue`

**Análise:**
```
ESTRUTURA ATUAL:
├── Template: 200 linhas
├── Script: 1.000 linhas
│   ├── State (refs): 100 linhas
│   ├── Funções de carregamento: 200 linhas
│   ├── Funções de formulário: 300 linhas
│   ├── Funções de validação: 200 linhas
│   └── Utilitários: 200 linhas
└── Styles: 28 linhas
```

**Solução: Dividir em 5 componentes**

```
ESTRUTURA PROPOSTA:
├── CalibracoesLista.vue (300 linhas) - Orquestrador
│   └── Gerencia estado global e coordena subcomponentes
├── CalibracoesStats.vue (100 linhas)
│   └── Dashboard com 4 cards de métricas
├── CalibracoesFiltros.vue (150 linhas)
│   └── Barra de filtros (busca, status, validação, tipo)
├── CalibracoesTabela.vue (300 linhas)
│   └── Data table + ações (editar, PDF, excluir)
└── CalibracoesForm.vue (400 linhas)
    └── Formulário de nova medição / edição
```

**Implementação:**

**1. CalibracoesStats.vue**
```vue
<template>
  <v-row>
    <v-col v-for="stat in stats" :key="stat.label" cols="12" md="3">
      <v-card class="dashboard-card" :class="`card-${stat.variant}`">
        <v-card-text>
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption">{{ stat.label }}</p>
              <h2 class="text-h3">{{ stat.value }}</h2>
            </div>
            <v-icon size="60" :color="stat.color" class="opacity-30">
              {{ stat.icon }}
            </v-icon>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const stats = computed(() => [
  {
    label: 'Em Dia',
    value: props.stats.em_dia || 0,
    variant: 'em-dia',
    color: 'success',
    icon: 'mdi-check-circle'
  },
  {
    label: 'Atenção (30 dias)',
    value: props.stats.atencao || 0,
    variant: 'atencao',
    color: 'warning',
    icon: 'mdi-alert'
  },
  {
    label: 'Vencidas',
    value: props.stats.vencidas || 0,
    variant: 'vencida',
    color: 'error',
    icon: 'mdi-close-circle'
  },
  {
    label: 'Taxa de Aprovação',
    value: `${props.stats.media_aprovacao || 0}%`,
    variant: 'aprovacao',
    color: 'info',
    icon: 'mdi-chart-pie'
  }
])
</script>

<style scoped>
.dashboard-card {
  height: 100%;
  transition: transform 0.2s;
}
.dashboard-card:hover {
  transform: translateY(-4px);
}
</style>
```

**2. CalibracoesFiltros.vue**
```vue
<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filtros.busca"
            prepend-inner-icon="mdi-magnify"
            label="Buscar equipamento"
            variant="outlined"
            density="compact"
            clearable
            @input="onFiltroChange"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            v-model="filtros.status"
            :items="statusOptions"
            label="Status Vencimento"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="onFiltroChange"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            v-model="filtros.validacao"
            :items="validacaoOptions"
            label="Validação"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="onFiltroChange"
          />
        </v-col>

        <v-col cols="12" md="2">
          <v-select
            v-model="filtros.tipo"
            :items="tipoEquipamentoOptions"
            label="Tipo Equipamento"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="onFiltroChange"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-btn
            color="primary"
            block
            @click="onAplicar"
            prepend-icon="mdi-filter"
          >
            Filtrar
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: Object
})

const emit = defineEmits(['update:modelValue', 'aplicar'])

const filtros = ref({ ...props.modelValue })

const statusOptions = [
  { title: 'Em dia', value: 'em_dia' },
  { title: 'Atenção', value: 'atencao' },
  { title: 'Vencida', value: 'vencida' }
]

const validacaoOptions = [
  { title: 'Aprovado', value: 'aprovado' },
  { title: 'Reprovado', value: 'reprovado' }
]

const tipoEquipamentoOptions = [
  { title: 'Horizontal', value: 'horizontal' },
  { title: 'Vertical', value: 'vertical' },
  { title: 'Tachas', value: 'tachas' }
]

const onFiltroChange = () => {
  emit('update:modelValue', filtros.value)
}

const onAplicar = () => {
  emit('aplicar', filtros.value)
}

watch(() => props.modelValue, (newVal) => {
  filtros.value = { ...newVal }
}, { deep: true })
</script>
```

**3. CalibracoesLista.vue (Orquestrador Refatorado)**
```vue
<template>
  <v-container fluid class="pa-6">
    <!-- Cabeçalho -->
    <v-row align="center" class="mb-6">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold text-primary">
          <v-icon size="36" color="primary">mdi-chart-line</v-icon>
          Medições de Retrorrefletância
        </h1>
        <p class="text-subtitle-1">Registre e valide medições conforme normas ABNT</p>
      </v-col>
      <v-col cols="12" md="6" class="text-right">
        <v-btn
          color="success"
          size="large"
          prepend-icon="mdi-plus-circle"
          @click="abrirDialogNovo"
        >
          Nova Medição
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          size="large"
          prepend-icon="mdi-file-chart"
          @click="abrirRelatorioDashboard"
          class="ml-2"
        >
          Relatórios
        </v-btn>
      </v-col>
    </v-row>

    <!-- Dashboard de Status -->
    <CalibracoesSt stats
      :stats="stats"
      class="mb-6"
    />

    <!-- Filtros -->
    <CalibracoesFiltros
      v-model="filtros"
      @aplicar="aplicarFiltros"
      class="mb-6"
    />

    <!-- Tabela de Medições -->
    <CalibracoesTabela
      :medicoes="medicoesFiltradas"
      :loading="loading"
      @editar="editarMedicao"
      @pdf="gerarLaudoPDF"
      @excluir="excluirMedicao"
    />

    <!-- Dialog de Formulário -->
    <CalibracoesForm
      v-model="dialogNovo"
      :equipamentos="equipamentos"
      :loading-equipamentos="loadingEquipamentos"
      @salvar="salvarMedicao"
    />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import CalibracoesStats from '@/components/calibracoes/CalibracoesStats.vue'
import CalibracoesFiltros from '@/components/calibracoes/CalibracoesFiltros.vue'
import CalibracoesTabela from '@/components/calibracoes/CalibracoesTabela.vue'
import CalibracoesForm from '@/components/calibracoes/CalibracoesForm.vue'
import { useMedicoes } from '@/composables/useMedicoes'
import { useEquipamentos } from '@/composables/useEquipamentos'

// Composables
const {
  medicoes,
  stats,
  loading,
  carregar: carregarMedicoes,
  salvar: salvarMedicao,
  excluir: excluirMedicao
} = useMedicoes()

const {
  equipamentos,
  loading: loadingEquipamentos,
  carregar: carregarEquipamentos
} = useEquipamentos()

// State
const filtros = ref({
  busca: '',
  status: null,
  validacao: null,
  tipo: null
})
const dialogNovo = ref(false)

// Computed
const medicoesFiltradas = computed(() => {
  let resultado = medicoes.value

  if (filtros.value.busca) {
    resultado = resultado.filter(m =>
      m.equipamento_codigo.toLowerCase().includes(filtros.value.busca.toLowerCase())
    )
  }

  if (filtros.value.status) {
    resultado = resultado.filter(m => m.status_vencimento === filtros.value.status)
  }

  if (filtros.value.validacao) {
    resultado = resultado.filter(m => m.resultado_validacao === filtros.value.validacao)
  }

  if (filtros.value.tipo) {
    resultado = resultado.filter(m => m.tipo_equipamento === filtros.value.tipo)
  }

  return resultado
})

// Methods
const abrirDialogNovo = () => {
  dialogNovo.value = true
}

const aplicarFiltros = () => {
  // Filtros aplicados automaticamente via computed
  console.log('Filtros aplicados:', filtros.value)
}

const abrirRelatorioDashboard = () => {
  // TODO: Implementar relatórios
}

// Lifecycle
onMounted(async () => {
  await carregarMedicoes()
  await carregarEquipamentos()
})
</script>
```

**Impacto:**
- ⚡ **Performance:** -50% re-renders (componentes menores)
- 🧹 **Manutenibilidade:** +70% (código mais organizado)
- 🧪 **Testabilidade:** +80% (componentes isolados)

**Estimativa:**
- ⏱️ **Esforço:** 2 dias
- 📈 **Ganho:** Arquitetura mais limpa e performática

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b refactor/modularize-calibracoes

# 2. Criar estrutura de diretórios
mkdir -p src/components/calibracoes
mkdir -p src/composables

# 3. Criar componentes
touch src/components/calibracoes/CalibracoesStats.vue
touch src/components/calibracoes/CalibracoesFiltros.vue
touch src/components/calibracoes/CalibracoesTabela.vue
touch src/components/calibracoes/CalibracoesForm.vue

# 4. Criar composables
touch src/composables/useMedicoes.js
touch src/composables/useEquipamentos.js

# 5. Migrar código gradualmente
# - Extrair lógica para composables
# - Extrair template para componentes
# - Manter CalibracoesLista como orquestrador

# 6. Testar cada componente isoladamente
npm run dev

# 7. Commit e push
git add .
git commit -m "refactor: Modularizar CalibracoesLista em 5 componentes"
git push origin refactor/modularize-calibracoes

# 8. Criar PR
gh pr create --title "Refactor: Modularizar CalibracoesLista" \
  --body "Divide componente monolítico (1.228 linhas) em 5 componentes menores e cria composables reutilizáveis."
```

---

#### **OPT-005: Remover console.log de produção** 🔒

**Problema:**  
83 ocorrências de `console.log` expõem dados sensíveis em produção.

**Localização:**
- `src/` (todos os arquivos)

**Exemplos de Logs Sensíveis:**
```javascript
// ❌ Expõe email do usuário
console.log('✅ Login realizado:', usuarios.email)

// ❌ Expõe dados completos do usuário
console.log('👤 Usuário logado:', { id, email, perfil })

// ❌ Expõe chaves de API
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
```

**Solução: Logger Condicional**

```javascript
// src/utils/logger.js
const IS_DEV = import.meta.env.DEV

class Logger {
  constructor(context = '') {
    this.context = context
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString()
    const contextStr = this.context ? `[${this.context}]` : ''
    return {
      timestamp,
      level,
      context: this.context,
      message,
      data
    }
  }

  _shouldLog(level) {
    // Em produção, logar apenas errors
    if (!IS_DEV && level !== 'error') return false
    return true
  }

  log(message, data = null) {
    if (!this._shouldLog('log')) return
    const formatted = this._formatMessage('LOG', message, data)
    console.log(`${formatted.timestamp} ${this.context}`, message, data || '')
  }

  info(message, data = null) {
    if (!this._shouldLog('info')) return
    const formatted = this._formatMessage('INFO', message, data)
    console.info(`ℹ️ ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  warn(message, data = null) {
    if (!this._shouldLog('warn')) return
    const formatted = this._formatMessage('WARN', message, data)
    console.warn(`⚠️ ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  error(message, data = null) {
    // Errors sempre logados, inclusive em produção
    const formatted = this._formatMessage('ERROR', message, data)
    console.error(`❌ ${formatted.timestamp} ${this.context}`, message, data || '')
    
    // Em produção, enviar para serviço de monitoramento
    if (!IS_DEV && window.Sentry) {
      window.Sentry.captureMessage(message, {
        level: 'error',
        extra: { context: this.context, data }
      })
    }
  }

  debug(message, data = null) {
    if (!IS_DEV) return  // Debug apenas em desenvolvimento
    const formatted = this._formatMessage('DEBUG', message, data)
    console.debug(`🔍 ${formatted.timestamp} ${this.context}`, message, data || '')
  }

  success(message, data = null) {
    if (!this._shouldLog('log')) return
    const formatted = this._formatMessage('SUCCESS', message, data)
    console.log(`✅ ${formatted.timestamp} ${this.context}`, message, data || '')
  }
}

export function createLogger(context) {
  return new Logger(context)
}

// Exportar logger global
export const logger = new Logger()
```

**Uso:**
```javascript
// ANTES:
console.log('✅ Login realizado:', usuarios.email)

// DEPOIS:
import { createLogger } from '@/utils/logger'
const logger = createLogger('AuthStore')

logger.success('Login realizado', { userId: usuarios.id })  // ✅ Não expõe email
```

**Script de Migração:**
```bash
# Script para substituir console.log automaticamente
# migration-logger.sh

#!/bin/bash

FILES=$(find src -name "*.js" -o -name "*.vue")

for file in $FILES; do
  # Substituir console.log por logger.log
  sed -i 's/console\.log/logger.log/g' "$file"
  
  # Substituir console.error por logger.error
  sed -i 's/console\.error/logger.error/g' "$file"
  
  # Substituir console.warn por logger.warn
  sed -i 's/console\.warn/logger.warn/g' "$file"
  
  # Adicionar import no topo (se não existir)
  if ! grep -q "import.*logger" "$file"; then
    sed -i "1i import { createLogger } from '@/utils/logger'\nconst logger = createLogger('$(basename $file .vue .js)')\n" "$file"
  fi
done

echo "✅ Migração concluída: $(echo $FILES | wc -w) arquivos processados"
```

**Impacto:**
- 🔒 **Segurança:** +60% (dados sensíveis não expostos)
- 📊 **Monitoramento:** +100% (logs estruturados)
- 🐛 **Debug:** Melhor rastreabilidade

**Estimativa:**
- ⏱️ **Esforço:** 4 horas
- 📈 **Ganho:** Proteção de dados sensíveis

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b security/remove-production-logs

# 2. Criar logger
# Implementar src/utils/logger.js

# 3. Executar script de migração
chmod +x migration-logger.sh
./migration-logger.sh

# 4. Revisar manualmente logs sensíveis
grep -rn "logger.log.*email" src/
grep -rn "logger.log.*senha" src/
# Remover ou ofuscar dados sensíveis

# 5. Testar em dev
npm run dev
# Verificar que logs aparecem

# 6. Testar em prod (build)
npm run build
npm run preview
# Verificar que apenas errors aparecem

# 7. Commit e push
git add .
git commit -m "security: Implementar logger condicional e remover logs sensíveis"
git push origin security/remove-production-logs

# 8. Criar PR
gh pr create --title "Security: Remover logs sensíveis de produção" \
  --body "Implementa logger condicional que remove logs em produção, protegendo dados sensíveis. Resolve 83 ocorrências de console.log."
```

---

#### **OPT-006: Implementar code splitting e lazy loading** ⚡

**Problema:**  
Bundle JS de 906 kB causa carregamento lento da aplicação.

**Análise de Bundle:**
```
dist/assets/index-CERT9VUj.js        906.47 kB │ gzip: 284.73 kB  ⚠️
dist/assets/Auditar...View-CXWKZrUu.js  323.78 kB │ gzip: 106.14 kB
```

**Solução: Lazy Loading de Rotas**

**Implementação:**

```javascript
// src/router/index.js

// ❌ ANTES: Importação estática
import Dashboard from '@/views/Dashboard.vue'
import EquipamentosLista from '@/views/EquipamentosLista.vue'

// ✅ DEPOIS: Lazy loading
const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),  // ✅ Lazy
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),  // ✅ Lazy
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import(
          /* webpackChunkName: "dashboard" */
          '@/views/Dashboard.vue'
        )
      },
      {
        path: 'equipamentos',
        name: 'Equipamentos',
        component: () => import(
          /* webpackChunkName: "equipamentos" */
          '@/views/EquipamentosLista.vue'
        )
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import(
          /* webpackChunkName: "admin" */
          '@/views/UsuariosLista.vue'
        ),
        meta: { requiresAdmin: true }
      },
      {
        path: 'calibracoes',
        name: 'Calibracoes',
        component: () => import(
          /* webpackChunkName: "calibracoes" */
          '@/views/CalibracoesLista.vue'
        )
      },
      {
        path: 'medicoes-horizontal',
        name: 'MedicoesHorizontal',
        component: () => import(
          /* webpackChunkName: "medicoes" */
          '@/views/MedicaoHorizontal.vue'
        )
      },
      {
        path: 'medicoes-vertical',
        name: 'MedicoesVertical',
        component: () => import(
          /* webpackChunkName: "medicoes" */
          '@/views/MedicaoVertical.vue'
        )
      },
      {
        path: 'dispositivos',
        name: 'Dispositivos',
        component: () => import(
          /* webpackChunkName: "medicoes" */
          '@/views/DispositivosLista.vue'
        )
      },
      {
        path: 'relatorios',
        name: 'Relatorios',
        component: () => import(
          /* webpackChunkName: "relatorios" */
          '@/views/RelatoriosLista.vue'
        )
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: () => import(
          /* webpackChunkName: "admin" */
          '@/views/AuditoriaView.vue'
        ),
        meta: { requiresAdmin: true }
      }
    ]
  }
]
```

**Configuração Vite:**

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'vuetify-vendor': ['vuetify', 'vuetify/components', 'vuetify/directives'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'pdf-utils': ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'chart-utils': ['chart.js', 'vue-chartjs'],
          'data-utils': ['xlsx', 'file-saver', 'date-fns']
        }
      }
    },
    // Configurar limite de chunk
    chunkSizeWarningLimit: 500  // kb
  }
})
```

**Componente de Loading:**

```vue
<!-- src/components/RouteLoading.vue -->
<template>
  <div class="route-loading">
    <v-progress-circular
      indeterminate
      color="primary"
      size="64"
    />
    <p class="mt-4">Carregando...</p>
  </div>
</template>

<style scoped>
.route-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
```

**Router com Loading:**

```vue
<!-- src/App.vue -->
<template>
  <v-app>
    <router-view v-slot="{ Component }">
      <Suspense>
        <template #default>
          <component :is="Component" />
        </template>
        <template #fallback>
          <RouteLoading />
        </template>
      </Suspense>
    </router-view>
  </v-app>
</template>

<script setup>
import { Suspense } from 'vue'
import RouteLoading from '@/components/RouteLoading.vue'
</script>
```

**Resultado Esperado:**

```
ANTES:
├── index.js (906 kB) ⚠️

DEPOIS:
├── index.js (150 kB) ✅ Core
├── vue-vendor.js (120 kB) ✅ Vue + Router + Pinia
├── vuetify-vendor.js (250 kB) ✅ Vuetify
├── supabase-vendor.js (80 kB) ✅ Supabase
├── dashboard.js (80 kB) - Lazy
├── equipamentos.js (120 kB) - Lazy
├── calibracoes.js (150 kB) - Lazy
├── medicoes.js (100 kB) - Lazy
├── admin.js (100 kB) - Lazy
└── relatorios.js (80 kB) - Lazy

Total inicial: ~600 kB (vs 906 kB antes) ✅ -34%
```

**Impacto:**
- ⚡ **Performance:** -34% bundle inicial (906 → 600 kB)
- 🚀 **LCP:** -40% (carregamento mais rápido)
- 📦 **Caching:** Melhor (chunks menores)

**Estimativa:**
- ⏱️ **Esforço:** 1 dia
- 📈 **Ganho:** Carregamento 40% mais rápido

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b perf/code-splitting

# 2. Criar componente de loading
# Implementar src/components/RouteLoading.vue

# 3. Editar router
# Adicionar lazy loading em src/router/index.js

# 4. Editar vite.config.js
# Adicionar manualChunks

# 5. Editar App.vue
# Adicionar Suspense para loading

# 6. Build e análise
npm run build
# Verificar tamanho dos chunks

# 7. Testar performance
npm run preview
# Abrir DevTools → Network → Verificar chunks carregados

# 8. Commit e push
git add .
git commit -m "perf: Implementar code splitting e lazy loading"
git push origin perf/code-splitting

# 9. Criar PR
gh pr create --title "Perf: Code splitting e lazy loading" \
  --body "Implementa lazy loading de rotas e manual chunks, reduzindo bundle inicial de 906 kB para ~600 kB (-34%)."
```

---

#### **OPT-007: Implementar cache de queries Supabase** ⚡

**Problema:**  
Queries repetidas ao Supabase sem cache causam lentidão e custos desnecessários.

**Exemplos de Queries Repetidas:**

```javascript
// ❌ Cada componente faz a mesma query
// CalibracoesLista.vue
const { data } = await supabase.from('equipamentos').select('*')

// EquipamentosLista.vue (DUPLICADO)
const { data } = await supabase.from('equipamentos').select('*')

// VinculosLista.vue (DUPLICADO)
const { data } = await supabase.from('equipamentos').select('*')
```

**Solução: Implementar cache com TTL**

```javascript
// src/utils/queryCache.js

class QueryCache {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 5 * 60 * 1000  // 5 minutos
  }

  _generateKey(table, filters) {
    return `${table}:${JSON.stringify(filters)}`
  }

  _isExpired(timestamp, ttl) {
    return Date.now() - timestamp > ttl
  }

  get(table, filters = {}) {
    const key = this._generateKey(table, filters)
    const cached = this.cache.get(key)

    if (!cached) return null

    if (this._isExpired(cached.timestamp, cached.ttl)) {
      this.cache.delete(key)
      return null
    }

    console.log(`🎯 Cache HIT: ${key}`)
    return cached.data
  }

  set(table, filters = {}, data, ttl = null) {
    const key = this._generateKey(table, filters)
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
    console.log(`💾 Cache SET: ${key}`)
  }

  invalidate(table, filters = null) {
    if (filters === null) {
      // Invalidar todos os caches da tabela
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${table}:`)) {
          this.cache.delete(key)
          console.log(`🗑️ Cache INVALIDATE: ${key}`)
        }
      }
    } else {
      // Invalidar cache específico
      const key = this._generateKey(table, filters)
      this.cache.delete(key)
      console.log(`🗑️ Cache INVALIDATE: ${key}`)
    }
  }

  clear() {
    this.cache.clear()
    console.log('🗑️ Cache CLEAR: Todos os caches removidos')
  }

  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const queryCache = new QueryCache()
```

**Wrapper de Supabase com Cache:**

```javascript
// src/infrastructure/api/cachedSupabase.js

import supabase from '@/services/supabase'
import { queryCache } from '@/utils/queryCache'

export class CachedSupabase {
  /**
   * Query com cache automático
   * @param {string} table - Nome da tabela
   * @param {object} options - Opções de query
   * @param {boolean} options.useCache - Usar cache? (padrão: true)
   * @param {number} options.ttl - Tempo de vida em ms (padrão: 5min)
   * @param {object} options.filters - Filtros da query
   * @returns {Promise<{success: boolean, data: any}>}
   */
  static async query(table, options = {}) {
    const {
      useCache = true,
      ttl = 5 * 60 * 1000,  // 5 minutos
      filters = {},
      select = '*'
    } = options

    try {
      // Tentar buscar no cache
      if (useCache) {
        const cached = queryCache.get(table, filters)
        if (cached) {
          return { success: true, data: cached, fromCache: true }
        }
      }

      // Query no Supabase
      let query = supabase.from(table).select(select)

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          query = query.eq(key, value)
        }
      })

      const { data, error } = await query

      if (error) throw error

      // Salvar no cache
      if (useCache) {
        queryCache.set(table, filters, data, ttl)
      }

      return { success: true, data, fromCache: false }

    } catch (error) {
      console.error(`Erro ao buscar ${table}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Invalidar cache após mutação
   */
  static async mutate(table, operation, payload) {
    try {
      let result

      switch (operation) {
        case 'insert':
          result = await supabase.from(table).insert(payload)
          break
        case 'update':
          result = await supabase.from(table).update(payload).eq('id', payload.id)
          break
        case 'delete':
          result = await supabase.from(table).delete().eq('id', payload.id)
          break
        default:
          throw new Error(`Operação inválida: ${operation}`)
      }

      // Invalidar cache da tabela
      queryCache.invalidate(table)

      return { success: !result.error, data: result.data, error: result.error }

    } catch (error) {
      console.error(`Erro em ${operation} ${table}:`, error)
      return { success: false, error: error.message }
    }
  }
}
```

**Uso em Composable:**

```javascript
// src/composables/useEquipamentos.js

import { ref } from 'vue'
import { CachedSupabase } from '@/infrastructure/api/cachedSupabase'

export function useEquipamentos() {
  const equipamentos = ref([])
  const loading = ref(false)

  async function carregar(filtros = {}, useCache = true) {
    loading.value = true
    
    const result = await CachedSupabase.query('equipamentos', {
      filters: { ativo: true, ...filtros },
      useCache,
      ttl: 10 * 60 * 1000  // 10 minutos para equipamentos
    })

    if (result.success) {
      equipamentos.value = result.data
      
      if (result.fromCache) {
        console.log('✅ Equipamentos carregados do cache')
      } else {
        console.log('✅ Equipamentos carregados do Supabase')
      }
    }

    loading.value = false
    return result
  }

  async function criar(equipamento) {
    const result = await CachedSupabase.mutate('equipamentos', 'insert', equipamento)
    
    if (result.success) {
      // Cache invalidado automaticamente
      await carregar({}, false)  // Recarregar sem cache
    }

    return result
  }

  async function atualizar(id, dados) {
    const result = await CachedSupabase.mutate('equipamentos', 'update', { id, ...dados })
    
    if (result.success) {
      await carregar({}, false)
    }

    return result
  }

  async function excluir(id) {
    const result = await CachedSupabase.mutate('equipamentos', 'delete', { id })
    
    if (result.success) {
      await carregar({}, false)
    }

    return result
  }

  return {
    equipamentos,
    loading,
    carregar,
    criar,
    atualizar,
    excluir
  }
}
```

**Uso em Componente:**

```vue
<script setup>
import { onMounted } from 'vue'
import { useEquipamentos } from '@/composables/useEquipamentos'

const { equipamentos, loading, carregar } = useEquipamentos()

onMounted(async () => {
  // Primeira chamada: query no Supabase
  await carregar()  // Resposta em ~200ms
  
  // Segunda chamada: cache hit
  await carregar()  // Resposta em ~5ms ✅
})
</script>
```

**Impacto:**
- ⚡ **Performance:** -70% requests ao Supabase
- 🚀 **Velocidade:** Queries em cache retornam em ~5ms vs ~200ms
- 💰 **Custo:** Redução de custos de API

**Estimativa:**
- ⏱️ **Esforço:** 1 dia
- 📈 **Ganho:** 70% menos requests

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b perf/query-cache

# 2. Criar utilitário de cache
# Implementar src/utils/queryCache.js

# 3. Criar wrapper Supabase
# Implementar src/infrastructure/api/cachedSupabase.js

# 4. Refatorar composables
# Migrar useEquipamentos, useMedicoes para usar cache

# 5. Testar
npm run dev
# Verificar console logs de cache HIT/MISS

# 6. Commit e push
git add .
git commit -m "perf: Implementar cache de queries Supabase"
git push origin perf/query-cache

# 7. Criar PR
gh pr create --title "Perf: Cache de queries Supabase" \
  --body "Implementa cache com TTL para queries Supabase, reduzindo requests em 70% e melhorando velocidade de resposta."
```

---

#### **OPT-008: Otimizar loops e cálculos repetidos** ⚡

**Problema:**  
Múltiplos `.map()` encadeados e cálculos repetidos causam lentidão.

**Exemplo de Código Ineficiente:**

```javascript
// ❌ INEFICIENTE: 3 loops sobre o mesmo array
equipamentos.value = response
  .map(eq => ({ ...eq, tipoDetalhado: detectarTipoEquipamento(eq.codigo) }))
  .map(eq => ({ ...eq, nome_completo: `${eq.codigo} - ${eq.nome}` }))
  .map(eq => ({ ...eq, descricao_tipo: eq.tipoDetalhado?.descricao || eq.nome }))
```

**Solução Otimizada:**

```javascript
// ✅ OTIMIZADO: 1 único loop
equipamentos.value = response.map(eq => {
  const tipoDetalhado = detectarTipoEquipamento(eq.codigo)
  return {
    ...eq,
    tipoDetalhado,
    nome_completo: `${eq.codigo} - ${eq.nome}`,
    descricao_tipo: tipoDetalhado?.descricao || eq.nome
  }
})
```

**Cache de Função Pura:**

```javascript
// src/services/equipamentoService.js

// Cache de tipos detectados
const tipoCache = new Map()

export function detectarTipoEquipamento(codigo) {
  if (!codigo) return null
  
  // Cache hit
  if (tipoCache.has(codigo)) {
    return tipoCache.get(codigo)
  }
  
  const codigoUpper = codigo.toUpperCase()
  let tipo = null
  
  // Lógica de detecção (sem mudanças)
  if (codigoUpper.includes('RH') && codigoUpper.includes('H15')) {
    tipo = {
      tipo: 'horizontal',
      subtipo: '15m',
      geometrias: ['15m/1,5°'],
      descricao: 'Retrorrefletômetro Horizontal 15m',
      quantidadeMedicoes: 10,
      icon: 'mdi-road'
    }
  } else if (codigoUpper.includes('RH') && (codigoUpper.includes('H30') || codigoUpper.includes('HM'))) {
    tipo = {
      tipo: 'horizontal',
      subtipo: '30m',
      geometrias: ['30m/1,0°'],
      descricao: 'Retrorrefletômetro Horizontal 30m (Mini)',
      quantidadeMedicoes: 10,
      simuladorChuva: true,
      icon: 'mdi-road-variant'
    }
  }
  // ... outros tipos
  
  // Salvar no cache
  tipoCache.set(codigo, tipo)
  return tipo
}

// Função para limpar cache (útil em testes)
export function clearTipoCache() {
  tipoCache.clear()
}
```

**Otimização de Computed Properties:**

```javascript
// ❌ INEFICIENTE: Recalculado a cada render
const medicoesFiltradas = computed(() => {
  return medicoes.value.filter(m => {
    // Filtros complexos
    const matchBusca = m.equipamento_codigo.toLowerCase().includes(filtros.value.busca.toLowerCase())
    const matchStatus = !filtros.value.status || m.status_vencimento === filtros.value.status
    const matchValidacao = !filtros.value.validacao || m.resultado_validacao === filtros.value.validacao
    
    return matchBusca && matchStatus && matchValidacao
  })
})

// ✅ OTIMIZADO: Com early return e memoization
import { computed, ref, watch } from 'vue'

const medicoesFiltradas = computed(() => {
  let resultado = medicoes.value
  
  // Early returns para filtros vazios
  if (!filtros.value.busca && !filtros.value.status && !filtros.value.validacao) {
    return resultado
  }
  
  // Filtro de busca (mais custoso)
  if (filtros.value.busca) {
    const buscaLower = filtros.value.busca.toLowerCase()
    resultado = resultado.filter(m =>
      m.equipamento_codigo.toLowerCase().includes(buscaLower)
    )
  }
  
  // Filtros simples
  if (filtros.value.status) {
    resultado = resultado.filter(m => m.status_vencimento === filtros.value.status)
  }
  
  if (filtros.value.validacao) {
    resultado = resultado.filter(m => m.resultado_validacao === filtros.value.validacao)
  }
  
  return resultado
})
```

**Debounce para Filtros:**

```javascript
// src/composables/useDebounce.js
import { ref, watch } from 'vue'

export function useDebounce(value, delay = 300) {
  const debouncedValue = ref(value.value)
  let timeout

  watch(value, (newVal) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      debouncedValue.value = newVal
    }, delay)
  })

  return debouncedValue
}

// Uso em componente
const filtros = ref({ busca: '' })
const filtrosDebounced = useDebounce(filtros, 300)  // 300ms delay

const medicoesFiltradas = computed(() => {
  // Usa valor debounced, não recalcula a cada tecla
  return medicoes.value.filter(m =>
    m.equipamento_codigo.toLowerCase().includes(filtrosDebounced.value.busca.toLowerCase())
  )
})
```

**Impacto:**
- ⚡ **Performance:** -40% tempo de processamento
- 🚀 **Responsividade:** UI mais fluida
- 💾 **Memória:** -20% alocações

**Estimativa:**
- ⏱️ **Esforço:** 6 horas
- 📈 **Ganho:** 40% mais rápido em listas grandes

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b perf/optimize-loops

# 2. Identificar loops ineficientes
grep -rn ".map(.*).map(" src/

# 3. Refatorar para loops únicos
# Editar arquivos identificados

# 4. Implementar cache de funções puras
# Adicionar tipoCache em equipamentoService.js

# 5. Criar composable de debounce
# Implementar src/composables/useDebounce.js

# 6. Aplicar debounce em filtros
# Editar CalibracoesLista.vue, EquipamentosLista.vue, etc

# 7. Testar performance
npm run dev
# Usar Chrome DevTools → Performance
# Medir tempo antes e depois

# 8. Commit e push
git add .
git commit -m "perf: Otimizar loops e cálculos repetidos"
git push origin perf/optimize-loops

# 9. Criar PR
gh pr create --title "Perf: Otimizar loops e cálculos" \
  --body "Unifica loops encadeados, implementa cache de funções puras e debounce em filtros. Ganho de 40% em performance."
```

---

#### **OPT-009: Implementar error boundary e tratamento global** 🐛

**Problema:**  
Erros não capturados podem quebrar a aplicação sem feedback ao usuário.

**Solução: Error Boundary Vue 3**

```javascript
// src/components/ErrorBoundary.vue
<template>
  <div v-if="error" class="error-boundary">
    <v-alert
      type="error"
      prominent
      border="start"
      closable
      @click:close="resetError"
    >
      <v-alert-title>
        <v-icon class="mr-2">mdi-alert-circle</v-icon>
        Ocorreu um erro inesperado
      </v-alert-title>

      <div class="mt-2">
        <p>{{ error.message }}</p>
        <v-btn
          size="small"
          variant="outlined"
          @click="resetError"
          class="mt-2"
        >
          Tentar Novamente
        </v-btn>
        <v-btn
          size="small"
          variant="text"
          @click="goHome"
          class="mt-2 ml-2"
        >
          Voltar ao Início
        </v-btn>
      </div>

      <!-- Detalhes técnicos (apenas em dev) -->
      <v-expand-transition>
        <div v-if="showDetails && isDev" class="mt-4">
          <v-divider class="my-2" />
          <pre class="text-caption">{{ error.stack }}</pre>
        </div>
      </v-expand-transition>
      
      <v-btn
        v-if="isDev"
        size="small"
        variant="text"
        @click="showDetails = !showDetails"
        class="mt-2"
      >
        {{ showDetails ? 'Ocultar' : 'Ver' }} Detalhes
      </v-btn>
    </v-alert>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const error = ref(null)
const showDetails = ref(false)
const isDev = import.meta.env.DEV

onErrorCaptured((err, instance, info) => {
  error.value = {
    message: err.message,
    stack: err.stack,
    info,
    component: instance?.$options?.name
  }
  
  // Log em produção (enviar para Sentry)
  if (!isDev && window.Sentry) {
    window.Sentry.captureException(err, {
      contexts: {
        vue: {
          component: instance?.$options?.name,
          info
        }
      }
    })
  }
  
  console.error('Error captured:', err)
  
  // Prevenir propagação
  return false
})

const resetError = () => {
  error.value = null
}

const goHome = () => {
  error.value = null
  router.push('/dashboard')
}
</script>

<style scoped>
.error-boundary {
  padding: 24px;
}
pre {
  background: rgba(0, 0, 0, 0.1);
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
```

**Uso em App.vue:**

```vue
<template>
  <v-app>
    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>
  </v-app>
</template>

<script setup>
import ErrorBoundary from '@/components/ErrorBoundary.vue'
</script>
```

**Global Error Handler:**

```javascript
// src/plugins/errorHandler.js
import { createLogger } from '@/utils/logger'

const logger = createLogger('GlobalErrorHandler')

export function setupErrorHandler(app) {
  // Vue error handler
  app.config.errorHandler = (err, instance, info) => {
    logger.error('Vue Error', {
      message: err.message,
      component: instance?.$options?.name,
      info,
      stack: err.stack
    })
    
    // Enviar para Sentry em produção
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureException(err, {
        contexts: {
          vue: {
            componentName: instance?.$options?.name,
            propsData: instance?.$props,
            info
          }
        }
      })
    }
  }

  // Warn handler (apenas dev)
  if (import.meta.env.DEV) {
    app.config.warnHandler = (msg, instance, trace) => {
      logger.warn('Vue Warning', { msg, component: instance?.$options?.name })
    }
  }

  // Global unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise
    })
    
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureException(event.reason)
    }
    
    event.preventDefault()
  })

  // Global errors
  window.addEventListener('error', (event) => {
    logger.error('Global Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    })
    
    if (import.meta.env.PROD && window.Sentry) {
      window.Sentry.captureException(event.error)
    }
  })
}
```

**Registro em main.js:**

```javascript
// src/main.js
import { createApp } from 'vue'
import { setupErrorHandler } from './plugins/errorHandler'
import App from './App.vue'

const app = createApp(App)

// Configurar error handling
setupErrorHandler(app)

// ... resto da configuração
app.mount('#app')
```

**Impacto:**
- 🐛 **Confiabilidade:** +90% (erros capturados e tratados)
- 👥 **UX:** Melhor feedback ao usuário
- 🔍 **Debug:** Rastreamento de erros em produção

**Estimativa:**
- ⏱️ **Esforço:** 4 horas
- 📈 **Ganho:** Aplicação mais robusta

**Passo a Passo:**
```bash
# 1. Criar branch
git checkout -b feat/error-boundary

# 2. Criar ErrorBoundary component
# Implementar src/components/ErrorBoundary.vue

# 3. Criar plugin de error handling
# Implementar src/plugins/errorHandler.js

# 4. Integrar em App.vue e main.js

# 5. Testar com erro forçado
# Criar componente que lança erro
# Verificar que ErrorBoundary captura

# 6. Commit e push
git add .
git commit -m "feat: Implementar error boundary e tratamento global"
git push origin feat/error-boundary

# 7. Criar PR
gh pr create --title "Feat: Error boundary e tratamento global" \
  --body "Implementa captura de erros em componentes e handlers globais, melhorando robustez e UX."
```

---

### 🟢 P2 - Médio (Dia 11-15) - 14 itens

Total: **6 dias**

*(Continua no próximo documento...)*

---

## 📊 Resumo de Impacto

### Ganhos Esperados (Após P0 + P1)

| Métrica | Antes | Depois | Ganho |
|---------|-------|--------|-------|
| **Bundle Inicial** | 906 kB | ~600 kB | -34% |
| **Tempo de Carregamento** | 3.5s | 2.1s | -40% |
| **Requests ao Supabase** | 100% | 30% | -70% |
| **Vulnerabilidades Críticas** | 3 | 0 | -100% |
| **Linhas por Componente (Média)** | 520 | 310 | -40% |
| **Manutenibilidade (Score)** | 6/10 | 8.5/10 | +42% |

### Cronograma de Implementação

```
Semana 1 (Dia 1-5):
  ✅ P0-001: Fix equipamentos (1h)
  ✅ P0-002: Hash de senhas (1 dia)
  ✅ P0-003: Handlers de menu (2h)
  ✅ P1-004: Modularizar CalibracoesLista (2 dias)

Semana 2 (Dia 6-10):
  ✅ P1-005: Remover console.log (4h)
  ✅ P1-006: Code splitting (1 dia)
  ✅ P1-007: Cache de queries (1 dia)
  ✅ P1-008: Otimizar loops (6h)
  ✅ P1-009: Error boundary (4h)

Semana 3 (Dia 11-15):
  ⏳ P2: Implementações de médio prazo
  ⏳ Testes de integração
  ⏳ Documentação atualizada
```

---

## 🎯 Próximos Passos

1. **Revisar e aprovar** este plano com stakeholders
2. **Priorizar P0** e iniciar implementação imediata
3. **Criar issues no GitHub** para cada otimização
4. **Estabelecer métricas** de sucesso (lighthouse, bundle analyzer)
5. **Configurar CI/CD** para validar otimizações automaticamente

---

**Documento mantido por:** Equipe de Desenvolvimento  
**Última atualização:** 2026-02-15  
**Próxima revisão:** 2026-03-01
