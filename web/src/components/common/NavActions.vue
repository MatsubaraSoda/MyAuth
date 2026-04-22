<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages, Palette, Sun, Moon, Monitor, UserRound, LogIn, UserRoundPlus } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LOCALE_OPTIONS, type AppLocale } from '@/locales'
import { useAppStore, PALETTE_OPTIONS } from '@/stores/app'

const { t } = useI18n()
const appStore = useAppStore()

function localeLabel(locale: AppLocale): string {
  return locale === 'en' ? t('layout.label_locale_en') : t('layout.label_locale_zh_CN')
}
</script>

<template>
  <div class="flex items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="hidden cursor-pointer rounded-full md:inline-flex"
          :aria-label="t('layout.aria_language')"
        >
          <Languages class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-auto min-w-max">
        <DropdownMenuItem
          v-for="loc in LOCALE_OPTIONS"
          :key="loc.value"
          class="cursor-pointer whitespace-nowrap"
          @click="appStore.setLanguage(loc.value)"
          :class="{ 'bg-accent text-accent-foreground font-medium': appStore.language === loc.value }"
        >
          <span
            class="mr-2 inline-flex min-w-11 justify-center px-1 font-mono text-xs font-semibold leading-snug tracking-wide"
          >{{ loc.code }}</span>
          {{ localeLabel(loc.value) }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="hidden cursor-pointer rounded-full md:inline-flex"
          :aria-label="t('layout.aria_palette')"
        >
          <Palette class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-auto min-w-max">
        <DropdownMenuItem
          v-for="opt in PALETTE_OPTIONS"
          :key="opt.value"
          class="cursor-pointer whitespace-nowrap"
          @click="appStore.setPalette(opt.value)"
          :class="appStore.palette === opt.value ? 'bg-accent text-accent-foreground font-medium' : ''"
        >
          <span
            class="mr-2 size-2.5 rounded-full border border-border/60"
            :style="{ backgroundColor: `var(${opt.swatchVar})` }"
          />
          {{ opt.label }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="hidden cursor-pointer rounded-full md:inline-flex"
          :aria-label="t('layout.aria_theme')"
        >
          <Sun v-if="appStore.mode === 'light'" class="h-4 w-4" />
          <Moon v-else-if="appStore.mode === 'dark'" class="h-4 w-4" />
          <Monitor v-else class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-auto min-w-max">
        <DropdownMenuItem
          class="cursor-pointer whitespace-nowrap"
          @click="appStore.setMode('light')"
          :class="appStore.mode === 'light' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Sun class="mr-2 h-4 w-4" /> {{ t('layout.label_theme_light') }}
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer whitespace-nowrap"
          @click="appStore.setMode('dark')"
          :class="appStore.mode === 'dark' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Moon class="mr-2 h-4 w-4" /> {{ t('layout.label_theme_dark') }}
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer whitespace-nowrap"
          @click="appStore.setMode('system')"
          :class="appStore.mode === 'system' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Monitor class="mr-2 h-4 w-4" /> {{ t('layout.label_theme_system') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon"
          class="cursor-pointer rounded-full bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <UserRound class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-auto min-w-max">
        <DropdownMenuItem as-child>
          <RouterLink to="/auth/sign-in" class="flex items-center cursor-pointer whitespace-nowrap">
            <LogIn class="mr-2 h-4 w-4" /> {{ t('layout.btn_sign_in') }}
          </RouterLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child>
          <RouterLink to="/auth/sign-up" class="flex items-center cursor-pointer whitespace-nowrap">
            <UserRoundPlus class="mr-2 h-4 w-4" /> {{ t('layout.btn_sign_up') }}
          </RouterLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
