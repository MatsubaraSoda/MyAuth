import { ref } from 'vue'
import { defineStore } from 'pinia'

type Mode = 'light' | 'dark' | 'system'
type Language = 'English'

const STORAGE_MODE_KEY = 'app-mode'
const STORAGE_LANG_KEY = 'app-language'
let systemModeMediaQuery: MediaQueryList | null = null
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    finished: Promise<void>
  }
}

function applyModeToDocument(mode: Mode) {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    return
  }

  if (mode === 'light') {
    root.classList.remove('dark')
    return
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  root.classList.toggle('dark', prefersDark)
}

function bindSystemModeListener(onChange: () => void) {
  if (typeof window === 'undefined') return

  const nextMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  if (systemModeMediaQuery === nextMediaQuery) return

  if (systemModeMediaQuery) {
    systemModeMediaQuery.removeEventListener('change', onChange)
  }

  systemModeMediaQuery = nextMediaQuery
  systemModeMediaQuery.addEventListener('change', onChange)
}

export const useAppStore = defineStore('app', () => {
  const mode = ref<Mode>('system')
  const language = ref<Language>('English')
  
  const syncModeWithSystem = () => {
    if (mode.value === 'system') {
      applyModeToDocument('system')
    }
  }

  // 初始化本地持久化状态
  if (typeof window !== 'undefined') {
    const savedMode = window.localStorage.getItem(STORAGE_MODE_KEY) as Mode | null
    const savedLanguage = window.localStorage.getItem(STORAGE_LANG_KEY) as Language | null

    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
      mode.value = savedMode
    }

    // 仅保留 English 的校验
    if (savedLanguage === 'English') {
      language.value = savedLanguage
    }

    applyModeToDocument(mode.value)
    bindSystemModeListener(syncModeWithSystem)
  }

  function setMode(nextMode: Mode) {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_MODE_KEY, nextMode)
    }

    const vtDocument = document as ViewTransitionDocument

    // 检查浏览器是否支持 View Transitions API
    if (typeof document === 'undefined' || !vtDocument.startViewTransition) {
      mode.value = nextMode
      applyModeToDocument(nextMode)
      return
    }

    // 使用 View Transitions API 平滑切换明暗模式
    vtDocument.startViewTransition(() => {
      mode.value = nextMode
      applyModeToDocument(nextMode)
    })
  }

  function setLanguage(next: Language) {
    language.value = next
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_LANG_KEY, next)
    }
  }

  return {
    mode,
    language,
    setMode,
    setLanguage,
  }
})