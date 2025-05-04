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
  value?: string
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

  // 获取用户列表
  const fetchUsers = async (params: UserQueryParams) => {
    try {
      loading.value = true
      const response = await api.get('api/admin/users', {
        params: {
          page: params.page,
          size: params.pageSize,
          search: params.search,
          status: params.status,
          role: params.role
        }
      })

      currentPagination.value = {
        page: response.data.currentPage,
        pageSize: params.pageSize, // 保持前端分页设置
        total: response.data.total
      }

      userList.value = (response.data.data || []).map((user: UserProfile) => ({
        ...user,
        _originalRole: user.role
      }))
    } catch (err) {
      error.value = '获取用户数据失败'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // 创建用户
  const createUser = async (userData: {
    username: string
    email: string
    password: string
    role: UserRole
  }) => {
    try {
      loading.value = true
      await api.post('api/admin/users', userData)

      // 创建后重新获取第一页数据
      await fetchUsers({
        page: 1,
        pageSize: currentPagination.value.pageSize
      })
    } catch (err) {
      error.value = '创建用户失败'
      console.error(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 批量删除用户
  const deleteUsers = async (userIds: number[]) => {
    try {
      loading.value = true;
      // 修改请求参数结构
      await api.post('api/admin/users/batch-operations', {
        userIds,       // 对应Java类的List<Long> userIds
        operation: 'delete' // 对应operation字段，删除操作固定为'delete'
        // newRole字段在删除操作中不需要传递
      });

      // 更新本地数据
      userList.value = userList.value.filter(u => !userIds.includes(u.userId));
      currentPagination.value.total -= userIds.length;

      // 处理空页情况
      if (userList.value.length === 0 && currentPagination.value.page > 1) {
        currentPagination.value.page--;
        await fetchUsers({
          page: currentPagination.value.page,
          pageSize: currentPagination.value.pageSize
        });
      }
    } catch (err) {
      error.value = '删除用户失败';
      console.error(err);
      throw err;
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

      // 更新本地状态
      const user = userList.value.find(u => u.userId === userId)
      if (user) user.status = status
    } catch (err) {
      error.value = '状态更新失败'
      console.error(err)
      throw err
    }
  }

  // 更新用户角色（带当前用户校验）
  const updateUserRole = async (userId: number, newRole: UserRole) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      if (userId === currentUser.userId) {
        throw new Error('不能修改当前登录用户的角色')
      }

      // 保留原始值
      const user = userList.value.find(u => u.userId === userId)
      if (!user) throw new Error('用户不存在')
      const originalRole = user.role
      user._originalRole = originalRole

      // API 请求
      await api.patch(`api/admin/users/${userId}/role`, null, {
        params: { role: newRole }
      })

      // 更新成功
      user.role = newRole
      delete user._originalRole
    } catch (err) {
      // 回滚角色
      const user = userList.value.find(u => u.userId === userId)
      if (user?._originalRole) {
        user.role = user._originalRole
        delete user._originalRole
      }

      error.value = err instanceof Error ? err.message : '角色更新失败'
      console.error(err)
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

      // 更新本地数据
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

  // 导出用户
  const exportUsers = async (params: UserQueryParams) => {
    try {
      const response = await api.get<Blob>('api/admin/users/export', {
        params: {
          ...params,
          page: params.page - 1,
          responseType: 'blob'
        }
      })

      // 创建下载
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
    createUser,
    deleteUsers,
    updateUserStatus,
    updateUserRole,
    batchOperation,
    exportUsers
  }
})
