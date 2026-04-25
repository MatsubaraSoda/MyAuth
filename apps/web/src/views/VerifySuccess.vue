<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CircleCheckBig } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const router = useRouter()
const { t } = useI18n()

function handleBackToConsole() {
  void router.replace('/profile')
}
</script>

<template>
  <Card class="w-full max-w-sm">
    <CardHeader class="items-center text-left">
      <CardTitle class="text-lg">
        {{ t('auth.verify_success.title') }}
      </CardTitle>
      <CardDescription>
        {{ t('auth.verify_success.description') }}
      </CardDescription>
    </CardHeader>
    <CardFooter>
      <Button class="w-full cursor-pointer" @click="handleBackToConsole">
        {{ t('auth.verify_success.btn_back_to_console') }}
      </Button>
    </CardFooter>
  </Card>
</template>
