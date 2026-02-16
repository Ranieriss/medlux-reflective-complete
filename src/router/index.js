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
    path: '/redefinir-senha',
    name: 'RedefinirSenha',
    component: () => import('@/views/RedefinirSenha.vue'),
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
        path: 'medicoes-horizontal',
        name: 'MedicoesHorizontal',
        component: () => import('@/views/MedicaoHorizontal.vue'),
        meta: { title: 'Medição Horizontal - NBR 14723' }
      },
      {
        path: 'medicoes-vertical',
        name: 'MedicoesVertical',
        component: () => import('@/views/MedicaoVertical.vue'),
        meta: { title: 'Medição Vertical - NBR 15426' }
      },
      {
        path: 'dispositivos',
        name: 'Dispositivos',
        component: () => import('@/views/DispositivosLista.vue'),
        meta: { title: 'Tachas e Tachões - NBR 14636 + NBR 15576' }
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
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  // Restaurar sessão apenas quando rota protegida exigir autenticação
  if ((requiresAuth || requiresAdmin) && !authStore.isAuthenticated) {
    await authStore.restaurarSessao()
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  if (requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
    return
  }

  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }

  next()
})

export default router
