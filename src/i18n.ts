import { nextTick, isRef, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import config from '@/config.json'

import type { I18n, I18nOptions, Locale, VueI18n, Composer, I18nMode } from 'vue-i18n'

export const SUPPORTED_LOCALES = config.availableLocales
export const PREFERRED_SUPPORTED_LOCALES = navigator.languages.filter((locale) =>
  SUPPORTED_LOCALES.includes(locale),
)

if (!SUPPORTED_LOCALES.includes(navigator.language)) {
  console.warn(`Most preferred locale '${navigator.language}' is not supported. Will use another.`)
}

if (!PREFERRED_SUPPORTED_LOCALES.length) {
  console.warn('No supported locales found. Defaulting to fallback locale.')
}

let i18n: I18n

function isComposer(instance: VueI18n | Composer, mode: I18nMode): instance is Composer {
  return mode === 'composition' && isRef(instance.locale)
}

export function getLocale(): string {
  if (isComposer(i18n.global, i18n.mode)) {
    return i18n.global.locale.value
  } else {
    return i18n.global.locale
  }
}

export function isLocaleSupported(locale: Locale): boolean {
  return SUPPORTED_LOCALES.includes(locale)
}

export function setupI18n(
  options: I18nOptions = {
    legacy: false,
    locale: PREFERRED_SUPPORTED_LOCALES[0] ?? navigator.language,
    fallbackLocale: config.fallbackLocale,
  },
): I18n {
  i18n = createI18n({
    ...options,
    missing: (locale, key, vm) => {
      const localeLoaded = localeIsLoaded(locale)

      // TODO: should fallback to all preferred locales before falling back to default

      if (localeLoaded) {
        console.warn(`Locale '${locale}' missing '${key}'`)
      } else {
        console.log(`Will load '${locale}' locale.`)
        loadLocaleMessages(locale)
      }

      return key
    },
  })

  setI18nLanguage(options.locale!)
  return i18n
}

export async function setI18nLanguage(locale: Locale) {
  if (!isLocaleSupported(locale)) {
    throw new Error(`Locale not supported: ${locale}`)
  }

  // load locale messages if the are not downloaded yet
  await loadLocaleMessages(locale, true)

  setLocale(locale)
  // TODO:
  /**
   * NOTE:
   * If you need to specify the language setting for headers, such as the `fetch` API, set it here.
   * The following is an example for axios.
   *
   * axios.defaults.headers.common['Accept-Language'] = locale
   */
  document.querySelector('html')!.setAttribute('lang', locale)

  // update ref
  currentLocale.value = locale
}

function setLocale(locale: Locale): void {
  if (isComposer(i18n.global, i18n.mode)) {
    i18n.global.locale.value = locale
  } else {
    i18n.global.locale = locale
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getResourceMessages = (r: any) => r.default || r

export async function loadLocaleMessages(locale: Locale, forceLoadEvenIfLoaded = false) {
  if (localeIsLoaded(locale) && !forceLoadEvenIfLoaded) return

  // load locale messages
  const messages = await import(`./locales/${locale}.json`).then(getResourceMessages)

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages)

  return nextTick()
}

export function localeIsLoaded(locale: Locale): boolean {
  return i18n.global.availableLocales.includes(locale)
}

// ref currentLocale
export const currentLocale = ref('none')

watch(currentLocale, (val) => {
  if (val === getLocale()) return
  setI18nLanguage(val)
})
