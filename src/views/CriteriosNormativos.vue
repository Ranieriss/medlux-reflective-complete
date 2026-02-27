<!-- src/views/CriteriosNormativos.vue -->
<template>
  <v-container fluid class="cn-page">
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="cn-hero glass">
          <div class="cn-hero__title">Critérios Normativos</div>
          <div class="cn-hero__subtitle">
            Tabelas normativas (Supabase) — edição restrita ao Administrador.
          </div>

          <div class="cn-hero__chips">
            <v-chip
              size="small"
              variant="tonal"
              :color="isOnline ? 'success' : 'warning'"
              class="mr-2"
            >
              {{ isOnline ? 'Online' : 'Offline' }}
            </v-chip>

            <v-chip size="small" variant="tonal" color="info" class="mr-2">
              Perfil: {{ authStore?.isAdmin ? 'ADMIN' : 'OPERADOR' }}
            </v-chip>

            <v-chip
              v-if="lastLoadAt"
              size="small"
              variant="tonal"
              color="secondary"
              class="mr-2"
            >
              Atualizado: {{ lastLoadAt }}
            </v-chip>

            <v-spacer />

            <v-btn
              size="small"
              variant="tonal"
              class="glass-btn"
              :loading="loading"
              @click="reloadAll"
            >
              Recarregar
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <div class="glass cn-card">
          <v-tabs v-model="tab" class="cn-tabs" bg-color="transparent">
            <v-tab value="horizontal">Horizontal</v-tab>
            <v-tab value="vertical">Vertical</v-tab>
            <v-tab value="dispositivos">Dispositivos (Tachas)</v-tab>
          </v-tabs>

          <v-divider class="my-3" />

          <v-window v-model="tab">
            <!-- HORIZONTAL -->
            <v-window-item value="horizontal">
              <div class="cn-toolbar">
                <v-text-field
                  v-model="filters.horizontal"
                  label="Buscar"
                  variant="solo-filled"
                  density="compact"
                  hide-details
                  class="cn-search"
                  prepend-inner-icon="mdi-magnify"
                />
                <v-spacer />
                <v-alert
                  v-if="error.horizontal"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="cn-alert"
                >
                  {{ error.horizontal }}
                </v-alert>
              </div>

              <v-data-table
                :headers="headersHorizontal"
                :items="filteredHorizontal"
                :loading="loading"
                item-key="id"
                class="cn-table glass"
                density="comfortable"
                hover
              >
                <template #loading>
                  <div class="cn-empty">
                    <v-progress-circular indeterminate />
                    <div class="cn-empty__text">Carregando critérios...</div>
                  </div>
                </template>

                <template #no-data>
                  <div class="cn-empty">
                    <v-icon size="28" class="mb-2">mdi-database-off-outline</v-icon>
                    <div class="cn-empty__title">Nenhum critério cadastrado</div>
                    <div class="cn-empty__text">
                      Verifique a tabela <b>norma_criterios_horizontal</b> no Supabase.
                    </div>
                  </div>
                </template>

                <!-- valor_minimo editável (admin) -->
                <template #item.valor_minimo="{ item }">
                  <div class="cn-cell">
                    <v-text-field
                      v-if="authStore.isAdmin"
                      :model-value="formatNumberDisplay(item.raw?.valor_minimo)"
                      @update:modelValue="(v) => onEditValorMinimo('horizontal', item.raw, v)"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      class="cn-input"
                      inputmode="decimal"
                    />
                    <span v-else class="cn-readonly">
                      {{ formatNumberDisplay(item.raw?.valor_minimo) }}
                    </span>
                  </div>
                </template>

                <!-- ativo editável (admin) -->
                <template #item.ativo="{ item }">
                  <div class="cn-cell">
                    <v-switch
                      v-if="authStore.isAdmin"
                      :model-value="!!item.raw?.ativo"
                      @update:modelValue="(v) => onToggleAtivo('horizontal', item.raw, v)"
                      color="success"
                      inset
                      hide-details
                      density="compact"
                    />
                    <v-chip v-else size="small" variant="tonal" :color="item.raw?.ativo ? 'success' : 'error'">
                      {{ item.raw?.ativo ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </div>
                </template>

                <template #item.norma_ref="{ item }">
                  <span class="cn-muted">{{ item.raw?.norma_ref || '-' }}</span>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- VERTICAL -->
            <v-window-item value="vertical">
              <div class="cn-toolbar">
                <v-text-field
                  v-model="filters.vertical"
                  label="Buscar (classe, ângulos, cor...)"
                  variant="solo-filled"
                  density="compact"
                  hide-details
                  class="cn-search"
                  prepend-inner-icon="mdi-magnify"
                />
                <v-spacer />
                <v-alert
                  v-if="error.vertical"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="cn-alert"
                >
                  {{ error.vertical }}
                </v-alert>
              </div>

              <v-data-table
                :headers="headersVertical"
                :items="filteredVertical"
                :loading="loading"
                item-key="id"
                class="cn-table glass"
                density="comfortable"
                hover
              >
                <template #loading>
                  <div class="cn-empty">
                    <v-progress-circular indeterminate />
                    <div class="cn-empty__text">Carregando critérios...</div>
                  </div>
                </template>

                <template #no-data>
                  <div class="cn-empty">
                    <v-icon size="28" class="mb-2">mdi-database-off-outline</v-icon>
                    <div class="cn-empty__title">Nenhum critério cadastrado</div>
                    <div class="cn-empty__text">
                      Verifique a tabela <b>norma_vertical</b> no Supabase.
                    </div>
                  </div>
                </template>

                <!-- valor_minimo editável (admin) -->
                <template #item.valor_minimo="{ item }">
                  <div class="cn-cell">
                    <v-text-field
                      v-if="authStore.isAdmin"
                      :model-value="formatNumberDisplay(item.raw?.valor_minimo)"
                      @update:modelValue="(v) => onEditValorMinimo('vertical', item.raw, v)"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      class="cn-input"
                      inputmode="decimal"
                    />
                    <span v-else class="cn-readonly">
                      {{ formatNumberDisplay(item.raw?.valor_minimo) }}
                    </span>
                  </div>
                </template>

                <!-- ativo editável (admin) -->
                <template #item.ativo="{ item }">
                  <div class="cn-cell">
                    <v-switch
                      v-if="authStore.isAdmin"
                      :model-value="!!item.raw?.ativo"
                      @update:modelValue="(v) => onToggleAtivo('vertical', item.raw, v)"
                      color="success"
                      inset
                      hide-details
                      density="compact"
                    />
                    <v-chip v-else size="small" variant="tonal" :color="item.raw?.ativo ? 'success' : 'error'">
                      {{ item.raw?.ativo ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </div>
                </template>

                <template #item.classe_pelicula="{ item }">
                  <v-chip size="small" variant="tonal" color="info">
                    {{ item.raw?.classe_pelicula || '-' }}
                  </v-chip>
                </template>

                <template #item.angulo_observacao="{ item }">
                  <span class="cn-mono">{{ formatAngle(item.raw?.angulo_observacao) }}</span>
                </template>

                <template #item.angulo_entrada="{ item }">
                  <span class="cn-mono">{{ formatAngle(item.raw?.angulo_entrada) }}</span>
                </template>

                <template #item.norma_ref="{ item }">
                  <span class="cn-muted">{{ item.raw?.norma_ref || '-' }}</span>
                </template>
              </v-data-table>

              <div class="cn-footnote">
                * Tipos <b>IV</b> e <b>V</b não são exibidos (não retrorrefletivos).
              </div>
            </v-window-item>

            <!-- DISPOSITIVOS -->
            <v-window-item value="dispositivos">
              <div class="cn-toolbar">
                <v-text-field
                  v-model="filters.dispositivos"
                  label="Buscar (tipo de lente, cor...)"
                  variant="solo-filled"
                  density="compact"
                  hide-details
                  class="cn-search"
                  prepend-inner-icon="mdi-magnify"
                />
                <v-spacer />
                <v-alert
                  v-if="error.dispositivos"
                  type="error"
                  variant="tonal"
                  density="compact"
                  class="cn-alert"
                >
                  {{ error.dispositivos }}
                </v-alert>
              </div>

              <v-data-table
                :headers="headersDispositivos"
                :items="filteredDispositivos"
                :loading="loading"
                item-key="id"
                class="cn-table glass"
                density="comfortable"
                hover
              >
                <template #loading>
                  <div class="cn-empty">
                    <v-progress-circular indeterminate />
                    <div class="cn-empty__text">Carregando critérios...</div>
                  </div>
                </template>

                <template #no-data>
                  <div class="cn-empty">
                    <v-icon size="28" class="mb-2">mdi-database-off-outline</v-icon>
                    <div class="cn-empty__title">Nenhum critério cadastrado</div>
                    <div class="cn-empty__text">
                      Verifique a tabela <b>norma_dispositivos</b> no Supabase.
                    </div>
                  </div>
                </template>

                <!-- valor_minimo editável (admin) -->
                <template #item.valor_minimo="{ item }">
                  <div class="cn-cell">
                    <v-text-field
                      v-if="authStore.isAdmin"
                      :model-value="formatNumberDisplay(item.raw?.valor_minimo)"
                      @update:modelValue="(v) => onEditValorMinimo('dispositivos', item.raw, v)"
                      variant="solo-filled"
                      density="compact"
                      hide-details
                      class="cn-input"
                      inputmode="decimal"
                    />
                    <span v-else class="cn-readonly">
                      {{ formatNumberDisplay(item.raw?.valor_minimo) }}
                    </span>
                  </div>
                </template>

                <!-- ativo editável (admin) -->
                <template #item.ativo="{ item }">
                  <div class="cn-cell">
                    <v-switch
                      v-if="authStore.isAdmin"
                      :model-value="!!item.raw?.ativo"
                      @update:modelValue="(v) => onToggleAtivo('dispositivos', item.raw, v)"
                      color="success"
                      inset
                      hide-details
                      density="compact"
                    />
                    <v-chip v-else size="small" variant="tonal" :color="item.raw?.ativo ? 'success' : 'error'">
                      {{ item.raw?.ativo ? 'Ativo' : 'Inativo' }}
                    </v-chip>
                  </div>
                </template>

                <template #item.tipo_lente="{ item }">
                  <v-chip size="small" variant="tonal" color="primary">
                    {{ item.raw?.tipo_lente || '-' }}
                  </v-chip>
                </template>

                <template #item.angulo_observacao="{ item }">
                  <span class="cn-mono">{{ formatAngle(item.raw?.angulo_observacao) }}</span>
                </template>

                <template #item.angulo_entrada="{ item }">
                  <span class="cn-mono">{{ formatAngle(item.raw?.angulo_entrada) }}</span>
                </template>

                <template #item.norma_ref="{ item }">
                  <span class="cn-muted">{{ item.raw?.norma_ref || '-' }}</span>
                </template>
              </v-data-table>

              <div class="cn-footnote">
                * Dispositivos: somente por <b>tipo de lente retrorrefletiva</b> + <b>cor</b> (NBR 14636).
              </div>
            </v-window-item>
          </v-window>
        </div>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2800" location="bottom right">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

// Ajuste os imports abaixo para o seu projeto (os nomes são os mais comuns no MEDLUX)
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabaseClient' // se no seu projeto for outro caminho, troque aqui

type TabKey = 'horizontal' | 'vertical' | 'dispositivos'

type HorizontalRow = {
  id?: string
  geometria?: string
  material?: string
  cor?: string
  momento?: string
  unidade?: string
  valor_minimo?: number | null
  norma_ref?: string
  ativo?: boolean | null
}

type VerticalRow = {
  id?: string
  classe_pelicula?: string
  angulo_observacao?: number | null
  angulo_entrada?: number | null
  cor?: string
  valor_minimo?: number | null
  unidade?: string
  norma_ref?: string
  ativo?: boolean | null
}

type DispositivoRow = {
  id?: string
  tipo_lente?: string
  angulo_observacao?: number | null
  angulo_entrada?: number | null
  cor?: string
  valor_minimo?: number | null
  unidade?: string
  norma_ref?: string
  ativo?: boolean | null
}

const authStore = useAuthStore()

const tab = ref<TabKey>('horizontal')
const loading = ref(false)
const lastLoadAt = ref<string>('')

const isOnline = ref<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true)

const filters = reactive<Record<TabKey, string>>({
  horizontal: '',
  vertical: '',
  dispositivos: ''
})

const error = reactive<Record<TabKey, string>>({
  horizontal: '',
  vertical: '',
  dispositivos: ''
})

const rowsHorizontal = ref<HorizontalRow[]>([])
const rowsVertical = ref<VerticalRow[]>([])
const rowsDispositivos = ref<DispositivoRow[]>([])

const snackbar = reactive<{ show: boolean; text: string; color: string }>({
  show: false,
  text: '',
  color: 'success'
})

function toast(text: string, color: 'success' | 'error' | 'warning' | 'info' = 'success') {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

function nowBR() {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'medium'
    }).format(new Date())
  } catch {
    return new Date().toLocaleString()
  }
}

function safeText(v: unknown) {
  return String(v ?? '').trim().toLowerCase()
}

function formatNumberDisplay(v: unknown) {
  if (v === null || v === undefined || v === '') return ''
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  // mantém simples pra edição; sem milhar, com ponto/virgula aceitos
  return String(n)
}

function parseNumberInput(v: string): number | null {
  const raw = (v ?? '').toString().trim()
  if (!raw) return null
  // aceita "12,3" e "12.3"
  const norm = raw.replace(/\./g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : null
}

function formatAngle(v: unknown) {
  if (v === null || v === undefined || v === '') return '-'
  const n = Number(v)
  if (Number.isNaN(n)) return String(v)
  // exibe sem forçar casas; mas preserva decimais se existirem
  return n.toString()
}

/**
 * IMPORTANTES:
 * - Vertical: remover Tipos IV e V da UI (não retrorrefletivos).
 *   Fazemos filtro pela classe_pelicula.
 */
function isVerticalClassAllowed(classe?: string) {
  const c = (classe ?? '').toString().trim().toUpperCase()
  if (!c) return true
  if (c === 'IV' || c === 'V') return false
  // também bloqueia variações tipo "TIPO IV" / "TYPE IV"
  if (c.includes('IV') && (c.includes('TIPO') || c.includes('TYPE'))) return false
  if (c.includes('V') && (c.includes('TIPO') || c.includes('TYPE'))) return false
  return true
}

async function loadHorizontal() {
  error.horizontal = ''
  try {
    const { data, error: err } = await supabase
      .from('norma_criterios_horizontal')
      .select('*')
      .order('geometria', { ascending: true })
      .order('material', { ascending: true })
      .order('cor', { ascending: true })
      .order('momento', { ascending: true })

    if (err) throw err
    rowsHorizontal.value = (data ?? []) as HorizontalRow[]
  } catch (e: any) {
    rowsHorizontal.value = []
    error.horizontal = `Falha ao carregar (horizontal): ${e?.message || e}`
  }
}

async function loadVertical() {
  error.vertical = ''
  try {
    const { data, error: err } = await supabase
      .from('norma_vertical')
      .select('*')
      .order('classe_pelicula', { ascending: true })
      .order('angulo_observacao', { ascending: true })
      .order('angulo_entrada', { ascending: true })
      .order('cor', { ascending: true })

    if (err) throw err

    const all = (data ?? []) as VerticalRow[]
    rowsVertical.value = all.filter((r) => isVerticalClassAllowed(r.classe_pelicula))
  } catch (e: any) {
    rowsVertical.value = []
    error.vertical = `Falha ao carregar (vertical): ${e?.message || e}`
  }
}

async function loadDispositivos() {
  error.dispositivos = ''
  try {
    const { data, error: err } = await supabase
      .from('norma_dispositivos')
      .select('*')
      .order('tipo_lente', { ascending: true })
      .order('cor', { ascending: true })
      .order('angulo_observacao', { ascending: true })
      .order('angulo_entrada', { ascending: true })

    if (err) throw err
    rowsDispositivos.value = (data ?? []) as DispositivoRow[]
  } catch (e: any) {
    rowsDispositivos.value = []
    error.dispositivos = `Falha ao carregar (dispositivos): ${e?.message || e}`
  }
}

async function reloadAll() {
  loading.value = true
  try {
    await Promise.all([loadHorizontal(), loadVertical(), loadDispositivos()])
    lastLoadAt.value = nowBR()
    toast('Critérios recarregados.', 'success')
  } catch {
    // os loaders já tratam erro individual
    toast('Recarregado com alertas (ver mensagens).', 'warning')
  } finally {
    loading.value = false
  }
}

type TableKey = TabKey

function getTableName(key: TableKey) {
  if (key === 'horizontal') return 'norma_criterios_horizontal'
  if (key === 'vertical') return 'norma_vertical'
  return 'norma_dispositivos'
}

async function onEditValorMinimo(table: TableKey, row: any, inputValue: string) {
  if (!authStore.isAdmin) return
  if (!row?.id) return

  const newValue = parseNumberInput(inputValue)
  const tableName = getTableName(table)

  // otimista na UI:
  row.valor_minimo = newValue

  try {
    const { error: err } = await supabase
      .from(tableName)
      .update({ valor_minimo: newValue })
      .eq('id', row.id)

    if (err) throw err
    toast('Valor mínimo atualizado.', 'success')
  } catch (e: any) {
    toast(`Falha ao atualizar valor mínimo: ${e?.message || e}`, 'error')
    // rollback simples: recarrega apenas a aba atual
    if (table === 'horizontal') await loadHorizontal()
    if (table === 'vertical') await loadVertical()
    if (table === 'dispositivos') await loadDispositivos()
  }
}

async function onToggleAtivo(table: TableKey, row: any, value: boolean) {
  if (!authStore.isAdmin) return
  if (!row?.id) return

  const tableName = getTableName(table)

  // otimista
  row.ativo = !!value

  try {
    const { error: err } = await supabase.from(tableName).update({ ativo: !!value }).eq('id', row.id)
    if (err) throw err
    toast('Status atualizado.', 'success')
  } catch (e: any) {
    toast(`Falha ao atualizar status: ${e?.message || e}`, 'error')
    // rollback
    if (table === 'horizontal') await loadHorizontal()
    if (table === 'vertical') await loadVertical()
    if (table === 'dispositivos') await loadDispositivos()
  }
}

const headersHorizontal = [
  { title: 'Geometria', key: 'geometria', sortable: true },
  { title: 'Material', key: 'material', sortable: true },
  { title: 'Cor', key: 'cor', sortable: true },
  { title: 'Momento', key: 'momento', sortable: true },
  { title: 'Unidade', key: 'unidade', sortable: false },
  { title: 'Valor mínimo', key: 'valor_minimo', sortable: false },
  { title: 'Norma', key: 'norma_ref', sortable: false },
  { title: 'Ativo', key: 'ativo', sortable: false }
]

const headersVertical = [
  { title: 'Classe (Tipo)', key: 'classe_pelicula', sortable: true },
  { title: 'Ângulo obs.', key: 'angulo_observacao', sortable: true },
  { title: 'Ângulo ent.', key: 'angulo_entrada', sortable: true },
  { title: 'Cor', key: 'cor', sortable: true },
  { title: 'Unidade', key: 'unidade', sortable: false },
  { title: 'Valor mínimo', key: 'valor_minimo', sortable: false },
  { title: 'Norma', key: 'norma_ref', sortable: false },
  { title: 'Ativo', key: 'ativo', sortable: false }
]

const headersDispositivos = [
  { title: 'Tipo de lente', key: 'tipo_lente', sortable: true },
  { title: 'Cor', key: 'cor', sortable: true },
  { title: 'Ângulo obs.', key: 'angulo_observacao', sortable: true },
  { title: 'Ângulo ent.', key: 'angulo_entrada', sortable: true },
  { title: 'Unidade', key: 'unidade', sortable: false },
  { title: 'Valor mínimo', key: 'valor_minimo', sortable: false },
  { title: 'Norma', key: 'norma_ref', sortable: false },
  { title: 'Ativo', key: 'ativo', sortable: false }
]

const filteredHorizontal = computed(() => {
  const q = safeText(filters.horizontal)
  if (!q) return rowsHorizontal.value
  return rowsHorizontal.value.filter((r) => {
    const blob = [
      r.geometria,
      r.material,
      r.cor,
      r.momento,
      r.unidade,
      r.valor_minimo,
      r.norma_ref,
      r.ativo
    ]
      .map(safeText)
      .join(' ')
    return blob.includes(q)
  })
})

const filteredVertical = computed(() => {
  const q = safeText(filters.vertical)
  if (!q) return rowsVertical.value
  return rowsVertical.value.filter((r) => {
    const blob = [
      r.classe_pelicula,
      r.angulo_observacao,
      r.angulo_entrada,
      r.cor,
      r.unidade,
      r.valor_minimo,
      r.norma_ref,
      r.ativo
    ]
      .map(safeText)
      .join(' ')
    return blob.includes(q)
  })
})

const filteredDispositivos = computed(() => {
  const q = safeText(filters.dispositivos)
  if (!q) return rowsDispositivos.value
  return rowsDispositivos.value.filter((r) => {
    const blob = [
      r.tipo_lente,
      r.angulo_observacao,
      r.angulo_entrada,
      r.cor,
      r.unidade,
      r.valor_minimo,
      r.norma_ref,
      r.ativo
    ]
      .map(safeText)
      .join(' ')
    return blob.includes(q)
  })
})

function bindOnlineListeners() {
  if (typeof window === 'undefined') return
  const on = () => (isOnline.value = true)
  const off = () => (isOnline.value = false)
  window.addEventListener('online', on)
  window.addEventListener('offline', off)
}

onMounted(async () => {
  bindOnlineListeners()
  await reloadAll()
})
</script>

<style scoped>
/* ===== Premium glass/dark ===== */
.cn-page {
  padding-top: 16px;
  padding-bottom: 24px;
}

.glass {
  background: rgba(18, 20, 28, 0.58);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 14px 45px rgba(0, 0, 0, 0.35);
  border-radius: 18px;
}

.cn-hero {
  padding: 18px 18px 14px 18px;
}

.cn-hero__title {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.92);
}

.cn-hero__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
}

