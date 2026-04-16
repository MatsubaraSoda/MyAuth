import { ref } from 'vue'
import { defineStore } from 'pinia'

type Mode = 'light' | 'dark' | 'system'
type Language = 'English'
export type Palette = 'shadcn-neutral' | 'terminal-dark-ru'

/** UI labels for palette dropdowns (single source). */
export const PALETTE_OPTIONS: {
  value: Palette
  label: string
  swatchVar: '--palette-swatch-shadcn-neutral' | '--palette-swatch-terminal-dark-ru'
}[] = [
  { value: 'shadcn-neutral', label: 'Shadcn Neutral', swatchVar: '--palette-swatch-shadcn-neutral' },
  { value: 'terminal-dark-ru', label: 'Terminal Dark RU', swatchVar: '--palette-swatch-terminal-dark-ru' },
]

const STORAGE_MODE_KEY = 'app-mode'
const STORAGE_LANG_KEY = 'app-language'
const STORAGE_PALETTE_KEY = 'app-palette'
let systemModeMediaQuery: MediaQueryList | null = null
type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => {
    finished: Promise<void>
  }
}

function applyPaletteToDocument(palette: Palette) {
  if (typeof window === 'undefined') return

  const root = document.documentElement
  if (palette === 'shadcn-neutral') {
    root.removeAttribute('data-theme')
    return
  }
  root.dataset.theme = 'terminal-dark-ru'
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
  const palette = ref<Palette>('shadcn-neutral')
  
  const syncModeWithSystem = () => {
    if (mode.value === 'system') {
      applyModeToDocument('system')
    }
  }

  // 初始化本地持久化状态
  if (typeof window !== 'undefined') {
    const savedMode = window.localStorage.getItem(STORAGE_MODE_KEY) as Mode | null
    const savedLanguage = window.localStorage.getItem(STORAGE_LANG_KEY) as Language | null
    const savedPalette = window.localStorage.getItem(STORAGE_PALETTE_KEY) as Palette | null

    if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
      mode.value = savedMode
    }

    // 仅保留 English 的校验
    if (savedLanguage === 'English') {
      language.value = savedLanguage
    }

    if (savedPalette === 'shadcn-neutral' || savedPalette === 'terminal-dark-ru') {
      palette.value = savedPalette
    }

    applyPaletteToDocument(palette.value)
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

  function setPalette(next: Palette) {
    palette.value = next
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_PALETTE_KEY, next)
    }
    applyPaletteToDocument(next)
  }

  return {
    mode,
    language,
    palette,
    setMode,
    setLanguage,
    setPalette,
  }
})