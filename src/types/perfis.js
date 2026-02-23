export const PERFIS = Object.freeze({
  ADMIN: 'ADMIN',
  OPERADOR: 'OPERADOR'
})

const PERFIL_ALIASES = Object.freeze({
  ADMIN: PERFIS.ADMIN,
  ADMINISTRADOR: PERFIS.ADMIN,
  ADM: PERFIS.ADMIN,
  OPERADOR: PERFIS.OPERADOR,
  OPERATOR: PERFIS.OPERADOR,
  USER: PERFIS.OPERADOR,
  USUARIO: PERFIS.OPERADOR,
  USUÁRIO: PERFIS.OPERADOR,
  TECNICO: PERFIS.OPERADOR,
  TÉCNICO: PERFIS.OPERADOR,
  TECNICA: PERFIS.OPERADOR,
  TÉCNICA: PERFIS.OPERADOR,
  TEC: PERFIS.OPERADOR
})

export const PERFIS_SELECT_ITEMS = Object.freeze([
  { title: 'Administrador', value: PERFIS.ADMIN },
  { title: 'Operador', value: PERFIS.OPERADOR }
])

export function normalizePerfil(perfil) {
  const normalized = (perfil || '')
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  return PERFIL_ALIASES[normalized] || normalized
}

export function isPerfilValido(perfil) {
  return Object.values(PERFIS).includes(normalizePerfil(perfil))
}

export function formatarPerfil(perfil) {
  const normalized = normalizePerfil(perfil)
  if (normalized === PERFIS.ADMIN) return 'Administrador'
  if (normalized === PERFIS.OPERADOR) return 'Operador'
  return normalized || 'Não definido'
}

export function getPerfilColor(perfil) {
  const normalized = normalizePerfil(perfil)
  if (normalized === PERFIS.ADMIN) return 'error'
  if (normalized === PERFIS.OPERADOR) return 'secondary'
  return 'grey'
}

export function getPerfilIcon(perfil) {
  const normalized = normalizePerfil(perfil)
  if (normalized === PERFIS.ADMIN) return 'mdi-shield-crown'
  if (normalized === PERFIS.OPERADOR) return 'mdi-account-cog'
  return 'mdi-account'
}
