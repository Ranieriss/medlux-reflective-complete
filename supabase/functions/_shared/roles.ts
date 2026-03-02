export const PERFIS = Object.freeze({
  ADMIN: "ADMIN",
  OPERADOR: "OPERADOR",
});

export const PERFIS_VALIDOS = new Set(Object.values(PERFIS));

const PERFIL_ALIASES: Record<string, string> = {
  ADMIN: PERFIS.ADMIN,
  ADMINISTRADOR: PERFIS.ADMIN,
  ADM: PERFIS.ADMIN,
  OPERADOR: PERFIS.OPERADOR,
  OPERATOR: PERFIS.OPERADOR,
  USUARIO: PERFIS.OPERADOR,
  USER: PERFIS.OPERADOR,
};

export const normalizePerfil = (value?: string): string => {
  const normalized = (value || PERFIS.OPERADOR)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  return PERFIL_ALIASES[normalized] || normalized;
};
