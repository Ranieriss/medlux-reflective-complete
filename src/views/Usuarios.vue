<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-account-group</v-icon>
        Usuários
      </h1>
      <v-btn color="primary" size="large" class="glow-primary" @click="abrirDialogNovo">
        <v-icon class="mr-2">mdi-plus</v-icon>
        Novo Usuário
      </v-btn>
    </div>

    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-card class="glass">
          <v-card-text>
            <div class="text-h6 text-main mb-2">Total</div>
            <div class="text-h3 font-weight-bold">{{ usuarios.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="glass">
          <v-card-text>
            <div class="text-h6 text-success mb-2">Ativos</div>
            <div class="text-h3 font-weight-bold">{{ usuariosAtivos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="glass">
          <v-card-text>
            <div class="text-h6 text-warning mb-2">Inativos</div>
            <div class="text-h3 font-weight-bold">{{ usuariosInativos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="glass">
      <v-data-table :headers="headers" :items="usuarios" :loading="carregando" :items-per-page="10">
        <template v-slot:item.nome="{ item }">
          <div class="font-weight-bold">{{ item.nome }}</div>
          <div class="text-caption">{{ item.email }}</div>
        </template>
        
        <template v-slot:item.perfil="{ item }">
          <v-chip :color="getCorPerfil(item.perfil)" size="small" variant="flat">
            {{ item.perfil }}
          </v-chip>
        </template>
        
        <template v-slot:item.ativo="{ item }">
          <v-chip :color="item.ativo ? 'success' : 'grey'" size="small">
            {{ item.ativo ? 'Ativo' : 'Inativo' }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="editarUsuario(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" :color="item.ativo ? 'error' : 'success'" @click="toggleAtivo(item)">
            <v-icon>{{ item.ativo ? 'mdi-account-off' : 'mdi-account-check' }}</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="dialogForm" max-width="600px" persistent>
      <v-card class="glass">
        <v-card-title>{{ modoEdicao ? 'Editar Usuário' : 'Novo Usuário' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" v-model="formValido">
            <v-text-field v-model="usuarioForm.nome" label="Nome *" :rules="[regras.required]" />
            <v-text-field v-model="usuarioForm.email" label="Email *" type="email" :rules="[regras.required, regras.email]" />
            <v-text-field v-if="!modoEdicao" v-model="usuarioForm.senha" label="Senha *" type="password" :rules="[regras.required]" />
            <v-select v-model="usuarioForm.perfil" :items="perfis" label="Perfil *" :rules="[regras.required]" />
            <v-switch v-model="usuarioForm.ativo" label="Usuário Ativo" color="primary" />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="fecharDialog">Cancelar</v-btn>
          <v-btn color="primary" :loading="salvando" @click="salvarUsuario">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import supabase from '@/services/supabase'

const usuarios = ref([])
const carregando = ref(false)
const dialogForm = ref(false)
const modoEdicao = ref(false)
const formValido = ref(false)
const salvando = ref(false)
const formRef = ref(null)

const usuarioForm = ref({
  nome: '',
  email: '',
  senha: '',
  perfil: 'tecnico',
  ativo: true
})

const snackbar = ref({ show: false, message: '', color: 'success' })

const headers = [
  { title: 'Usuário', key: 'nome' },
  { title: 'Perfil', key: 'perfil' },
  { title: 'Status', key: 'ativo' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'center' }
]

const perfis = ['administrador', 'gestor', 'tecnico']

const regras = {
  required: v => !!v || 'Campo obrigatório',
  email: v => /.+@.+\..+/.test(v) || 'Email inválido'
}

const usuariosAtivos = computed(() => usuarios.value.filter(u => u.ativo).length)
const usuariosInativos = computed(() => usuarios.value.filter(u => !u.ativo).length)

const getCorPerfil = (perfil) => {
  const cores = { administrador: 'error', gestor: 'warning', tecnico: 'info' }
  return cores[perfil] || 'grey'
}

const carregarUsuarios = async () => {
  carregando.value = true
  try {
    const { data, error } = await supabase.from('usuarios').select('*').order('nome')
    if (error) throw error
    usuarios.value = data
  } catch (error) {
    console.error('Erro ao carregar usuários:', error)
    snackbar.value = { show: true, message: 'Erro ao carregar usuários', color: 'error' }
  } finally {
    carregando.value = false
  }
}

const abrirDialogNovo = () => {
  modoEdicao.value = false
  usuarioForm.value = { nome: '', email: '', senha: '', perfil: 'tecnico', ativo: true }
  dialogForm.value = true
}

const editarUsuario = (usuario) => {
  modoEdicao.value = true
  usuarioForm.value = { ...usuario }
  dialogForm.value = true
}

const salvarUsuario = async () => {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  salvando.value = true
  try {
    if (modoEdicao.value) {
      const { error } = await supabase
        .from('usuarios')
        .update({ nome: usuarioForm.value.nome, perfil: usuarioForm.value.perfil, ativo: usuarioForm.value.ativo })
        .eq('id', usuarioForm.value.id)
      if (error) throw error
      snackbar.value = { show: true, message: 'Usuário atualizado!', color: 'success' }
    } else {
      const payload = {
        email: (usuarioForm.value.email || '').trim().toLowerCase(),
        password: usuarioForm.value.senha,
        nome: usuarioForm.value.nome,
        perfil: usuarioForm.value.perfil,
        role: usuarioForm.value.perfil,
        ativo: usuarioForm.value.ativo
      }

      const { data: sess } = await supabase.auth.getSession()
      const token = sess?.session?.access_token
      if (!token) throw new Error('Sessão expirada. Faça login novamente.')

      const { data, error } = await supabase.functions.invoke('create-user', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: payload
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      snackbar.value = { show: true, message: 'Usuário criado!', color: 'success' }
    }
    await carregarUsuarios()
    fecharDialog()
  } catch (error) {
    snackbar.value = { show: true, message: `Erro: ${error.message}`, color: 'error' }
  } finally {
    salvando.value = false
  }
}

const toggleAtivo = async (usuario) => {
  try {
    const { error } = await supabase
      .from('usuarios')
      .update({ ativo: !usuario.ativo })
      .eq('id', usuario.id)
    if (error) throw error
    snackbar.value = { show: true, message: `Usuário ${!usuario.ativo ? 'ativado' : 'desativado'}!`, color: 'success' }
    await carregarUsuarios()
  } catch (error) {
    snackbar.value = { show: true, message: `Erro: ${error.message}`, color: 'error' }
  }
}

const fecharDialog = () => {
  dialogForm.value = false
  formRef.value?.resetValidation()
}

onMounted(carregarUsuarios)
</script>

<style scoped>
.glass {
  background: rgba(21, 25, 51, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 255, 0.2);
}
.glow-primary {
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.6);
}
</style>
