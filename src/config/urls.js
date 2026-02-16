const LOCALHOST_ORIGIN = 'http://localhost:3000'

function getBrowserOrigin() {
  if (typeof window === 'undefined' || !window.location?.origin) {
    return ''
  }

  return window.location.origin
}

export function getAppOrigin() {
  const browserOrigin = getBrowserOrigin()

  if (browserOrigin.endsWith('.vercel.app')) {
    return browserOrigin
  }

  if (import.meta.env.PROD) {
    return browserOrigin || LOCALHOST_ORIGIN
  }

  return browserOrigin || LOCALHOST_ORIGIN
}

export function getResetRedirectUrl() {
  return `${getAppOrigin()}/redefinir-senha`
}

