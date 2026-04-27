import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth-client'

export function useAuthNavSession() {
  const router = useRouter()
  const sessionState = authClient.useSession()

  const user = computed(() => sessionState.value?.data?.user ?? null)
  const isLoggedIn = computed(() => Boolean(sessionState.value?.data?.session))

  const displayName = computed(() => {
    const name = user.value?.name?.trim()
    if (name)
      return name
    const email = user.value?.email?.trim()
    if (email) {
      const local = email.split('@')[0]
      return local || email
    }
    return ''
  })

  const signingOut = ref(false)

  async function signOut(): Promise<boolean> {
    if (signingOut.value)
      return false
    signingOut.value = true
    const { error } = await authClient.signOut()
    signingOut.value = false
    if (error?.message)
      return false
    await router.push('/auth/sign-in')
    return true
  }

  return {
    user,
    displayName,
    isLoggedIn,
    signingOut,
    signOut,
  }
}
