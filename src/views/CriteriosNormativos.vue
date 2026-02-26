<template>
  <v-container fluid class="pa-4">
    <div class="text-h6 font-weight-bold mb-4">
      <v-icon class="mr-2" color="primary">mdi-tune-vertical</v-icon>
      Critérios Normativos (Valor Mínimo)
    </div>

    <v-card class="glass pa-4">
      <v-data-table
        :headers="headers"
        :items="itens"
        :loading="loading"
        item-key="id"
        density="compact"
      >
        <template #item.valor_minimo="{ item }">
          <v-text-field
            v-model.number="item.valor_minimo"
            type="number"
            density="compact"
            @blur="atualizar(item)"
          />
        </template>

        <template #item.ativo="{ item }">
          <v-switch
            v-model="item.ativo"
            @change="atualizar(item)"
            inset
          />
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/services/supabase'

const authStore = useAuthStore()

const loading = ref(false)
const itens = ref([])

const headers = [
  { title: 'Tipo', key: 'tipo_equipamento' },
  { title: 'Geometria', key: 'geometria' },
  { title: 'Material', key: 'material' },
  { title: 'Sinalização', key: 'tipo_sinalizacao' },
  { title: 'Norma', key: 'norma_ref' },
  { title: 'Unidade', key: 'unidade' },
  { title: 'Valor Mínimo', key: 'valor_minimo' },
  { title: 'Ativo', key: 'ativo' }
]

const carregar = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('norma_criterios_validacao')
    .select('*')
    .order('tipo_equipamento')

  if (!error) {
    itens.value = data
  }
  loading.value = false
}

const atualizar = async (item) => {
  if (!authStore.isAdmin) return

  await supabase
    .from('norma_criterios_validacao')
    .update({
      valor_minimo: item.valor_minimo,
      ativo: item.ativo
    })
    .eq('id', item.id)
}

onMounted(() => {
  if (authStore.isAdmin) {
    carregar()
  }
})
</script>

<style scoped>
.glass {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
