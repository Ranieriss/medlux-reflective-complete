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
      { path: '', redirect: '/dashboard' },
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
        meta: { title: 'Calibrações' }
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
  },
  // fallback SPA (opcional, ajuda quando cair em rota inexistente)
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' }
]

const router = createRouter({
  // recomendado em Vite: respeita BASE_URL
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// Evita várias restaurações simultâneas (causa “fica rodando”)
let restorePromise = null
async function restoreSessionOnce(authStore) {
  if (authStore.isAuthenticated) return
  if (!restorePromise) {
    restorePromise = Promise.resolve()
      .then(() => authStore.restaurarSessao())
      .catch(() => null)
      .finally(() => {
        restorePromise = null
      })
  }
  await restorePromise
}

// Guard de navegação
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  // Só tenta restaurar sessão se realmente precisa (rota protegida)
  if ((requiresAuth || requiresAdmin) && !authStore.isAuthenticated) {
    await restoreSessionOnce(authStore)
  }

  // Se a rota exige login e não está logado -> manda para /login e guarda redirect
  if ((requiresAuth || requiresAdmin) && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  // Se exige admin e não é admin -> manda para dashboard
  if (requiresAdmin && !authStore.isAdmin) {
    return { path: '/dashboard' }
  }

  // Se está logado e tenta ir pro login -> manda pro dashboard (ou redirect se tiver)
  if (to.path === '/login' && authStore.isAuthenticated) {
    const redirect = typeof to.query?.redirect === 'string' ? to.query.redirect : '/dashboard'
    return { path: redirect }
  }

  return true
})

export default router
