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
                      @update:modelValue="analisarBackupSelecionado"
                      label="Selecionar arquivo"
                      accept=".json,.txt"
                      variant="outlined"
                      density="compact"
                      prepend-icon="mdi-file"
                      show-size
                      class="mb-2"
                    />
                    <v-alert
                      v-if="previewImportacao"
                      type="info"
                      variant="tonal"
                      density="compact"
                      class="mb-3"
                    >
                      Preview: equipamentos={{ previewImportacao.equipamentos }}, usuarios={{ previewImportacao.usuarios }},
                      vinculos={{ previewImportacao.vinculos }}, auditoria={{ previewImportacao.auditoria }},
                      ignoradas={{ previewImportacao.ignoradas || 0 }}
<div v-if="previewImportacao.entidadesDetectadas?.length" class="mt-2">
  Entidades detectadas: {{ previewImportacao.entidadesDetectadas.join(', ') }}
</div>

<div v-if="previewImportacao.warnings?.length" class="mt-2">
  <strong>Warnings:</strong>
  <ul class="pl-4">
    <li
      v-for="(warning, index) in previewImportacao.warnings.slice(0, 5)"
      :key="index"
    >
      {{ warning }}
    </li>
  </ul>
</div>

<ul v-if="previewImportacao.logs?.length" class="mt-2 pl-4">
  <li v-for="(logItem, idx) in previewImportacao.logs.slice(0, 5)" :key="idx">
    {{ logItem }}
  </li>
</ul>

                    </v-alert>
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
                Sistema completo para gestão de equipamentos de medição com controle de calibração,
                vínculos de custódia e auditoria integrada. Conforme ISO 9001:2015 e ABNT NBR 14723.
              </p>
              <v-chip color="primary" class="mr-2 mb-2">Vue 3</v-chip>
              <v-chip color="secondary" class="mr-2 mb-2">Vuetify 3</v-chip>
              <v-chip color="success" class="mr-2 mb-2">Supabase</v-chip>
              <v-chip color="info" class="mb-2">PostgreSQL</v-chip>

              <v-divider class="my-6" />

              <div class="mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Desenvolvido por:</h3>
                
                <v-card class="mx-auto mb-4" max-width="600" variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-icon color="primary" class="mr-2">mdi-account-tie</v-icon>
                      <span class="text-h6 font-weight-bold">Paulo Ranieri dos Santos</span>
                    </div>
                    <div class="text-body-2 text-left">
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-school</v-icon>Engenheiro Químico</div>
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-cog</v-icon>Técnico em Automação Industrial</div>
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-code-braces</v-icon>Desenvolvedor de Aplicativos</div>
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-whatsapp</v-icon>WhatsApp: +55 (48) 99608-3062</div>
                      <div><v-icon size="small" class="mr-2">mdi-email</v-icon>Email: ranieri.santos16@gmail.com</div>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card class="mx-auto" max-width="600" variant="outlined">
                  <v-card-text>
                    <div class="d-flex align-center mb-2">
                      <v-icon color="success" class="mr-2">mdi-factory</v-icon>
                      <span class="text-h6 font-weight-bold">I.C.D. Indústria</span>
                    </div>
                    <div class="text-body-2 text-left">
                      <div class="mb-1"><strong>Razão Social:</strong> I.C.D. Indústria, Comércio e Distribuição de Materiais para Infraestrutura Viária Ltda.</div>
                      <div class="mb-1"><strong>CNPJ:</strong> 10.954.989/0001-26</div>
                      <div class="mb-1"><strong>Endereço:</strong> Rua Juliano Lucchi, 118 – Jardim Eldorado - Palhoça - SC</div>
                      <div class="mb-1"><strong>CEP:</strong> 88.133-540</div>
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-phone</v-icon>Telefone: (48) 2106-3022</div>
                      <div class="mb-1"><v-icon size="small" class="mr-2">mdi-web</v-icon>Site: www.icdvias.com.br</div>
                      <div><strong>Slogan:</strong> "TECNOLOGIA EM MATERIAIS A SERVIÇO DA VIDA!"</div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>

              <div class="mt-6 text-caption text-secondary">
                © {{ new Date().getFullYear() }} MEDLUX Reflective. Todos os direitos reservados.<br>
                Desenvolvido com ❤️ por Paulo Ranieri dos Santos e I.C.D. Indústria
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
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-file-download"
            class="mr-2"
            @click="gerarDiagnosticoCompleto"
          >
            Diagnóstico Completo
          </v-btn>
          <v-btn icon="mdi-close" variant="text" @click="dialogLogs = false" />
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-6">
          <v-alert type="info" variant="tonal" class="mb-4">
            Últimos 50 erros registrados no sistema
          </v-alert>

          <div class="d-flex flex-wrap ga-2 mb-4">
            <v-btn
              color="primary"
              prepend-icon="mdi-stethoscope"
              :loading="gerandoDiagnostico"
              @click="gerarDiagnosticoCompleto"
            >
              Diagnóstico Completo
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-content-copy"
              :disabled="!diagnosticoJson"
              @click="copiarDiagnostico"
            >
              Copiar JSON
            </v-btn>
            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              :disabled="!diagnosticoJson"
              @click="baixarDiagnostico"
            >
              Baixar JSON
            </v-btn>
          </div>

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
                  <div v-if="log.route || log.component" class="text-caption mb-1">
                    <strong>Rota:</strong> {{ log.route || '-' }} · <strong>Componente:</strong> {{ log.component || '-' }}
                  </div>
                  <div v-if="log.error?.stack || log.stack" class="text-caption">
                    <pre class="log-stack">{{ log.error?.stack || log.stack }}</pre>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>

          <v-textarea
            v-if="diagnosticoJson"
            v-model="diagnosticoJson"
            rows="10"
            readonly
            auto-grow
            variant="outlined"
            label="Diagnóstico completo (JSON)"
            class="mt-4"
          />
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
import { useAuthStore } from '@/stores/auth'
import { useDiagnosticsStore } from '@/stores/diagnostics'
import { generateDiagnosticDump } from '@/debug'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase } from '@/services/supabase'
import { supabaseUrl } from '@/config/env'
import { useDiagnosticsStore } from '@/stores/diagnostics'
import { exportDiagnosticsPayload } from '@/services/diagnosticsReportService'
import { useRoute } from 'vue-router'

