import messages from '@intlify/unplugin-vue-i18n/messages'
import { createI18n } from 'vue-i18n'

/** 与 JSON 文件名 / vue-i18n locale 对齐 */
export type AppLocale = 'en' | 'zh-CN'

export const SUPPORTED_LOCALES: readonly AppLocale[] = ['en', 'zh-CN'] as const

/** Pinia 无持久化记录时的默认语言（与业务约定一致时可改） */
export const DEFAULT_LOCALE: AppLocale = 'en'

/** 语言切换 UI：badge 为 locale 代码（en / zh-CN），展示名称见 i18n `layout.label_locale_*` */
export const LOCALE_OPTIONS: { value: AppLocale; code: string }[] = [
  { value: 'en', code: 'en' },
  { value: 'zh-CN', code: 'zh-CN' },
]

export const i18n = createI18n({
  legacy: false,
  /** 首次创建时的占位值；真实语言以 Pinia 为准，在 main 中同步 */
  locale: DEFAULT_LOCALE,
  fallbackLocale: 'en',
  messages,
})

/** 仅更新 vue-i18n 当前 locale，不读写 localStorage（由 Pinia 统一管理） */
export function applyI18nLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
}
