<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen w-full flex flex-col items-center justify-center p-4">
    <div class="w-full max-w-100 flex flex-col gap-6">

      <RouterView />
      
    </div>
  </div>
</template>