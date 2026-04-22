<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navigation from '@/components/common/Navigation.vue'
</script>

<template>
  <div class="min-h-dvh bg-background">
    <Navigation />
    <main
      class="flex min-h-dvh flex-col pt-(--auth-nav-offset) pr-[max(env(safe-area-inset-right),var(--auth-nav-inline-padding))] pl-[max(env(safe-area-inset-left),var(--auth-nav-inline-padding))] pb-[max(env(safe-area-inset-bottom),var(--auth-nav-inline-padding))]"
    >
      <div
        class="mx-auto flex flex-1 w-[min(100%,--spacing(320))] items-center justify-center"
      >
        <div class="w-full max-w-sm">
          <RouterView />
        </div>
      </div>
    </main>
  </div>
</template>