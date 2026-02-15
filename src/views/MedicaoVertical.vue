<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-sign-pole</v-icon>
            <span>Medição Vertical - ABNT NBR 15426 + NBR 14644</span>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialogNovo = true">
              <v-icon left>mdi-plus</v-icon>
              Nova Placa
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="placas"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.tipo_pelicula="{ item }">
                <v-chip :color="getColorTipo(item.tipo_pelicula)">
                  Tipo {{ item.tipo_pelicula }}
                </v-chip>
              </template>
              <template v-slot:item.resultado_final="{ item }">
                <v-chip :color="item.resultado_final === 'conforme' ? 'success' : 'error'">
                  {{ item.resultado_final }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" @click="visualizarPlaca(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon size="small" color="error" @click="excluirPlaca(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Nova Placa -->
    <v-dialog v-model="dialogNovo" max-width="900px">
      <v-card>
        <v-card-title>Nova Medição Vertical</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.codigo_placa"
                  label="Código da Placa *"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.rodovia"
                  label="Rodovia *"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="formData.tipo_pelicula"
                  :items="['I', 'II', 'III', 'VII', 'VIII', 'IX', 'X']"
                  label="Tipo de Película *"
                  required
                ></v-select>
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="formData.modo_medicao"
                  :items="[
                    { title: 'Ângulo Único', value: 'angulo-unico' },
                    { title: 'Multi-Ângulo', value: 'multi-angulo' }
                  ]"
                  label="Modo de Medição *"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNovo = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarPlaca">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import medicaoVerticalService from '@/services/medicaoVerticalService'

const loading = ref(false)
const dialogNovo = ref(false)
const placas = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Código', value: 'codigo_placa' },
  { title: 'Rodovia', value: 'rodovia' },
  { title: 'KM', value: 'km' },
  { title: 'Tipo Película', value: 'tipo_pelicula' },
  { title: 'Data Medição', value: 'data_medicao' },
  { title: 'Resultado', value: 'resultado_final' },
  { title: 'Ações', value: 'actions', sortable: false }
]

const formData = ref({
  codigo_placa: '',
  rodovia: '',
  km: null,
  tipo_pelicula: '',
  modo_medicao: 'angulo-unico',
  cores: [],
  data_medicao: new Date().toISOString().split('T')[0]
})

function getColorTipo(tipo) {
  const colors = { I: 'blue', II: 'green', III: 'orange', VII: 'purple' }
  return colors[tipo] || 'grey'
}

async function carregarPlacas() {
  loading.value = true
  try {
    const response = await medicaoVerticalService.listarPlacas()
    if (response.success) {
      placas.value = response.data
    }
  } catch (error) {
    mostrarNotificacao('Erro ao carregar placas', 'error')
  } finally {
    loading.value = false
  }
}

async function salvarPlaca() {
  try {
    const response = await medicaoVerticalService.criarPlaca(formData.value)
    if (response.success) {
      mostrarNotificacao('Placa criada com sucesso!', 'success')
      dialogNovo.value = false
      carregarPlacas()
    }
  } catch (error) {
    mostrarNotificacao('Erro ao salvar placa', 'error')
  }
}

function mostrarNotificacao(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  carregarPlacas()
})
</script>
