// src/stores/userStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserProfile, UserStatus, UserRole } from '@/types/auth'
import { api } from '@/api'

interface PaginationParams {
  page: number
  pageSize: number
  sortBy?: string
  search?: string
}

interface UserQueryParams extends PaginationParams {
  status?: UserStatus
  role?: UserRole
}

interface BatchOperation {
  operation: 'status' | 'role' | 'delete'
  userIds: number[]
  value?: string // 用于存储状态或角色值
}

export const useUserStore = defineStore('user', () => {
  // 状态管理
  const userList = ref<UserProfile[]>([])
  const currentPagination = ref({
    page: 1,
    pageSize: 10,
    total: 0
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 核心 API 方法
const fetchUsers = async (params: UserQueryParams) => {
  try {
    loading.value = true;
    const response = await api.get('api/admin/users', {
      params: {
        page: params.page,
        size: params.pageSize,
        search: params.search
      }
    });

    // 关键修改：使用请求参数中的 pageSize 而非响应数据
    currentPagination.value = {
      page: response.data.currentPage,
      pageSize: response.data.pageSize,  // 使用前端传入的参数
      total: response.data.total
    };

    userList.value = response.data.data || [];
  } catch (err) {
    error.value = '获取用户数据失败';
    console.error(err);
  } finally {
    loading.value = false;
  }
}

  // 更新用户状态
  const updateUserStatus = async (userId: number, status: UserStatus) => {
    try {
      await api.patch(`api/admin/users/${userId}/status`, null, {
        params: { status }
      })
      // 更新本地数据
      const targetUser = userList.value.find(u => u.userId === userId)
      if (targetUser) targetUser.status = status
    } catch (err) {
      error.value = '状态更新失败'
      console.error(err)
      throw err
    }
  }

  // 更新用户角色
  const updateUserRole = async (userId: number, newRole: UserRole) => {
    try {
      // 获取当前登录用户ID（根据实际项目情况调整获取方式）
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')

      // 禁止修改当前用户角色
      if (userId === currentUser.userId) {
        error.value = '不能修改当前登录用户的角色'
        throw new Error('Cannot modify current user role')
      }

      // 保存原始值用于回滚
      const targetUser = userList.value.find(u => u.userId === userId)
      if (!targetUser) {
        error.value = '用户不存在'
        throw new Error('User not found')
      }
      const originalRole = targetUser.role
      targetUser._originalRole = originalRole

      // 发起API请求
      await api.patch(`api/admin/users/${userId}/role`, null, {
        params: { role: newRole }
      })

      // 更新成功后清理临时属性
      targetUser.role = newRole
      delete targetUser._originalRole

    } catch (err) {
      // 回滚数据
      const targetUser = userList.value.find(u => u.userId === userId)
      if (targetUser && targetUser._originalRole) {
        targetUser.role = targetUser._originalRole
        delete targetUser._originalRole
      }

      // 错误处理
      if (err instanceof Error) {
        error.value = err.message === 'Cannot modify current user role'
          ? '不能修改当前用户角色'
          : '角色更新失败'
        console.error(`[角色更新失败] ${err.message}`)
      }

      throw err
    }
  }

  // 批量操作
  const batchOperation = async (payload: BatchOperation) => {
    try {
      await api.post('api/admin/users/batch-operations', {
        operationType: payload.operation,
        targetIds: payload.userIds,
        newValue: payload.value
      })

      // 更新本地状态
      switch (payload.operation) {
        case 'status':
          userList.value = userList.value.map(u =>
            payload.userIds.includes(u.userId)
              ? { ...u, status: payload.value as UserStatus }
              : u
          )
          break
        case 'role':
          userList.value = userList.value.map(u =>
            payload.userIds.includes(u.userId)
              ? { ...u, role: payload.value as UserRole }
              : u
          )
          break
        case 'delete':
          userList.value = userList.value.filter(
            u => !payload.userIds.includes(u.userId)
          )
          currentPagination.value.total -= payload.userIds.length
          break
      }
    } catch (err) {
      error.value = '批量操作失败'
      console.error(err)
      throw err
    }
  }

  // 导出功能
  const exportUsers = async (params: UserQueryParams) => {
    try {
      const response = await api.get<Blob>('api/admin/users/export', {
        params: {
          ...params,
          page: params.page - 1,
          responseType: 'blob'
        }
      })

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `users_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      error.value = '导出数据失败'
      console.error(err)
      throw err
    }
  }

  return {
    userList,
    currentPagination,
    loading,
    error,
    fetchUsers,
    updateUserStatus,
    updateUserRole,
    batchOperation,
    exportUsers
  }
})