<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-road</v-icon>
            <span>Medição Horizontal - ABNT NBR 14723:2020</span>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialogNovo = true">
              <v-icon left>mdi-plus</v-icon>
              Nova Medição
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="trechos"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" @click="visualizarTrecho(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon size="small" color="error" @click="excluirTrecho(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Nova Medição -->
    <v-dialog v-model="dialogNovo" max-width="800px">
      <v-card>
        <v-card-title>Nova Medição Horizontal</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.rodovia"
                  label="Rodovia *"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="formData.km_inicial"
                  label="KM Inicial *"
                  type="number"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="3">
                <v-text-field
                  v-model="formData.km_final"
                  label="KM Final *"
                  type="number"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            <!-- Adicione mais campos conforme necessário -->
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNovo = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarTrecho">Salvar</v-btn>
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
import medicaoHorizontalService from '@/services/medicaoHorizontalService'

const loading = ref(false)
const dialogNovo = ref(false)
const trechos = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const headers = [
  { title: 'Rodovia', value: 'rodovia' },
  { title: 'KM Inicial', value: 'km_inicial' },
  { title: 'KM Final', value: 'km_final' },
  { title: 'Data Medição', value: 'data_medicao' },
  { title: 'Ações', value: 'actions', sortable: false }
]

const formData = ref({
  rodovia: '',
  km_inicial: null,
  km_final: null,
  sentido_trafego: '',
  pista: '',
  tipo_marcacao: '',
  cor: '',
  data_medicao: new Date().toISOString().split('T')[0]
})

async function carregarTrechos() {
  loading.value = true
  try {
    const response = await medicaoHorizontalService.listarTrechos()
    if (response.success) {
      trechos.value = response.data
    }
  } catch (error) {
    mostrarNotificacao('Erro ao carregar trechos', 'error')
  } finally {
    loading.value = false
  }
}

async function salvarTrecho() {
  try {
    const response = await medicaoHorizontalService.criarTrecho(formData.value)
    if (response.success) {
      mostrarNotificacao('Trecho criado com sucesso!', 'success')
      dialogNovo.value = false
      carregarTrechos()
    }
  } catch (error) {
    mostrarNotificacao('Erro ao salvar trecho', 'error')
  }
}

function mostrarNotificacao(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  carregarTrechos()
})
</script>