// State
const versaoSistema = '2.0.0'
const apiUrl = supabaseUrl || 'N/A'
const dataAtual = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
const conexaoOk = ref(true)
const carregandoStats = ref(false)
const exportando = ref(false)
const importando = ref(false)
const testando = ref(false)
const limpandoCache = ref(false)
const arquivoBackup = ref(null)
const previewImportacao = ref(null)
const dialogLogs = ref(false)
const logs = ref([])
const gerandoDiagnostico = ref(false)
const diagnosticoJson = ref('')
const authStore = useAuthStore()
const diagnosticsStore = useDiagnosticsStore()


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

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''))
const gerarUuid = () => crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`

const tabelasSuportadas = ['equipamentos', 'usuarios', 'vinculos', 'auditoria']
const conflitosPorTabela = {
  equipamentos: 'codigo',
  usuarios: 'email',
  vinculos: 'id',
  auditoria: 'id'
}

const normalizarDataISO = (valor, somenteData = false) => {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  if (somenteData) return data.toISOString().slice(0, 10)
  return data.toISOString()
}

const normalizarString = (valor) => {
  if (valor === null || valor === undefined) return valor
  return String(valor).trim()
}

const normalizarArrayRegistros = (registros) => {
  if (!Array.isArray(registros)) return []
  return registros
}

// Extrai os dados do backup de forma tolerante:
// - formato novo: { data: { tabela: [...] } }
// - formato medlux-control: { tabela: [...] } na raiz
// - formato genérico: qualquer chave com array vira entidade detectada
const extrairDadosBackup = (backup) => {
  if (!backup || typeof backup !== 'object') {
    throw new Error('Arquivo de backup inválido')
  }

  const origem = (backup.data && typeof backup.data === 'object')
    ? backup.data
    : backup

  if (!origem || typeof origem !== 'object') {
    throw new Error('Arquivo de backup inválido')
  }

  // 1) Preferência: tabelasSuportadas (compatibilidade com medlux-control)
  const root = {}
  if (typeof tabelasSuportadas !== 'undefined' && Array.isArray(tabelasSuportadas)) {
    for (const tabela of tabelasSuportadas) {
      if (Array.isArray(origem[tabela])) {
        root[tabela] = origem[tabela]
      }
    }
    if (Object.keys(root).length > 0) return root
  }

  // 2) Fallback: detectar qualquer entidade que seja array
  const entidades = {}
  for (const [chave, valor] of Object.entries(origem)) {
    if (Array.isArray(valor)) {
      entidades[chave] = normalizarArrayRegistros(valor)
    }
  }

  if (Object.keys(entidades).length > 0) {
    return entidades
  }

  throw new Error('Backup sem estrutura compatível')
}

const mapearRegistro = (registro = {}, tabela, idMap = new Map(), warnings = []) => {

  const base = { ...registro }

  for (const [chave, valor] of Object.entries(base)) {
    if (typeof valor === 'string') {
      base[chave] = normalizarString(valor)
    }
  }

  if (tabela === 'equipamentos') {
    if (!base.fabricante && base.marca) {
      base.fabricante = String(base.marca)
      warnings.push(`equipamentos: marca mapeada para fabricante (${base.codigo || 'sem-codigo'})`)
    }

    if (!base.certificado_url) {
      base.certificado_url = base.certificado_calibracao || base.certificadoCalibracaoUrl || null
    }

    if (!base.foto_url) {
      base.foto_url = base.termo_pdf_url || base.cautela_url || null
    }
if (!base.certificado_url && base.certificado_calibracao) {
  base.certificado_url = base.certificado_calibracao
}

if (!base.nome && (base.modelo || base.codigo)) {
  base.nome = String(base.modelo || base.codigo)
}

if (base.codigo) {
  base.codigo = String(base.codigo).trim().toUpperCase()
}

if (base.data_aquisicao) base.data_aquisicao = normalizarDataISO(base.data_aquisicao, true)
if (base.ultima_calibracao) base.ultima_calibracao = normalizarDataISO(base.ultima_calibracao, true)
if (base.proxima_calibracao) base.proxima_calibracao = normalizarDataISO(base.proxima_calibracao, true)

  }

  if (tabela === 'usuarios') {
    if (base.email) {
      base.email = String(base.email).trim().toLowerCase()
    }
  }

  if (base.created_at) base.created_at = normalizarDataISO(base.created_at)
  if (base.updated_at) base.updated_at = normalizarDataISO(base.updated_at)

  if (base.id && !isUuid(base.id)) {
    const idOriginal = base.id
    base.id = gerarUuid()
    idMap.set(String(idOriginal), base.id)
  }

  return base
}

const deduplicarPor = (lista, keyFn, logs = []) => {
  const seen = new Map()
  for (const item of lista) {
    const key = keyFn(item)
    if (!key) continue

    const k = String(key)
    if (seen.has(k)) {
      logs.push(`Registro duplicado ignorado (${k})`)
      continue
    }
    seen.set(k, item)
  }
  return Array.from(seen.values())
}

// Mantém comportamento "inteligente" por tabela (usuarios/email, equipamentos/codigo)
const deduplicarRegistros = (tabela, registros, logs = []) => {
  if (!Array.isArray(registros) || registros.length === 0) return []

  if (tabela === 'usuarios') {
    return deduplicarPor(
      registros,
      (r) => r?.email ? String(r.email).trim().toLowerCase() : null,
      logs
    )
  }

  if (tabela === 'equipamentos') {
    return deduplicarPor(
      registros,
      (r) => r?.codigo ? String(r.codigo).trim().toUpperCase() : null,
      logs
    )
  }

  // fallback
  return deduplicarPor(
    registros,
    (r) => r?.id ? String(r.id) : null,
    logs
  )
}

const normalizarBackup = (backup) => {
  const origem = extrairDadosBackup(backup)

  const entidades = origem // compatibilidade com o restante do código
  const data = { equipamentos: [], usuarios: [], vinculos: [], auditoria: [] }
  const logs = []
  const warnings = []
  const idMap = new Map()

  const tabelasEncontradas = Object.keys(origem ?? entidades ?? {})
  const tabelasIgnoradas = tabelasEncontradas.filter((tabela) => !tabelasSuportadas.includes(tabela))

  for (const tabela of tabelasIgnoradas) {
    logs.push(`Entidade não suportada ignorada: ${tabela}`)
  }

  for (const tabela of tabelasSuportadas) {
    const fonte = origem ?? entidades ?? {}
    const registrosBrutos = Array.isArray(fonte[tabela]) ? fonte[tabela] : []
    const registros = normalizarArrayRegistros
      ? normalizarArrayRegistros(registrosBrutos)
      : registrosBrutos

    const mapeados = registros.map((registro) =>
      mapearRegistro(registro, tabela, idMap, warnings)
    )

    data[tabela] = typeof deduplicarRegistros === 'function'
      ? deduplicarRegistros(tabela, mapeados, logs)
      : mapeados
  }

  data.equipamentos = deduplicarPor(
    data.equipamentos,
    item => item.codigo?.toString().trim().toUpperCase(),
    logs
  )

  data.usuarios = deduplicarPor(
    data.usuarios,
    item => item.email?.toString().trim().toLowerCase(),
    logs
  )

  // Ajustar relações com UUID regenerado
  data.vinculos = data.vinculos.map((item) => {
    const vinculo = { ...item }
    if (vinculo.usuario_id && idMap.has(String(vinculo.usuario_id))) {
      vinculo.usuario_id = idMap.get(String(vinculo.usuario_id))
    }
    if (vinculo.equipamento_id && idMap.has(String(vinculo.equipamento_id))) {
      vinculo.equipamento_id = idMap.get(String(vinculo.equipamento_id))
    }
    return vinculo
  })

  return { data, logs, warnings, tabelasIgnoradas, tabelasEncontradas }
}

const analisarBackupSelecionado = async () => {
  try {
    if (!arquivoBackup.value) {
      previewImportacao.value = null
      return
    }

    const file = arquivoBackup.value[0] || arquivoBackup.value
    const text = await file.text()
    const backup = JSON.parse(text)
    const normalizado = normalizarBackup(backup)

    previewImportacao.value = {
      equipamentos: normalizado.data.equipamentos.length,
      usuarios: normalizado.data.usuarios.length,
      vinculos: normalizado.data.vinculos.length,
      auditoria: normalizado.data.auditoria.length,
      ignoradas: normalizado.tabelasIgnoradas.length,
      entidadesDetectadas: normalizado.tabelasEncontradas,
      logs: normalizado.logs,
      warnings: normalizado.warnings

    }
  } catch (error) {
    previewImportacao.value = null
    mostrarSnackbar('Não foi possível gerar preview do backup: ' + error.message, 'warning')
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
    const normalizado = normalizarBackup(backup)
    const data = normalizado.data

    const resultados = { equipamentos: 0, usuarios: 0, vinculos: 0, auditoria: 0 }
    const ignorados = { equipamentos: 0, usuarios: 0, vinculos: 0, auditoria: 0 }
    const logsImportacao = [...(normalizado.logs || []), ...(normalizado.warnings || [])]


    for (const tabela of tabelasSuportadas) {
      const registros = data[tabela] || []
      if (!registros.length) {
logsImportacao.push(`Tabela sem registros para importar: ${tabela}`)

        continue
      }

      const conflito = conflitosPorTabela[tabela]
      const payload = tabela === 'auditoria' ? registros.slice(0, 5000) : registros

      const { data: upsertData, error } = await supabase
        .from(tabela)
        .upsert(payload, { onConflict: conflito, ignoreDuplicates: false })
        .select('id')


      if (error) {
        logsImportacao.push(`Falha em ${tabela}: ${error.message}`)
        continue
      }

      resultados[tabela] += upsertData?.length || 0
      ignorados[tabela] += Math.max(payload.length - (upsertData?.length || 0), 0)
      logsImportacao.push(`Processados ${payload.length} registro(s) em ${tabela}`)

    }

    if (logsImportacao.length) {
      console.warn('⚠️ Importação com observações:', logsImportacao)
    }
    console.info('📦 Log detalhado da importação:', logsImportacao)

    mostrarSnackbar(
      `Importação concluída. Importados: equipamentos=${resultados.equipamentos}, usuários=${resultados.usuarios}, vínculos=${resultados.vinculos}, auditoria=${resultados.auditoria}. Ignorados: equipamentos=${ignorados.equipamentos}, usuários=${ignorados.usuarios}, vínculos=${ignorados.vinculos}, auditoria=${ignorados.auditoria}.`,
      'success'
    )
    await carregarEstatisticas()
    arquivoBackup.value = null
    previewImportacao.value = null
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

const salvarJsonDiagnostico = (json) => {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `medlux-diagnostico-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const copiarDiagnostico = async (json) => {
  if (!navigator?.clipboard?.writeText) {
    return { copied: false, reason: 'Clipboard indisponível' }
  }

  try {
    await navigator.clipboard.writeText(json)
    return { copied: true }
  } catch (error) {
    return { copied: false, reason: error?.message || 'Falha ao copiar diagnóstico' }
  }
}

