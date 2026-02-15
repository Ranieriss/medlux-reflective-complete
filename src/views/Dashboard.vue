<template>
  <div>
    <!-- Título -->
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2" color="primary">mdi-view-dashboard</v-icon>
      Dashboard
    </h1>

    <!-- Cards de resumo -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass glass-hover">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-secondary mb-1">Total de Equipamentos</p>
                <h2 class="text-h4 font-weight-bold">{{ stats.totalEquipamentos }}</h2>
              </div>
              <v-avatar size="56" color="primary" class="glow-primary">
                <v-icon size="32">mdi-devices</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass glass-hover">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-secondary mb-1">Calibrações Vencidas</p>
                <h2 class="text-h4 font-weight-bold text-error">{{ stats.calibracoesVencidas }}</h2>
              </div>
              <v-avatar size="56" color="error" class="glow-error">
                <v-icon size="32">mdi-alert-circle</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass glass-hover">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-secondary mb-1">Vínculos Ativos</p>
                <h2 class="text-h4 font-weight-bold text-success">{{ stats.vinculosAtivos }}</h2>
              </div>
              <v-avatar size="56" color="success" class="glow-success">
                <v-icon size="32">mdi-link-variant</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass glass-hover">
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <p class="text-caption text-secondary mb-1">Em Manutenção</p>
                <h2 class="text-h4 font-weight-bold text-warning">{{ stats.emManutencao }}</h2>
              </div>
              <v-avatar size="56" color="warning" class="glow-warning">
                <v-icon size="32">mdi-wrench</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Alertas e Avisos -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card class="glass">
          <v-card-title>
            <v-icon class="mr-2" color="warning">mdi-alert</v-icon>
            Alertas e Avisos
          </v-card-title>
          <v-card-text>
            <v-alert
              v-if="stats.calibracoesVencidas > 0"
              type="error"
              variant="tonal"
              class="mb-3"
            >
              <strong>{{ stats.calibracoesVencidas }}</strong> equipamento(s) com calibração vencida necessitam atenção imediata!
            </v-alert>
            <v-alert
              v-if="stats.calibracoesProximas > 0"
              type="warning"
              variant="tonal"
            >
              <strong>{{ stats.calibracoesProximas }}</strong> equipamento(s) com calibração próxima do vencimento (próximos 30 dias)
            </v-alert>
            <v-alert
              v-if="stats.calibracoesVencidas === 0 && stats.calibracoesProximas === 0"
              type="success"
              variant="tonal"
            >
              Todos os equipamentos estão com calibração em dia! 🎉
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { db } from '@/services/db'

// State
const stats = ref({
  totalEquipamentos: 0,
  calibracoesVencidas: 0,
  calibracoesProximas: 0,
  vinculosAtivos: 0,
  emManutencao: 0
})

// Carregar estatísticas
const carregarEstatisticas = async () => {
  try {
    // Total de equipamentos
    stats.value.totalEquipamentos = await db.equipamentos.count()

    // Calibrações vencidas
    const hoje = new Date().toISOString().split('T')[0]
    const equipamentos = await db.equipamentos.toArray()
    
    stats.value.calibracoesVencidas = equipamentos.filter(
      eq => eq.proxima_calibracao < hoje
    ).length

    // Calibrações próximas (próximos 30 dias)
    const em30Dias = new Date()
    em30Dias.setDate(em30Dias.getDate() + 30)
    const em30DiasStr = em30Dias.toISOString().split('T')[0]
    
    stats.value.calibracoesProximas = equipamentos.filter(
      eq => eq.proxima_calibracao >= hoje && eq.proxima_calibracao <= em30DiasStr
    ).length

    // Equipamentos em manutenção
    stats.value.emManutencao = equipamentos.filter(
      eq => eq.status === 'manutencao'
    ).length

    // Vínculos ativos (simulado)
    stats.value.vinculosAtivos = 0

  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error)
  }
}

onMounted(() => {
  carregarEstatisticas()
})
</script>

<style scoped>
.text-secondary {
  color: var(--text-secondary);
}

.glow-warning {
  box-shadow: 0 0 10px rgba(255, 220, 0, 0.5);
}
</style>
