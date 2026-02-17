import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const LoginView = () => import('@/views/Login.vue')
const RedefinirSenhaView = () => import('@/views/RedefinirSenha.vue')
const LayoutView = () => import('@/views/Layout.vue')
const DashboardView = () => import('@/views/Dashboard.vue')
const EquipamentosView = () => import('@/views/EquipamentosLista.vue')
const UsuariosView = () => import('@/views/UsuariosLista.vue')
const VinculosView = () => import('@/views/VinculosLista.vue')
const CalibracoesView = () => import('@/views/CalibracoesLista.vue')
const MedicaoHorizontalView = () => import('@/views/MedicaoHorizontal.vue')
const MedicaoVerticalView = () => import('@/views/MedicaoVertical.vue')
const DispositivosView = () => import('@/views/DispositivosLista.vue')
const RelatoriosView = () => import('@/views/RelatoriosLista.vue')
const AuditoriaView = () => import('@/views/AuditoriaView.vue')
const SistemaView = () => import('@/views/SistemaView.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/redefinir-senha',
    name: 'RedefinirSenha',
    component: RedefinirSenhaView,
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: LayoutView,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' }
      },
      {
        path: 'equipamentos',
        name: 'Equipamentos',
        component: EquipamentosView,
        meta: { title: 'Equipamentos' }
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: UsuariosView,
        meta: { title: 'Usuários', requiresAdmin: true }
      },
      {
        path: 'vinculos',
        name: 'Vinculos',
        component: VinculosView,
        meta: { title: 'Vínculos' }
      },
      {
        path: 'calibracoes',
        name: 'Calibracoes',
        component: CalibracoesView,
        meta: { title: 'Medições' }
      },
      {
        path: 'medicoes-horizontal',
        name: 'MedicoesHorizontal',
        component: MedicaoHorizontalView,
        meta: { title: 'Medição Horizontal - NBR 14723' }
      },
      {
        path: 'medicoes-vertical',
        name: 'MedicoesVertical',
        component: MedicaoVerticalView,
        meta: { title: 'Medição Vertical - NBR 15426' }
      },
      {
        path: 'dispositivos',
        name: 'Dispositivos',
        component: DispositivosView,
        meta: { title: 'Tachas e Tachões - NBR 14636 + NBR 15576' }
      },
      {
        path: 'relatorios',
        name: 'Relatorios',
        component: RelatoriosView,
        meta: { title: 'Relatórios' }
      },
      {
        path: 'auditoria',
        name: 'Auditoria',
        component: AuditoriaView,
        meta: { title: 'Auditoria', requiresAdmin: true }
      },
      {
        path: 'sistema',
        name: 'Sistema',
        component: SistemaView,
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
