<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      :elevation="0"
      color="surface"
      class="glass"
      height="64"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      
      <v-toolbar-title class="text-h6 font-weight-bold">
        <v-icon class="mr-2" color="primary">mdi-chart-box</v-icon>
        MEDLUX Reflective
      </v-toolbar-title>

      <v-spacer />

      <!-- Notificações -->
      <v-btn icon class="mr-2">
        <v-badge
          :content="notificacoesCount"
          :model-value="notificacoesCount > 0"
          color="error"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>

      <!-- Menu do usuário -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            class="ml-2"
          >
            <v-avatar size="32" color="primary" class="mr-2">
              <v-icon size="20">mdi-account</v-icon>
            </v-avatar>
            <span class="d-none d-sm-inline">{{ authStore.nomeUsuario }}</span>
            <v-icon class="ml-1">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item>
            <v-list-item-title class="font-weight-bold">
              {{ authStore.nomeUsuario }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ authStore.emailUsuario }}
            </v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item 
            prepend-icon="mdi-account-cog" 
            title="Perfil"
            @click="irParaPerfil"
          />
          <v-list-item 
            prepend-icon="mdi-cog" 
            title="Configurações"
            @click="irParaConfiguracoes"
          />
          <v-divider />
          <v-list-item
            prepend-icon="mdi-logout"
            title="Sair"
            @click="handleLogout"
          />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
      class="glass"
    >
      <v-list density="compact" nav>
        <v-list-item
          prepend-icon="mdi-chevron-left"
          title="Menu"
          @click.stop="rail = !rail"
          class="mb-2"
        />
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          :to="item.to"
          :active="$route.path === item.to"
          class="my-1"
        />
      </v-list>
    </v-navigation-drawer>

    <!-- Conteúdo Principal -->
    <v-main>
      <v-container fluid class="pa-4">
        <transition name="fade" mode="out-in">
          <router-view />
        </transition>
      </v-container>
    </v-main>

    <!-- Rodapé -->
    <v-footer app class="glass text-center" height="40">
      <v-col class="text-caption">
        © 2024 MEDLUX Reflective - Todos os direitos reservados
      </v-col>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

// State
const drawer = ref(true)
const rail = ref(false)
const notificacoesCount = ref(3) // TODO: Implementar sistema de notificações

// Menu items baseado em permissões
const menuItems = computed(() => {
  const items = []
  
  // Dashboard - todos veem
  items.push({
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/dashboard'
  })
  
  // Operadores veem apenas medições e seus equipamentos
  if (authStore.isOperador) {
    items.push({
      title: 'Meus Equipamentos',
      icon: 'mdi-devices',
      to: '/equipamentos',
      badge: null
    })
    items.push({
      title: 'Minhas Medições',
      icon: 'mdi-chart-line',
      to: '/calibracoes'
    })
    return items
  }
  
  // Admin e Técnicos veem tudo
  items.push({
    title: 'Equipamentos',
    icon: 'mdi-devices',
    to: '/equipamentos'
  })
  items.push({
    title: 'Vínculos',
    icon: 'mdi-link-variant',
    to: '/vinculos'
  })
  items.push({
    title: 'Medições',
    icon: 'mdi-chart-line',
    to: '/calibracoes'
  })
  items.push({
    title: 'Relatórios',
    icon: 'mdi-file-chart',
    to: '/relatorios'
  })

  // Adicionar itens administrativos
  if (authStore.isAdmin) {
    items.push(
      {
        title: 'Usuários',
        icon: 'mdi-account-group',
        to: '/usuarios'
      },
      {
        title: 'Auditoria',
        icon: 'mdi-shield-search',
        to: '/auditoria'
      },
      {
        title: 'Sistema',
        icon: 'mdi-cog',
        to: '/sistema'
      }
    )
  }

  return items
})

// Métodos
const irParaPerfil = () => {
  router.push('/sistema')  // Reutiliza tela de sistema por enquanto
}

const irParaConfiguracoes = () => {
  router.push('/sistema')  // Reutiliza tela de sistema por enquanto
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.glass {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.v-list-item--active {
  background: rgba(0, 116, 217, 0.2);
  border-left: 3px solid var(--color-primary);
}

.v-list-item--active::before {
  opacity: 0;
}
</style>
