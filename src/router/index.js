import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: 'Dashboard' }
      },
      {
        path: 'equipamentos',
        name: 'Equipamentos',
        component: () => import('@/views/EquipamentosLista.vue'),
        meta: { title: 'Equipamentos' }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('@/views/UsuariosLista.vue'),
        meta: { title: 'Usuários', requiresAdmin: true }
      },
      {
        path: 'vinculos',
        name: 'Vinculos',
        component: () => import('@/views/VinculosLista.vue'),
        meta: { title: 'Vínculos' }
      },
      {
        path: 'calibracoes',
        name: 'Calibracoes',
        component: () => import('@/views/CalibracoesLista.vue'),
        meta: { title: 'Medições' }
      },
      {
        path: 'relatorios',
        name: 'Relatorios',
        component: () => import('@/views/RelatoriosLista.vue'),
        meta: { title: 'Relatórios' }
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: () => import('@/views/AuditoriaView.vue'),
        meta: { title: 'Auditoria', requiresAdmin: true }
      },
      {
        path: 'sistema',
        name: 'Sistema',
        component: () => import('@/views/SistemaView.vue'),
        meta: { title: 'Sistema', requiresAdmin: true }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Guard de navegação
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Tentar restaurar sessão
  if (!authStore.isAuthenticated) {
    authStore.restaurarSessao()
  }
  
  // Verificar se rota requer autenticação
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Verificar se rota requer admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
    return
  }
  
  // Se está autenticado e tenta acessar login, redirecionar para dashboard
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
