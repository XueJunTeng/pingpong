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
        <el-button type="primary" @click="showCreateDialog">新增用户</el-button>
        <el-button
          type="danger"
          :disabled="selectedUsers.length === 0"
          @click="handleBatchDelete"
        >
          批量删除 ({{ selectedUsers.length }})
        </el-button>

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
      <el-table-column prop="email" label="邮箱" width="400" />
      <el-table-column prop="role" label="角色" width="300">
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
            @change="(val: UserStatus) => updateUserStatus(row.userId, val)"
          />
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

    <!-- 新建用户对话框 -->
    <el-dialog v-model="createDialogVisible" title="新建用户" width="500px">
      <el-form
        :model="newUserForm"
        :rules="formRules"
        ref="createFormRef"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="newUserForm.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="newUserForm.email" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="newUserForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="newUserForm.role">
            <el-option
              v-for="item in roleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreateUser">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/userStore'
import type { UserRole, UserStatus, UserProfile } from '@/types/auth'

// 类型定义
interface NewUserForm {
  username: string
  email: string
  password: string
  role: UserRole
}

// 组件逻辑
const authStore = useAuthStore()
const userStore = useUserStore()
const createFormRef = ref<FormInstance>()
const createDialogVisible = ref(false)
const selectedUsers = ref<number[]>([])
const currentUserId = ref(authStore.userInfo?.userId || 0)

// 表单初始值
const newUserForm = ref<NewUserForm>({
  username: '',
  email: '',
  password: '',
  role: 'USER'
})

// 查询参数
const searchParams = ref({
  search: '',
  role: undefined as UserRole | undefined,
  status: undefined as UserStatus | undefined
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3到20个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6个字符', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 角色配置
const roleOptions = [
  { value: 'ADMIN', label: '管理员' },
  { value: 'USER', label: '普通用户' }
] as const

const roleLabels = {
  ADMIN: '管理员',
  USER: '普通用户'
} as const

// 初始化数据
onMounted(() => userStore.fetchUsers(getQueryParams()))

// 分页相关
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

// 用户操作
const roleTagType = (role: UserRole) => role === 'ADMIN' ? 'danger' : 'success'

const updateUserRole = async (userId: number, newRole: UserRole) => {
  try {
    if (userId === currentUserId.value) {
      ElMessage.warning('不能修改自己的角色')
      return
    }

    await ElMessageBox.confirm('确定要修改用户角色吗？', '操作确认', { type: 'warning' })
    await userStore.updateUserRole(userId, newRole)
    ElMessage.success('角色更新成功')
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('角色更新失败')
    userStore.userList = userStore.userList.map(u =>
      u.userId === userId ? { ...u, role: u._originalRole || u.role } : u
    )
  }
}

const updateUserStatus = async (userId: number, status: UserStatus) => {
  try {
    await userStore.updateUserStatus(userId, status)
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
  userStore.fetchUsers(getQueryParams())
}

const handleSizeChange = (size: number) => {
  userStore.currentPagination.pageSize = size
  userStore.fetchUsers(getQueryParams())
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  userStore.fetchUsers(getQueryParams())
}

// 批量选择
const handleSelectionChange = (selection: UserProfile[]) => {
  selectedUsers.value = selection.map(user => user.userId)
}

// 新建用户
const showCreateDialog = () => {
  createDialogVisible.value = true
}

const submitCreateUser = async () => {
  if (!createFormRef.value) return
  try {
    await createFormRef.value.validate()
    await userStore.createUser(newUserForm.value)

    ElMessage.success('用户创建成功')
    createDialogVisible.value = false
    userStore.fetchUsers(getQueryParams())
    createFormRef.value.resetFields()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '创建失败')
  }
}

// 批量删除
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedUsers.value.length} 个用户？`,
      '警告',
      { type: 'warning' }
    )

    await userStore.deleteUsers(selectedUsers.value)
    ElMessage.success('删除成功')
    userStore.fetchUsers(getQueryParams())
    selectedUsers.value = []
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
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
