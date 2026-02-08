import fr from './fr.json'
import ar from './ar.json'

export const translations = { fr, ar }

export const defaultLocale = 'fr'

export function getTranslation(locale, key) {
  const keys = key.split('.')
  let result = translations[locale] || translations[defaultLocale]
  
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      // Fallback to French
      result = translations[defaultLocale]
      for (const fallbackKey of keys) {
        if (result && typeof result === 'object' && fallbackKey in result) {
          result = result[fallbackKey]
        } else {
          return key // Return key if not found
        }
      }
      break
    }
  }
  
  return result
}

export { fr, ar }