const gerarDiagnosticoCompleto = async () => {
  try {
    const { json } = await exportDiagnosticsPayload({
      diagnosticsStore,
      route: route.fullPath,
      logToConsole: true
    })

    salvarJsonDiagnostico(json)
    const copied = await copiarDiagnostico(json)
    mostrarSnackbar(
      copied.copied
        ? 'Diagnóstico completo baixado e copiado para a área de transferência.'
        : `Diagnóstico completo baixado (${copied.reason}).`,
      copied.copied ? 'success' : 'warning'
    )
  } catch (error) {
    diagnosticsStore.pushEvent({
      type: 'diagnostic-error',
      message: error?.message || 'Falha ao gerar diagnóstico completo',
      route: route.fullPath,
      error
    })
    mostrarSnackbar('Falha ao gerar diagnóstico completo.', 'error')
  }
}

const verLogsErro = () => {
logs.value = diagnosticsStore?.events?.slice(0, 50) || []

  dialogLogs.value = true
}

const baixarDiagnostico = () => {
  if (!diagnosticoJson.value) return
  const stamp = format(new Date(), 'yyyyMMdd_HHmmss')
  const blob = new Blob([diagnosticoJson.value], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `medlux-diagnostico-completo-${stamp}.json`
  link.click()
  URL.revokeObjectURL(url)
}

const copiarDiagnostico = async () => {
  if (!diagnosticoJson.value) return
  try {
    await navigator.clipboard.writeText(diagnosticoJson.value)
    mostrarSnackbar('Diagnóstico copiado para a área de transferência.', 'success')
  } catch (error) {
    mostrarSnackbar('Não foi possível copiar o diagnóstico.', 'warning')
  }
}

const gerarDiagnosticoCompleto = async () => {
  try {
    gerandoDiagnostico.value = true

    const dump = window.__medlux_debug_dump
      ? await window.__medlux_debug_dump()
      : await generateDiagnosticDump({ authStore, diagnosticsStore })

    diagnosticoJson.value = JSON.stringify(dump, null, 2)
    baixarDiagnostico()
    await copiarDiagnostico()
    mostrarSnackbar('Diagnóstico completo gerado com sucesso.', 'success')
  } catch (error) {
    console.error('❌ Erro ao gerar diagnóstico completo:', error)
    mostrarSnackbar('Falha ao gerar diagnóstico completo.', 'error')
  } finally {
    gerandoDiagnostico.value = false
  }
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
