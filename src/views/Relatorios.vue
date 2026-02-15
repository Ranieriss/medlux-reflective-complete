<template>
  <div>
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2" color="primary">mdi-file-chart</v-icon>
      Relatórios
    </h1>

    <v-row>
      <v-col cols="12" md="6" lg="4" v-for="relatorio in relatorios" :key="relatorio.id">
        <v-card class="glass" hover @click="gerarRelatorio(relatorio)">
          <v-card-text>
            <div class="d-flex align-center mb-4">
              <v-icon :color="relatorio.cor" size="48" class="mr-4">{{ relatorio.icone }}</v-icon>
              <div>
                <div class="text-h6 font-weight-bold">{{ relatorio.titulo }}</div>
                <div class="text-caption">{{ relatorio.descricao }}</div>
              </div>
            </div>
            <v-chip :color="relatorio.cor" size="small" variant="outlined">
              {{ relatorio.formato }}
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogConfigurar" max-width="600px">
      <v-card v-if="relatorioSelecionado" class="glass">
        <v-card-title>Configurar Relatório</v-card-title>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field v-model="config.dataInicio" label="Data Início" type="date" />
            <v-text-field v-model="config.dataFim" label="Data Fim" type="date" />
            <v-select v-model="config.formato" :items="['PDF', 'Excel', 'CSV']" label="Formato" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="dialogConfigurar = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="gerando" @click="confirmarGeracao">Gerar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import supabase from '@/services/supabase'

const dialogConfigurar = ref(false)
const relatorioSelecionado = ref(null)
const gerando = ref(false)
const formRef = ref(null)

const config = ref({
  dataInicio: '',
  dataFim: '',
  formato: 'PDF'
})

const snackbar = ref({ show: false, message: '', color: 'success' })

const relatorios = [
  {
    id: 1,
    titulo: 'Equipamentos',
    descricao: 'Listagem completa de equipamentos',
    icone: 'mdi-devices',
    cor: 'primary',
    formato: 'PDF / Excel'
  },
  {
    id: 2,
    titulo: 'Calibrações',
    descricao: 'Histórico de calibrações',
    icone: 'mdi-calendar-check',
    cor: 'success',
    formato: 'PDF / Excel'
  },
  {
    id: 3,
    titulo: 'Vínculos',
    descricao: 'Relatório de custódia',
    icone: 'mdi-link-variant',
    cor: 'warning',
    formato: 'PDF / Excel'
  },
  {
    id: 4,
    titulo: 'Auditoria',
    descricao: 'Log de ações do sistema',
    icone: 'mdi-history',
    cor: 'info',
    formato: 'PDF / CSV'
  },
  {
    id: 5,
    titulo: 'Estatísticas',
    descricao: 'Dashboard em PDF',
    icone: 'mdi-chart-bar',
    cor: 'secondary',
    formato: 'PDF'
  },
  {
    id: 6,
    titulo: 'Personalizado',
    descricao: 'Criar relatório customizado',
    icone: 'mdi-cog',
    cor: 'grey',
    formato: 'Configurável'
  }
]

const gerarRelatorio = (relatorio) => {
  relatorioSelecionado.value = relatorio
  config.value = {
    dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dataFim: new Date().toISOString().split('T')[0],
    formato: 'PDF'
  }
  dialogConfigurar.value = true
}

const confirmarGeracao = async () => {
  gerando.value = true
  try {
    // Aqui você implementaria a lógica real de geração
    // Por enquanto, vou simular com dados do Supabase
    
    let dados = []
    
    switch(relatorioSelecionado.value.id) {
      case 1: // Equipamentos
        const { data: equipamentos } = await supabase.from('equipamentos').select('*')
        dados = equipamentos
        break
      case 2: // Calibrações
        snackbar.value = { show: true, message: 'Módulo de calibrações em desenvolvimento', color: 'info' }
        break
      case 3: // Vínculos
        const { data: vinculos } = await supabase.from('vinculos').select('*')
        dados = vinculos
        break
      case 4: // Auditoria
        const { data: auditoria } = await supabase.from('auditoria').select('*').limit(100)
        dados = auditoria
        break
      default:
        snackbar.value = { show: true, message: 'Relatório em desenvolvimento', color: 'info' }
    }
    
    if (dados.length > 0) {
      // Simular download
      const json = JSON.stringify(dados, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${relatorioSelecionado.value.titulo.toLowerCase()}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      
      snackbar.value = { show: true, message: 'Relatório gerado com sucesso!', color: 'success' }
    }
    
    dialogConfigurar.value = false
  } catch (error) {
    snackbar.value = { show: true, message: `Erro: ${error.message}`, color: 'error' }
  } finally {
    gerando.value = false
  }
}
</script>

<style scoped>
.glass {
  background: rgba(21, 25, 51, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
  transition: all 0.3s;
}
.glass:hover {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}
</style>
