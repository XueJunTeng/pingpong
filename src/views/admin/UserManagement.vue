<!-- src/views/admin/UserManagement.vue -->
<template>
  <div class="management-container">
    <!-- 加载状态提示 -->
    <el-alert
      v-if="userStore.loading"
      title="数据加载中..."
      type="info"
      :closable="false"
      show-icon
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="userStore.error"
      :title="userStore.error"
      type="error"
      show-icon
      @close="userStore.error = null"
    />

    <div class="header">
      <h2>用户管理</h2>
      <div class="actions">
        <!-- 搜索输入 -->
        <el-input
          v-model="searchParams.search"
          placeholder="搜索用户..."
          style="width: 300px"
          clearable
          @change="handleSearch"
        />
      </div>
    </div>

    <!-- 用户表格 -->
    <el-table
      :data="userStore.userList"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="username" label="用户名" width="180" />
      <el-table-column prop="email" label="邮箱" width="300" />
      <el-table-column prop="role" label="角色" width="800">
  <template #default="{ row }">
    <div class="role-container">
      <el-tag :type="roleTagType(row.role)" class="role-tag">
        {{ roleLabels[row.role as UserRole] }}
      </el-tag>
      <el-select
        v-model="row.role"
        :disabled="row.userId === currentUserId"
        class="role-select"
        @change="(val: UserRole) => updateUserRole(row.userId, val)"
      >
        <el-option
          v-for="item in roleOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </div>
  </template>
</el-table-column>
      <el-table-column prop="status" label="状态" width="200">
        <template #default="{ row }">
          <el-switch
            :model-value="row.status"
            active-value="active"
            inactive-value="disabled"
            @change="(val: UserStatus) => updateUserStatus(row.userId, val)"          />
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      v-model:current-page="currentPage"
      :page-size="userStore.currentPagination.pageSize"
      :total="userStore.currentPagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted,} from 'vue'
import { useAuthStore } from '@/stores/auth' // 假设有认证store
import { useUserStore } from '@/stores/userStore'
import type { UserRole, UserStatus, UserProfile } from '@/types/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

// 新增角色选项
const roleOptions = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'USER', label: '普通用户' }
] as const

// 角色标签映射
const roleLabels = {
  ADMIN: '管理员',
  USER: '普通用户'
} as const

// 新增当前用户ID（从store或localStorage获取）
const authStore = useAuthStore(); // 获取认证store实例
const currentUserId = ref<number>(authStore.userInfo?.userId || 0); // 根据实际登录信息修改获取方式

// 修改角色标签颜色
const roleTagType = (role: UserRole) => {
  return role === 'ADMIN' ? 'danger' : 'success'
}

// 修改角色更新方法
const updateUserRole = async (userId: number, newRole: UserRole) => {
  try {
    if (userId === currentUserId.value) {
      ElMessage.warning('不能修改自己的角色')
      return
    }

    await ElMessageBox.confirm('确定要修改用户角色吗？', '操作确认', {
      type: 'warning'
    })

    await userStore.updateUserRole(userId, newRole)
    ElMessage.success('角色更新成功')
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('角色更新失败')
    }
    // 恢复原始值
    userStore.userList = userStore.userList.map(u => {
      if (u.userId === userId) {
        return { ...u, role: u._originalRole || u.role }
      }
      return u
    })
  }
}



const userStore = useUserStore()
// 初始化加载数据
onMounted(() => {
  userStore.fetchUsers(getQueryParams())
})

// 搜索参数
const searchParams = ref({
  search: '',
  role: undefined as UserRole | undefined,
  status: undefined as UserStatus | undefined
})

// 当前页码
const currentPage = computed({
  get: () => userStore.currentPagination.page,
  set: (val) => userStore.currentPagination.page = val
})


// 获取查询参数
const getQueryParams = () => ({
  page: currentPage.value,
  pageSize: userStore.currentPagination.pageSize,
  ...searchParams.value
})

// 分页变化处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  userStore.fetchUsers(getQueryParams())
}

// 每页数量变化
const handleSizeChange = (size: number) => {
  userStore.currentPagination.pageSize = size
  userStore.fetchUsers(getQueryParams())
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  userStore.fetchUsers(getQueryParams())
}

// 更新用户状态
const updateUserStatus = async (userId: number, status: UserStatus) => {
  try {
    await userStore.updateUserStatus(userId, status)
  } catch (error) {
    console.error('状态更新失败:', error)
  }
}

// 批量选择处理
const selectedUsers = ref<number[]>([])
  const handleSelectionChange = (selection: UserProfile[]) => {
  selectedUsers.value = selection.map(user => user.userId)
}








</script>

<style scoped>
/* 原有样式保持不变 */
.role-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: relative;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.pagination {
  margin-top: 24px;
  justify-content: flex-end;
}

.role-tag {
  flex: 0 0 auto;
}

.role-select {
  position: absolute;
  right: 0;
  width: 150px;
}
.el-table-column[prop="role"] {
  .cell {
    padding-right: 160px; /* 为下拉框留出空间 */
  }
}

/* 禁用状态样式 */
:deep(.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  cursor: not-allowed;
}

/* 管理员红色样式 */
.el-tag--danger {
  --el-tag-bg-color: var(--el-color-danger-light-9);
  --el-tag-border-color: var(--el-color-danger-light-8);
}
</style>
