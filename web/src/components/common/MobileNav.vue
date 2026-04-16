<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Languages, Palette, Sun, Moon, Monitor, LogIn, UserRoundPlus, ChevronDown } from 'lucide-vue-next'
import { useAppStore, PALETTE_OPTIONS } from '@/stores/app'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const appStore = useAppStore()
defineEmits(['close'])

// 控制移动端 Notebooks 菜单的展开/收起
const isNotebooksOpen = ref(false)
</script>

<template>
  <div class="flex h-full flex-col px-6 pt-8 pb-[max(env(safe-area-inset-bottom),2rem)]">
    
    <RouterLink to="/" class="mb-8 cursor-pointer text-xl font-semibold" @click="$emit('close')">
      MatsubaraSoda
    </RouterLink>

    <div class="border-t py-6 flex-1 overflow-y-auto">
      <div class="space-y-2">
        
        <Collapsible v-model:open="isNotebooksOpen" class="w-full">
          <CollapsibleTrigger as-child>
            <button class="flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-base font-medium hover:bg-accent transition-colors">
              Notebooks
              <ChevronDown 
                class="h-4 w-4 transition-transform duration-200" 
                :class="{ 'rotate-180': isNotebooksOpen }"
              />
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent class="space-y-1 px-4 pt-1">
            <RouterLink to="#" class="block cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent" @click="$emit('close')">Mathematics</RouterLink>
            <RouterLink to="#" class="block cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent" @click="$emit('close')">Physics</RouterLink>
            <RouterLink to="#" class="block cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-accent" @click="$emit('close')">Chemistry</RouterLink>
          </CollapsibleContent>
        </Collapsible>
        
        </div>
    </div>

    <div class="mt-auto grid gap-4 border-t pt-6">
      
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <div class="flex items-center gap-2">
              <span class="flex w-10 shrink-0 items-center justify-center">
                <Languages class="h-4 w-4" />
              </span>
              {{ appStore.language }}
            </div>
            <ChevronDown class="h-4 w-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          class="w-(--reka-dropdown-menu-trigger-width)"
        >
          <DropdownMenuItem
            class="cursor-pointer whitespace-nowrap px-2 gap-2"
            @click="appStore.setLanguage('English')"
            :class="{ 'bg-accent text-accent-foreground font-medium': appStore.language === 'English' }"
          >
            <span class="flex w-10 shrink-0 items-center justify-center">
              <span class="inline-flex rounded-sm border border-border/60 px-1 text-[10px] font-semibold leading-4 tracking-wide whitespace-nowrap">EN</span>
            </span>
            English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="flex w-full cursor-pointer items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors">
            <div class="flex items-center gap-2">
              <span class="flex w-10 shrink-0 items-center justify-center">
                <Palette class="h-4 w-4" />
              </span>
              {{ PALETTE_OPTIONS.find((o) => o.value === appStore.palette)?.label ?? 'Shadcn Neutral' }}
            </div>
            <ChevronDown class="h-4 w-4 opacity-50" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          class="w-(--reka-dropdown-menu-trigger-width)"
        >
          <DropdownMenuItem
            v-for="opt in PALETTE_OPTIONS"
            :key="opt.value"
            class="cursor-pointer whitespace-nowrap px-2 gap-2"
            @click="appStore.setPalette(opt.value)"
            :class="{ 'bg-accent text-accent-foreground font-medium': appStore.palette === opt.value }"
          >
            <span class="flex w-10 shrink-0 items-center justify-center">
              <span
                class="size-2.5 rounded-full border border-border/60"
                :style="{ backgroundColor: `var(${opt.swatchVar})` }"
              />
            </span>
            {{ opt.label }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="grid grid-cols-3 gap-2">
        <button v-for="m in (['light', 'dark', 'system'] as const)" 
          :key="m"
          @click="appStore.setMode(m)"
          type="button"
          class="inline-flex cursor-pointer justify-center rounded-md border border-border p-2 transition-colors"
          :class="{ 
            'border-primary bg-primary text-primary-foreground font-semibold shadow-sm': appStore.mode === m, 
            'bg-background text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground': appStore.mode !== m 
          }"
        >
          <component :is="m === 'light' ? Sun : m === 'dark' ? Moon : Monitor" class="h-4 w-4" />
        </button>
      </div>

      <div class="grid gap-2">
        <RouterLink to="/auth/sign-in" class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors" @click="$emit('close')">
          <LogIn class="h-4 w-4" /> Sign In
        </RouterLink>
        <RouterLink to="/auth/sign-up" class="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 transition-colors" @click="$emit('close')">
          <UserRoundPlus class="h-4 w-4" /> Sign Up
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Alignment note (handover guard):
 * - Language/Palette dropdown items intentionally use `px-2` (not `px-3`) in template classes.
 * - Reason: with shared leading slot width (`w-10`), `px-3` made item content appear slightly right-shifted
 *   relative to trigger rows. `px-2` visually aligns trigger/item baselines in current UI.
 * - Layout contract between trigger and item:
 *   1) Trigger rows: left block = `[leading slot w-10] + [label]`, right block = chevron.
 *   2) Dropdown items: left block = `[leading slot w-10] + [label]`, no chevron block.
 *   3) Both sides share the same leading slot width (`w-10`) so icon/code/dot starts from one reference line.
 *   4) Item horizontal inset uses `px-2` to compensate for dropdown item default box model and keep text start aligned.
 * - If future spacing tokens or dropdown primitives change, re-verify this alignment before reverting.
 */
</style>