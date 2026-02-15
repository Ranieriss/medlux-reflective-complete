<template>
  <div>
    <!-- Header -->
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
      Sistema
    </h1>

    <!-- Informações do Sistema -->
    <v-row>
      <!-- Info Card -->
      <v-col cols="12" md="6">
        <v-card class="glass">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information</v-icon>
            Informações do Sistema
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-cube-outline</v-icon>
                </template>
                <v-list-item-title>Versão</v-list-item-title>
                <v-list-item-subtitle>{{ versaoSistema }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-database</v-icon>
                </template>
                <v-list-item-title>Banco de Dados</v-list-item-title>
                <v-list-item-subtitle>Supabase PostgreSQL</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-server</v-icon>
                </template>
                <v-list-item-title>API</v-list-item-title>
                <v-list-item-subtitle>{{ apiUrl }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon>mdi-calendar</v-icon>
                </template>
                <v-list-item-title>Data Atual</v-list-item-title>
                <v-list-item-subtitle>{{ dataAtual }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Estatísticas -->
      <v-col cols="12" md="6">
        <v-card class="glass">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-bar</v-icon>
            Estatísticas
            <v-spacer />
            <v-btn
              icon="mdi-refresh"
              size="small"
              variant="text"
              @click="carregarEstatisticas"
              :loading="carregandoStats"
            />
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-devices</v-icon>
                </template>
                <v-list-item-title>Equipamentos</v-list-item-title>
                <v-list-item-subtitle>{{ stats.equipamentos }} registros</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="secondary">mdi-account-group</v-icon>
                </template>
                <v-list-item-title>Usuários</v-list-item-title>
                <v-list-item-subtitle>{{ stats.usuarios }} registros</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-link-variant</v-icon>
                </template>
                <v-list-item-title>Vínculos</v-list-item-title>
                <v-list-item-subtitle>{{ stats.vinculos }} registros</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="warning">mdi-history</v-icon>
                </template>
                <v-list-item-title>Logs de Auditoria</v-list-item-title>
                <v-list-item-subtitle>{{ stats.auditoria }} registros</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Backup e Restauração -->
      <v-col cols="12">
        <v-card class="glass">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-database-arrow-up</v-icon>
            Backup e Restauração
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title>Exportar Dados</v-card-title>
                  <v-card-text>
                    <p class="text-body-2 mb-4">
                      Faça o backup completo dos dados do sistema em formato JSON.
                    </p>
                    <v-btn
                      color="primary"
                      block
                      prepend-icon="mdi-download"
                      @click="exportarBackup"
                      :loading="exportando"
                    >
                      Exportar Backup Completo
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <v-card variant="outlined">
                  <v-card-title>Importar Dados</v-card-title>
                  <v-card-text>
                    <p class="text-body-2 mb-4">
                      Restaure dados a partir de um arquivo de backup JSON.
                    </p>
                    <v-file-input
                      v-model="arquivoBackup"
                      label="Selecionar arquivo"
                      accept=".json,.txt"
                      variant="outlined"
                      density="compact"
                      prepend-icon="mdi-file"
                      show-size
                      class="mb-2"
                    />
                    <v-btn
                      color="warning"
                      block
                      prepend-icon="mdi-upload"
                      @click="importarBackup"
                      :loading="importando"
                      :disabled="!arquivoBackup"
                    >
                      Importar Backup
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Manutenção -->
      <v-col cols="12">
        <v-card class="glass">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-wrench</v-icon>
            Manutenção
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="info" class="mb-3">mdi-sync</v-icon>
                    <div class="text-h6 mb-2">Sincronização</div>
                    <div class="text-caption text-secondary mb-4">
                      Status: <strong :class="conexaoOk ? 'text-success' : 'text-error'">
                        {{ conexaoOk ? 'Online' : 'Offline' }}
                      </strong>
                    </div>
                    <v-btn
                      color="info"
                      size="small"
                      block
                      @click="testarConexao"
                      :loading="testando"
                    >
                      Testar Conexão
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="warning" class="mb-3">mdi-cached</v-icon>
                    <div class="text-h6 mb-2">Cache Local</div>
                    <div class="text-caption text-secondary mb-4">
                      Limpar dados temporários
                    </div>
                    <v-btn
                      color="warning"
                      size="small"
                      block
                      @click="limparCache"
                      :loading="limpandoCache"
                    >
                      Limpar Cache
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="error" class="mb-3">mdi-alert-octagon</v-icon>
                    <div class="text-h6 mb-2">Logs de Erro</div>
                    <div class="text-caption text-secondary mb-4">
                      Ver erros do sistema
                    </div>
                    <v-btn
                      color="error"
                      size="small"
                      block
                      @click="verLogsErro"
                    >
                      Ver Logs
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Sobre -->
      <v-col cols="12">
        <v-card class="glass">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Sobre
          </v-card-title>
          <v-divider />
          <v-card-text>
            <div class="text-center py-6">
              <v-icon size="96" color="primary" class="mb-4">mdi-factory</v-icon>
              <h2 class="text-h4 font-weight-bold mb-2">MEDLUX Reflective</h2>
              <p class="text-h6 text-secondary mb-4">Sistema de Gestão de Equipamentos</p>
              <p class="text-body-2 mb-4">
                Desenvolvido com Vue 3, Vuetify 3 e Supabase<br>
                Sistema completo para gestão de equipamentos de medição com controle de calibração,
                vínculos de custódia e auditoria integrada.
              </p>
              <v-chip color="primary" class="mr-2">Vue 3</v-chip>
              <v-chip color="secondary" class="mr-2">Vuetify 3</v-chip>
              <v-chip color="success" class="mr-2">Supabase</v-chip>
              <v-chip color="info">PostgreSQL</v-chip>
              <div class="mt-6 text-caption text-secondary">
                © {{ new Date().getFullYear() }} MEDLUX Reflective. Todos os direitos reservados.
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Logs de Erro -->
    <v-dialog v-model="dialogLogs" max-width="900" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center py-4">
          <v-icon class="mr-2" color="error">mdi-alert-octagon</v-icon>
          Logs de Erro
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" @click="dialogLogs = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-4">
            Últimos 50 erros registrados no sistema
          </v-alert>

          <div v-if="logs.length === 0" class="text-center py-8">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
            <p class="text-h6">Nenhum erro registrado</p>
            <p class="text-secondary">Sistema funcionando perfeitamente!</p>
          </div>

          <v-timeline v-else side="end" density="compact" truncate-line="both">
            <v-timeline-item
              v-for="(log, index) in logs"
              :key="index"
              dot-color="error"
              icon="mdi-alert"
              size="small"
            >
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-caption text-secondary mb-1">
                    {{ formatarDataHora(log.timestamp) }}
                  </div>
                  <div class="text-body-2 font-weight-bold mb-1">{{ log.message }}</div>
                  <div v-if="log.stack" class="text-caption">
                    <pre class="log-stack">{{ log.stack }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
      location="top"
    >
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/services/supabase'

// State
const versaoSistema = '2.0.0'
const apiUrl = import.meta.env.VITE_SUPABASE_URL || 'N/A'
const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
const conexaoOk = ref(true)
const carregandoStats = ref(false)
const exportando = ref(false)
const importando = ref(false)
const testando = ref(false)
const limpandoCache = ref(false)
const arquivoBackup = ref(null)
const dialogLogs = ref(false)
const logs = ref([])

// Stats
const stats = ref({
  equipamentos: 0,
  usuarios: 0,
  vinculos: 0,
  auditoria: 0
})

// Snackbar
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Methods
const carregarEstatisticas = async () => {
  try {
    carregandoStats.value = true

    const [equipamentos, usuarios, vinculos, auditoria] = await Promise.all([
      supabase.from('equipamentos').select('*', { count: 'exact', head: true }),
      supabase.from('usuarios').select('*', { count: 'exact', head: true }),
      supabase.from('vinculos').select('*', { count: 'exact', head: true }),
      supabase.from('auditoria').select('*', { count: 'exact', head: true })
    ])

    stats.value = {
      equipamentos: equipamentos.count || 0,
      usuarios: usuarios.count || 0,
      vinculos: vinculos.count || 0,
      auditoria: auditoria.count || 0
    }

    console.log('✅ Estatísticas carregadas:', stats.value)
  } catch (error) {
    console.error('❌ Erro ao carregar estatísticas:', error)
  } finally {
    carregandoStats.value = false
  }
}

const exportarBackup = async () => {
  try {
    exportando.value = true
    mostrarSnackbar('Exportando dados...', 'info')

    // Buscar todos os dados
    const [equipamentos, usuarios, vinculos, auditoria] = await Promise.all([
      supabase.from('equipamentos').select('*').order('codigo'),
      supabase.from('usuarios').select('*').order('nome'),
      supabase.from('vinculos').select('*').order('created_at'),
      supabase.from('auditoria').select('*').order('created_at').limit(1000)
    ])

    const backup = {
      version: versaoSistema,
      timestamp: new Date().toISOString(),
      data: {
        equipamentos: equipamentos.data || [],
        usuarios: usuarios.data || [],
        vinculos: vinculos.data || [],
        auditoria: auditoria.data || []
      },
      stats: {
        equipamentos: equipamentos.data?.length || 0,
        usuarios: usuarios.data?.length || 0,
        vinculos: vinculos.data?.length || 0,
        auditoria: auditoria.data?.length || 0
      }
    }

    // Download
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `medlux-backup-${format(new Date(), 'yyyy-MM-dd_HHmmss')}.json`
    link.click()
    URL.revokeObjectURL(url)

    mostrarSnackbar('Backup exportado com sucesso!', 'success')
  } catch (error) {
    console.error('❌ Erro ao exportar backup:', error)
    mostrarSnackbar('Erro ao exportar backup', 'error')
  } finally {
    exportando.value = false
  }
}

const importarBackup = async () => {
  if (!arquivoBackup.value) return

  try {
    importando.value = true
    mostrarSnackbar('Importando dados...', 'info')

    const file = arquivoBackup.value[0] || arquivoBackup.value
    const text = await file.text()
    const backup = JSON.parse(text)

    if (!backup.data) {
      throw new Error('Arquivo de backup inválido')
    }

    let imported = 0

    // Importar equipamentos
    if (backup.data.equipamentos?.length > 0) {
      for (const eq of backup.data.equipamentos) {
        const { error } = await supabase
          .from('equipamentos')
          .upsert(eq, { onConflict: 'codigo' })
        if (!error) imported++
      }
    }

    // Importar vínculos (se houver)
    if (backup.data.vinculos?.length > 0) {
      for (const vinculo of backup.data.vinculos) {
        await supabase
          .from('vinculos')
          .upsert(vinculo)
      }
    }

    mostrarSnackbar(`Backup importado com sucesso! ${imported} equipamentos restaurados.`, 'success')
    await carregarEstatisticas()
    arquivoBackup.value = null
  } catch (error) {
    console.error('❌ Erro ao importar backup:', error)
    mostrarSnackbar('Erro ao importar backup: ' + error.message, 'error')
  } finally {
    importando.value = false
  }
}

const testarConexao = async () => {
  try {
    testando.value = true
    const { error } = await supabase.from('equipamentos').select('*', { count: 'exact', head: true })
    
    if (error) throw error

    conexaoOk.value = true
    mostrarSnackbar('Conexão OK! Sistema online.', 'success')
  } catch (error) {
    console.error('❌ Erro de conexão:', error)
    conexaoOk.value = false
    mostrarSnackbar('Erro de conexão com o servidor', 'error')
  } finally {
    testando.value = false
  }
}

const limparCache = async () => {
  try {
    limpandoCache.value = true
    
    // Limpar localStorage (exceto token de autenticação)
    const authData = localStorage.getItem('medlux-user')
    localStorage.clear()
    if (authData) {
      localStorage.setItem('medlux-user', authData)
    }

    // Limpar sessionStorage
    sessionStorage.clear()

    mostrarSnackbar('Cache limpo com sucesso!', 'success')
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error)
    mostrarSnackbar('Erro ao limpar cache', 'error')
  } finally {
    limpandoCache.value = false
  }
}

const verLogsErro = () => {
  // Simular logs (em produção, buscar do servidor ou logs_erro table)
  logs.value = []
  dialogLogs.value = true
}

const formatarDataHora = (data) => {
  if (!data) return '-'
  try {
    return format(new Date(data), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })
  } catch {
    return data
  }
}

const mostrarSnackbar = (message, color = 'success') => {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

// Lifecycle
onMounted(async () => {
  await carregarEstatisticas()
  await testarConexao()
})
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
}

.log-stack {
  background: rgba(0, 0, 0, 0.3);
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 11px;
  max-height: 200px;
}
</style>
