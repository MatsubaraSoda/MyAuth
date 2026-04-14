// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { authClient } from '@/lib/auth-client'

// 引入两套核心布局骨架
import MainLayout from '@/layouts/MainLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // ==========================================
    // 🔒 内部系统 (Protected Routes)
    // 所有放在 MainLayout 下的页面都需要登录才能看
    // ==========================================
    {
      path: '/',
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          // 默认重定向到个人主页
          path: '',
          redirect: '/profile'
        },
        {
          path: 'profile',
          name: 'Profile',
          // 路由懒加载：只有用户真正访问时才下载该页面的 JS 代码
          component: () => import('@/views/Profile.vue')
        }
        // 未来可以继续在这里添加：
        // { path: 'settings', component: () => import('@/views/Settings.vue') }
      ]
    },

    // ==========================================
    // 🚪 访客系统 (Guest Routes)
    // 已经登录的用户不能再访问这些页面，会被弹回主页
    // ==========================================
    {
      path: '/auth',
      component: AuthLayout,
      meta: { requiresGuest: true },
      children: [
        {
          // 访问 /auth 时默认去登录页
          path: '',
          redirect: '/auth/sign-in'
        },
        {
          path: 'sign-in',
          name: 'SignIn',
          component: () => import('@/views/SignIn.vue')
        },
        {
          path: 'sign-up',
          name: 'SignUp',
          component: () => import('@/views/SignUp.vue')
        },
        {
          path: 'forgot-password',
          name: 'ForgotPassword',
          component: () => import('@/views/ForgotPassword.vue')
        },
        {
          path: 'reset-password',
          name: 'ResetPassword',
          component: () => import('@/views/ResetPassword.vue')
        }
      ]
    },

    // ==========================================
    // 404 捕获 (可选，但强烈建议加上)
    // ==========================================
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      // 这里你可以临时指向随便一个页面，或者之后建个 NotFound.vue
      redirect: '/' 
    }
  ]
})

// ==========================================
// 全局路由守卫 (Navigation Guard)
// ==========================================
router.beforeEach(async (to) => {
  // 检查目标路由及其父路由是否包含权限标记
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresGuest = to.matched.some(record => record.meta.requiresGuest)

  // 如果既不需要登录拦截，也不需要访客拦截（比如纯公开的关于页面），直接放行
  if (!requiresAuth && !requiresGuest) {
    return true
  }

  try {
    // 调用 Better Auth 客户端 SDK，验证当前的 Session 状态
    // (这会自动携带浏览器的 HttpOnly Cookie 向你的 Cloudflare 后端发起验证)
    const { data } = await authClient.getSession()
    const hasSession = Boolean(data?.session)

    if (requiresAuth && !hasSession) {
      // 场景 1: 要去内部系统，但没登录 -> 踢回登录页
      return { name: 'SignIn'}
    } else if (requiresGuest && hasSession) {
      // 场景 2: 要去登录/注册页，但已经登录过了 -> 送去内部系统主页
      return { name: 'Profile' }
    } else {
      // 场景 3: 状态匹配，正常放行
      return true
    }
  } catch (error) {
    console.error('Session 验证失败:', error)
    // 万一网络断了或者后端报错，出于安全考虑：
    // 去内部系统就拦截回登录页，去公开页面就放行
    if (requiresAuth) {
      return { name: 'SignIn' }
    } else {
      return true
    }
  }
})

export default router