<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-circle-outline</v-icon>
            <span>Tachas e Tachões - ABNT NBR 14636 + NBR 15576</span>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialogNovo = true">
              <v-icon left>mdi-plus</v-icon>
              Novo Dispositivo
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Filtros -->
            <v-row class="mb-4">
              <v-col cols="3">
                <v-select
                  v-model="filtros.categoria"
                  :items="['tacha', 'tachao']"
                  label="Categoria"
                  clearable
                  @update:model-value="carregarDispositivos"
                ></v-select>
              </v-col>
              <v-col cols="3">
                <v-select
                  v-model="filtros.cor"
                  :items="['branco', 'amarelo', 'vermelho', 'verde', 'azul']"
                  label="Cor"
                  clearable
                  @update:model-value="carregarDispositivos"
                ></v-select>
              </v-col>
              <v-col cols="3">
                <v-select
                  v-model="filtros.status_final"
                  :items="['conforme', 'nao-conforme', 'pendente']"
                  label="Status"
                  clearable
                  @update:model-value="carregarDispositivos"
                ></v-select>
              </v-col>
            </v-row>

            <v-data-table
              :headers="headers"
              :items="dispositivos"
              :loading="loading"
              class="elevation-1"
            >
              <template v-slot:item.categoria="{ item }">
                <v-chip :color="item.categoria === 'tacha' ? 'blue' : 'green'">
                  {{ item.categoria }}
                </v-chip>
              </template>
              <template v-slot:item.status_final="{ item }">
                <v-chip :color="getStatusColor(item.status_final)">
                  {{ item.status_final }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon size="small" @click="visualizarDispositivo(item)">
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
                <v-btn icon size="small" color="error" @click="excluirDispositivo(item)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog Novo Dispositivo -->
    <v-dialog v-model="dialogNovo" max-width="900px">
      <v-card>
        <v-card-title>Novo Dispositivo</v-card-title>
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model="formData.codigo"
                  label="Código *"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="formData.categoria"
                  :items="[
                    { title: 'Tacha', value: 'tacha' },
                    { title: 'Tachão', value: 'tachao' }
                  ]"
                  label="Categoria *"
                  required
                ></v-select>
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="formData.cor"
                  :items="['branco', 'amarelo', 'vermelho', 'verde', 'azul']"
                  label="Cor *"
                  required
                ></v-select>
              </v-col>

              <!-- Campos específicos para TACHAS -->
              <template v-if="formData.categoria === 'tacha'">
                <v-col cols="6">
                  <v-select
                    v-model="formData.tipo_corpo"
                    :items="['A-resina', 'B-plastico', 'C-metal']"
                    label="Tipo de Corpo *"
                  ></v-select>
                </v-col>
                <v-col cols="6">
                  <v-select
                    v-model="formData.tipo_lente"
                    :items="[
                      'I-polimero',
                      'II-polimero-anti-abrasivo',
                      'III-polimero-vidro',
                      'IV-esferas-vidro'
                    ]"
                    label="Tipo de Lente *"
                  ></v-select>
                </v-col>
              </template>

              <!-- Campos específicos para TACHÕES -->
              <template v-if="formData.categoria === 'tachao'">
                <v-col cols="6">
                  <v-select
                    v-model="formData.tipo_tachao"
                    :items="['I-prismas-plastico', 'II-esferas-vidro']"
                    label="Tipo de Tachão *"
                  ></v-select>
                </v-col>
              </template>

              <v-col cols="6">
                <v-text-field
                  v-model="formData.fabricante"
                  label="Fabricante *"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="formData.modelo"
                  label="Modelo *"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialogNovo = false">Cancelar</v-btn>
          <v-btn color="primary" @click="salvarDispositivo">Salvar</v-btn>
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
import dispositivosService from '@/services/dispositivosService'

const loading = ref(false)
const dialogNovo = ref(false)
const dispositivos = ref([])
const snackbar = ref({ show: false, text: '', color: 'success' })

const filtros = ref({
  categoria: null,
  cor: null,
  status_final: null
})

const headers = [
  { title: 'Código', value: 'codigo' },
  { title: 'Categoria', value: 'categoria' },
  { title: 'Fabricante', value: 'fabricante' },
  { title: 'Modelo', value: 'modelo' },
  { title: 'Cor', value: 'cor' },
  { title: 'Status', value: 'status_final' },
  { title: 'Data Medição', value: 'data_medicao' },
  { title: 'Ações', value: 'actions', sortable: false }
]

const formData = ref({
  codigo: '',
  categoria: 'tacha',
  fabricante: '',
  modelo: '',
  cor: '',
  tipo_corpo: '',
  tipo_lente: '',
  tipo_tachao: '',
  data_medicao: new Date().toISOString().split('T')[0]
})

function getStatusColor(status) {
  const colors = {
    'conforme': 'success',
    'nao-conforme': 'error',
    'pendente': 'warning'
  }
  return colors[status] || 'grey'
}

async function carregarDispositivos() {
  loading.value = true
  try {
    const response = await dispositivosService.listarDispositivos(filtros.value)
    if (response.success) {
      dispositivos.value = response.data
    }
  } catch (error) {
    mostrarNotificacao('Erro ao carregar dispositivos', 'error')
  } finally {
    loading.value = false
  }
}

async function salvarDispositivo() {
  try {
    const response = await dispositivosService.criarDispositivo(formData.value)
    if (response.success) {
      mostrarNotificacao('Dispositivo criado com sucesso!', 'success')
      dialogNovo.value = false
      carregarDispositivos()
    }
  } catch (error) {
    mostrarNotificacao('Erro ao salvar dispositivo', 'error')
  }
}

function mostrarNotificacao(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

onMounted(() => {
  carregarDispositivos()
})
</script>
