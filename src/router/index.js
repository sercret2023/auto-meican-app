import { createRouter, createWebHashHistory } from 'vue-router'
import GetCookie from '@/views/GetCookie.vue'

// 使用懒加载方式导入组件
const HomePage = () => import('@/views/Home.vue')
const LoginPage = () => import('@/views/Login.vue')

const routes = [
  {
    path: '/',
    redirect: () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn')
      return isLoggedIn ? '/home' : '/login'
    }
  },
  {
    path: '/home',
    name: 'HomePage',  // 与组件名保持一致
    component: HomePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'LoginPage',  // 与组件名保持一致
    component: LoginPage
  },
  {
    path: '/get-cookie',
    name: 'GetCookie',
    component: GetCookie
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 添加全局前置守卫
router.beforeEach((to, from, next) => {
  console.log('路由跳转:', {
    from: from.path,
    to: to.path,
    isLoggedIn: localStorage.getItem('isLoggedIn')
  })
  
  const isLoggedIn = localStorage.getItem('isLoggedIn')
  
  if (to.meta.requiresAuth && !isLoggedIn) {
    next({ name: 'LoginPage' })
    return  // 确保跳转后立即返回
  }
  
  // 如果访问登录页但已登录，重定向到首页
  if (to.name === 'LoginPage' && isLoggedIn) {
    next({ name: 'HomePage' })
    return
  }
  
  next()
})

export default router 