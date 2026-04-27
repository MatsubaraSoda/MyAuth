<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProfileAccount from './ProfileAccount.vue'
import ProfileSecurity from './ProfileSecurity.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

function tabFromQuery(tab: unknown): 'account' | 'security' {
  return tab === 'security' ? 'security' : 'account'
}

const activeTab = ref<'account' | 'security'>(tabFromQuery(route.query.tab))

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tabFromQuery(tab)
  },
)

watch(activeTab, (value) => {
  const current = tabFromQuery(route.query.tab)
  if (current === value)
    return

  const nextQuery = { ...route.query } as Record<
    string,
    string | string[] | undefined
  >
  if (value === 'security')
    nextQuery.tab = 'security'
  else
    delete nextQuery.tab

  void router.replace({ query: nextQuery })
})
</script>

<template>
<div class="-mx-4 w-full max-w-lg lg:max-w-2xl rounded-xl px-4 py-6">
  <div class="mx-auto w-full space-y-8">
      <Tabs
        v-model="activeTab"
        class="w-full gap-8"
        :unmount-on-hide="false"
      >
        <TabsList class="grid h-auto w-fit grid-cols-2 gap-1">
          <TabsTrigger value="account">
            {{ t('auth.profile.tab_account') }}
          </TabsTrigger>
          <TabsTrigger value="security">
            {{ t('auth.profile.tab_security') }}
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="account"
          class="mt-0 flex flex-col gap-8"
        >
          <ProfileAccount />
        </TabsContent>

        <TabsContent
          value="security"
          class="mt-0 flex flex-col gap-8"
        >
          <ProfileSecurity />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