.cn-hero__chips {
  margin-top: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.glass-btn {
  border: 1px solid rgba(255, 255, 255, 0.10);
}

.cn-card {
  padding: 12px;
}

.cn-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.cn-tabs :deep(.v-tab--selected) {
  color: rgba(255, 255, 255, 0.95);
}

.cn-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cn-search {
  max-width: 460px;
}

.cn-alert {
  max-width: 520px;
}

.cn-table {
  border-radius: 16px;
  overflow: hidden;
}

.cn-table :deep(th) {
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.82);
  background: rgba(255, 255, 255, 0.04);
}

.cn-table :deep(td) {
  color: rgba(255, 255, 255, 0.86);
}

.cn-table :deep(.v-data-table__tr:hover td) {
  background: rgba(255, 255, 255, 0.04);
}

.cn-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cn-input {
  width: 160px;
}

.cn-input :deep(input) {
  font-weight: 800;
  letter-spacing: 0.2px;
}

.cn-readonly {
  font-weight: 800;
  letter-spacing: 0.2px;
  color: rgba(255, 255, 255, 0.86);
}

.cn-muted {
  color: rgba(255, 255, 255, 0.62);
}

.cn-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
    monospace;
  color: rgba(255, 255, 255, 0.82);
}

.cn-empty {
  padding: 28px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: rgba(255, 255, 255, 0.72);
}

.cn-empty__title {
  font-weight: 900;
  color: rgba(255, 255, 255, 0.88);
}

.cn-empty__text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.62);
  text-align: center;
  max-width: 620px;
}

.cn-footnote {
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}
</style>
