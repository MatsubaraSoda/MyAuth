<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Loader2, LogOut, X } from 'lucide-vue-next'
import { authClient } from '@/lib/auth-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

type SessionRow = {
  id?: string
  token?: string
  updatedAt?: string | Date
  createdAt?: string | Date
  userAgent?: string | null
}

const { t } = useI18n()

const loading = ref(true)
const errorMessage = ref('')
const sessions = ref<SessionRow[]>([])
const currentSessionId = ref<string | undefined>()
const currentSessionToken = ref<string | undefined>()

function parseRows(result: unknown): SessionRow[] {
  if (Array.isArray(result))
    return result as SessionRow[]
  if (result && typeof result === 'object') {
    const r = result as { data?: unknown; error?: { message?: string } }
    if (Array.isArray(r.data))
      return r.data as SessionRow[]
  }
  return []
}

function parseError(result: unknown): string | undefined {
  if (result && typeof result === 'object') {
    const r = result as { error?: { message?: string } }
    return r.error?.message
  }
  return undefined
}

function formatRelativeTime(input?: string | Date): string {
  if (!input)
    return t('auth.profile.security.session_time_unknown')
  const date = new Date(input)
  if (Number.isNaN(date.getTime()))
    return t('auth.profile.security.session_time_unknown')
  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute)
    return t('auth.profile.security.session_time_just_now')
  if (diff < hour)
    return t('auth.profile.security.session_time_minutes_ago', { count: Math.floor(diff / minute) })
  if (diff < day)
    return t('auth.profile.security.session_time_hours_ago', { count: Math.floor(diff / hour) })
  return t('auth.profile.security.session_time_days_ago', { count: Math.floor(diff / day) })
}

function parseDevice(userAgent?: string | null): string {
  if (!userAgent)
    return t('auth.profile.security.session_unknown_device')
  const ua = userAgent.toLowerCase()
  const browser
    = ua.includes('edg/') ? 'Edge'
      : ua.includes('chrome/') ? 'Chrome'
        : ua.includes('safari/') && !ua.includes('chrome/') ? 'Safari'
          : ua.includes('firefox/') ? 'Firefox'
            : ua.includes('opr/') || ua.includes('opera/') ? 'Opera'
              : t('auth.profile.security.session_unknown_browser')
  const os
    = ua.includes('iphone') || ua.includes('ipad') ? 'iOS'
      : ua.includes('android') ? 'Android'
        : ua.includes('mac os x') || ua.includes('macintosh') ? 'macOS'
          : ua.includes('windows') ? 'Windows'
            : ua.includes('linux') ? 'Linux'
              : t('auth.profile.security.session_unknown_os')
  if (
    browser === t('auth.profile.security.session_unknown_browser')
    && os === t('auth.profile.security.session_unknown_os')
  ) {
    return t('auth.profile.security.session_unknown_device')
  }
  return t('auth.profile.security.session_device_label', { browser, os })
}

function isCurrentSession(row: SessionRow): boolean {
  if (currentSessionId.value && row.id)
    return row.id === currentSessionId.value
  if (currentSessionToken.value && row.token)
    return row.token === currentSessionToken.value
  return false
}

onMounted(async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [sessionRes, currentRes] = await Promise.all([
      authClient.listSessions(),
      authClient.getSession(),
    ])

    const listError = parseError(sessionRes)
    if (listError) {
      errorMessage.value = listError
      sessions.value = []
      return
    }

    sessions.value = parseRows(sessionRes)

    if (currentRes?.data?.session) {
      currentSessionId.value = currentRes.data.session.id
      currentSessionToken.value = currentRes.data.session.token
    }
  }
  catch (e) {
    errorMessage.value = e instanceof Error
      ? e.message
      : t('auth.profile.security.msg_sessions_load_error')
    sessions.value = []
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="space-y-3">
    <h2 class="text-base font-semibold tracking-tight">
      {{ t('auth.profile.security.section_active_sessions') }}
    </h2>
    <Card class="overflow-hidden py-0">
      <CardContent class="space-y-0 p-0">
        <div
          v-if="loading"
          class="flex items-center gap-2 px-6 py-4 text-sm text-muted-foreground"
        >
          <Loader2 class="size-4 shrink-0 animate-spin" />
          <span>{{ t('auth.profile.security.msg_sessions_loading') }}</span>
        </div>

        <template v-else-if="errorMessage">
          <div class="px-6 py-4">
            <p class="text-sm text-destructive">
              {{ errorMessage }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ t('auth.profile.security.msg_sessions_load_hint') }}
            </p>
          </div>
        </template>

        <div
          v-else-if="sessions.length === 0"
          class="px-6 py-4 text-sm text-muted-foreground"
        >
          {{ t('auth.profile.security.msg_sessions_empty') }}
        </div>

        <template v-else>
          <template
            v-for="(row, idx) in sessions"
            :key="row.id ?? row.token ?? idx"
          >
            <div class="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
              <div class="min-w-0 space-y-1">
                <p class="font-semibold leading-tight">
                  {{ parseDevice(row.userAgent) }}
                </p>
                <p class="truncate text-sm text-muted-foreground">
                  {{ formatRelativeTime(row.updatedAt ?? row.createdAt) }}
                </p>
                <Badge
                  v-if="isCurrentSession(row)"
                  variant="secondary"
                  class="text-[10px] font-normal"
                >
                  {{ t('auth.profile.security.session_current_badge') }}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled
                class="h-auto min-h-0 shrink-0 gap-1.5 px-2 py-2 text-xs leading-tight"
              >
                <LogOut
                  v-if="isCurrentSession(row)"
                  class="size-3.5 shrink-0"
                />
                <X
                  v-else
                  class="size-3.5 shrink-0"
                />
                {{
                  isCurrentSession(row)
                    ? t('auth.profile.security.btn_session_sign_out')
                    : t('auth.profile.security.btn_revoke')
                }}
              </Button>
            </div>

            <Separator v-if="idx < sessions.length - 1" />
          </template>
        </template>
      </CardContent>
    </Card>
  </section>
</template>
