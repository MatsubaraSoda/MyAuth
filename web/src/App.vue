<script setup lang="ts">
import { RouterView } from 'vue-router'

// 未来如果你通过 Shadcn 安装了全局提示组件 (比如 Toast)
// 通常也是放在这里引入的：
// import Toaster from '@/components/ui/toast/Toaster.vue'
</script>

<template>
  <RouterView />
  
  </template>

<style>
/* 这里通常不需要写任何样式了，因为我们在 style.css 里已经配置了全局基础样式。
  所有的布局样式都应该交由具体的 Layout 组件去处理。
*/
</style>