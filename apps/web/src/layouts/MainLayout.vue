<script setup lang="ts">
/**
 * 与 AuthLayout 一致的壳层：固定顶栏 Navigation + 主内容区预留 safe-area / nav offset。
 * （参考 MCP：应用布局应为固定栏预留空间，主区域承载页面内容。）
 */
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
        class="mx-auto flex w-full flex-1 flex-col items-center px-4 py-8 sm:px-6 md:py-12"
      >
        <RouterView />
      </div>
    </main>
  </div>
</template>
