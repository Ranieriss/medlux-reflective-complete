export const PRODUCTION_APP_URL = 'https://medlux-reflective-complete.vercel.app'

const getAppBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return PRODUCTION_APP_URL
}

export const APP_BASE_URL = getAppBaseUrl()
export const RESET_PASSWORD_REDIRECT_URL = `${APP_BASE_URL}/redefinir-senha`
