<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { Globe, Sun, Moon, Monitor, LogIn, UserRoundPlus, ChevronDown } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app'
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
              <Globe class="h-4 w-4" /> 
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
            class="cursor-pointer"
            @click="appStore.setLanguage('English')"
            :class="{ 'bg-accent text-accent-foreground font-medium': appStore.language === 'English' }"
          >
            English
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <div class="grid grid-cols-3 gap-2">
        <button v-for="m in (['light', 'dark', 'system'] as const)" 
          :key="m"
          @click="appStore.setMode(m)"
          class="inline-flex cursor-pointer justify-center rounded-md border p-2 transition-all"
          :class="{ 
            'bg-foreground text-background shadow-md': appStore.mode === m, 
            'hover:bg-accent text-muted-foreground': appStore.mode !== m 
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