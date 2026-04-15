<script setup lang="ts">
import { Globe, Sun, Moon, Monitor, UserRound, LogIn, UserRoundPlus } from 'lucide-vue-next'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
  <div class="flex items-center gap-2">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="icon" class="hidden cursor-pointer rounded-full md:inline-flex">
          <Globe class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          class="cursor-pointer"
          @click="appStore.setLanguage('English')"
          :class="{ 'bg-accent text-accent-foreground font-medium': appStore.language === 'English' }"
        >
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="icon" class="hidden cursor-pointer rounded-full md:inline-flex">
          <Sun v-if="appStore.mode === 'light'" class="h-4 w-4" />
          <Moon v-else-if="appStore.mode === 'dark'" class="h-4 w-4" />
          <Monitor v-else class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          class="cursor-pointer"
          @click="appStore.setMode('light')"
          :class="appStore.mode === 'light' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Sun class="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer"
          @click="appStore.setMode('dark')"
          :class="appStore.mode === 'dark' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Moon class="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          class="cursor-pointer"
          @click="appStore.setMode('system')"
          :class="appStore.mode === 'system' ? 'bg-accent text-accent-foreground' : ''"
        >
          <Monitor class="mr-2 h-4 w-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="icon" class="cursor-pointer rounded-full bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground">
          <UserRound class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" class="w-44">
        <DropdownMenuLabel>Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem as-child>
          <RouterLink to="/auth/sign-in" class="flex items-center cursor-pointer">
            <LogIn class="mr-2 h-4 w-4" /> Sign In
          </RouterLink>
        </DropdownMenuItem>
        <DropdownMenuItem as-child>
          <RouterLink to="/auth/sign-up" class="flex items-center cursor-pointer">
            <UserRoundPlus class="mr-2 h-4 w-4" /> Sign Up
          </RouterLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>