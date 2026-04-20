<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Menu } from 'lucide-vue-next'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent } from '@/components/ui/navigation-menu'

import NavActions from './NavActions.vue'
import MobileNav from './MobileNav.vue'

const { t } = useI18n()
const mobileSheetOpen = ref(false)
</script>

<template>
  <nav
    class="fixed inset-x-0 top-0 z-50 bg-[hsl(var(--background)/0.75)] backdrop-blur-xs pt-[env(safe-area-inset-top)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
    :aria-label="t('layout.aria_nav_main')"
  >
    <div
      class="container mx-auto w-full pt-(--auth-nav-outer-gap) px-6 sm:px-12 md:px-24 lg:px-40 xl:px-56 2xl:px-80"
    >
      <div
        class="flex min-h-(--auth-nav-height) items-center justify-between gap-4 rounded-full border border-border bg-card px-6 text-card-foreground shadow-[0_0_0_1px_hsl(var(--border)/0.6),0_8px_24px_hsl(var(--foreground)/0.06)]"
      >
        <div class="flex items-center gap-3">
          <Sheet v-model:open="mobileSheetOpen">
            <SheetTrigger as-child>
              <button
                class="md:hidden inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border bg-background hover:bg-accent"
              >
                <Menu class="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" class="max-w-sm">
              <SheetTitle class="sr-only">{{ t('layout.aria_menu') }}</SheetTitle>
              <MobileNav @close="mobileSheetOpen = false" />
            </SheetContent>
          </Sheet>

          <RouterLink to="/" class="text-md cursor-pointer font-semibold tracking-wide">
            {{ t('layout.title_brand') }}
          </RouterLink>
        </div>

        <NavigationMenu class="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger class="cursor-pointer">{{ t('layout.title_notebooks') }}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul class="grid min-w-48 gap-1 p-2">
                  <li class="rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer">
                    {{ t('layout.label_subject_math') }}
                  </li>
                  <li class="rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer">
                    {{ t('layout.label_subject_physics') }}
                  </li>
                  <li class="rounded-md px-3 py-2 text-sm hover:bg-accent cursor-pointer">
                    {{ t('layout.label_subject_chemistry') }}
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <NavActions />
      </div>
    </div>
  </nav>
</template>
