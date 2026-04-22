<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
</script>

<template>
  <Card class="w-full max-w-md">
    <CardHeader>
      <CardTitle class="text-xl">页面未找到</CardTitle>
      <CardDescription>
        请求的地址不存在，或已被移动。
      </CardDescription>
    </CardHeader>
    <CardContent>
      <p class="text-sm text-muted-foreground">
        请检查链接是否正确，或返回首页继续浏览。
      </p>
    </CardContent>
    <CardFooter class="flex flex-wrap gap-2">
      <Button as-child variant="default">
        <RouterLink to="/">
          返回首页
        </RouterLink>
      </Button>
      <Button as-child variant="outline">
        <RouterLink to="/auth/sign-in">
          登录
        </RouterLink>
      </Button>
    </CardFooter>
  </Card>
</template>
