// src/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 布局组件
const MainLayout = () => import('@/layouts/MainLayout.vue')
const EmptyLayout = () => import('@/layouts/EmptyLayout.vue')
const AdminLayout = () => import('@/layouts/AdminLayout.vue')

// 公共路由
const publicRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/HomeView.vue'),
        meta: {
          title: '首页' ,
          requiresAuth: true
        }
      },
      {
        path: 'Search',
        name: 'Search',
        component: () => import('@/views/SearchView.vue'),
        meta: {
          title: '搜索页' ,
          requiresAuth: true
        }
      },

      {
        path: 'video/:contentId',
        name: 'VideoDetail',
        component: () => import('@/views/VideoView.vue'),
        props: true,
        meta: {
          title: '视频详情',
          requiresAuth: true
        }
      },
      {
        path: 'article/:contentId',
        name: 'ArticleDetail',
        component: () => import('@/views/ArticleView.vue'),
        props: true,
        meta: {
          title: '文章详情',
          requiresAuth: true
        }
      },
      {
        path: 'upload',
        name: 'Upload',
        component: () => import('@/views/UploadView.vue'),
        meta: {
          title: '内容上传',
          requiresAuth: true
        }
      },
      {
        path: 'article',
        name: 'article',
        component: () => import('@/views/ArticlePublishView.vue'),
        meta: {
          title: '文章投稿',
          requiresAuth: true
        }
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('@/views/notificationsView.vue'),
        meta: {
          title: '我的消息',
          requiresAuth: true
        }
      },
      {
        path: 'userCenter',
        name: 'userCenter',
        component: () => import('@/views/UserCenterView.vue'),
        meta: {
          title: '个人中心',
          requiresAuth: true
        }
      },
      {
        path: 'articles',
        name: 'articles',
        component: () => import('@/views/ArticlesView.vue'),
        meta: {
          title: '文章列表',
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/auth',
    component: EmptyLayout,
    children: [
      {
        path: 'login',
        name: 'Login',
        component: () => import('@/views/LoginView.vue'),
        meta: { title: '登录' }
      },
      {
        path: 'register',
        name: 'Register',
        component: () => import('@/views/RegisterView.vue'),
        meta: { title: '注册' }
      }
    ]
  }
]

// 管理员路由
const adminRoutes: RouteRecordRaw = {
  path: '/admin',
  name: 'AdminRoot',
  component: AdminLayout,
  meta: {
    requiresAuth: true,
    requiresAdmin: true
  },
  children: [
    {
      path: '',
      name: 'AdminDashboard',
      component: () => import('@/views/admin/DashboardView.vue'),
      meta: { title: '仪表盘' }
    },
    {
      path: 'users',
      name: 'UserManagement',
      component: () => import('@/views/admin/UserManagement.vue'),
      meta: { title: '用户管理' }
    },
    {
      path: 'tags',
      name: 'TagManagement',
      component: () => import('@/views/admin/TagManagement.vue'),
      meta: { title: '标签管理' }
    },
    {
      path: 'content',
      name: 'ContentManagement',
      component: () => import('@/views/admin/ContentManagement.vue'),
      meta: { title: '内容审核' }
    },
    {
      path: 'contentAdmin',
      name: 'ContentAdmin',
      component: () => import('@/views/admin/ContentAdmin.vue'),
      meta: { title: '内容管理' }
    },
  ]
}

// 错误页面
const errorRoutes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/ForbiddenView.vue'),
    meta: { title: '禁止访问' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [...publicRoutes, adminRoutes, ...errorRoutes],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  }
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const documentTitle = to.meta.title
    ? `${to.meta.title} | 我的站点`
    : '我的站点'
  document.title = documentTitle.toString()

  // 不需要认证的页面直接放行
  if (!to.meta.requiresAuth) return true

  // 认证检查
  if (!authStore.isAuthenticated) {
    return {
      name: 'Login',
      query: { redirect: to.fullPath },
      replace: true
    }
  }

  // 管理员权限检查
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'Forbidden', replace: true }
  }

  return true
})

export default router
