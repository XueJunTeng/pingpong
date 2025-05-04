<template>
  <div class="user-center-container">
    <!-- 左侧导航 -->
    <!-- 左侧导航 -->
    <div class="nav-sidebar">
      <div class="sidebar-header">
        <h2>用户中心</h2>
      </div>
      <el-menu
        :default-active="activeTab"
        @select="handleTabChange"
        class="user-center-menu"
      >
        <!-- 原有菜单项 -->
        <el-menu-item index="profile">
          <el-icon><User /></el-icon>
          <span>个人资料</span>
        </el-menu-item>
        <el-menu-item index="security">
          <el-icon><Lock /></el-icon>
          <span>账号安全</span>
        </el-menu-item>
        <el-sub-menu index="history">
          <template #title>
            <el-icon><Clock /></el-icon>
            <span>历史记录</span>
          </template>
          <el-menu-item index="history-view">观看历史</el-menu-item>
          <el-menu-item index="history-like">点赞记录</el-menu-item>
          <el-menu-item index="history-favorite">收藏记录</el-menu-item>
        </el-sub-menu>

        <!-- 退出登录按钮 -->
        <el-menu-item index="logout" @click="handleLogout">
          <el-icon><SwitchButton /></el-icon>
          <span style="color: #ff4d4f">退出登录</span>
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧内容 -->
    <div class="content-main">
      <!-- 个人资料 -->
      <div v-show="activeTab === 'profile'" class="profile-section">
        <el-card class="form-card">
          <div class="avatar-uploader">
            <el-upload
              class="avatar-upload"
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
               :http-request="handleCustomUpload"
            >
              <el-avatar :size="120" :src="userInfo.avatar">
                {{ userInfo.username?.charAt(0) }}
              </el-avatar>
              <div class="upload-mask">
                <el-icon><CameraFilled /></el-icon>
              </div>
            </el-upload>
            <p class="upload-tip">点击修改头像</p>
          </div>

          <el-form
            ref="profileFormRef"
            :model="userInfo"
            :rules="profileRules"
            label-width="100px"
          >
            <!-- 用户名 -->
            <el-form-item label="用户名" prop="username">
              <div class="form-item-content">
                <el-input
                  v-model="userInfo.username"
                  placeholder="请输入新用户名"
                  clearable
                />
                <el-button
                  type="primary"
                  class="submit-btn"
                  @click="updateProfile('username')"
                >
                  修改
                </el-button>
              </div>
            </el-form-item>

            <!-- 新增邮箱字段 -->
            <el-form-item label="邮箱" prop="email">
              <div class="form-item-content">
                <el-input
                  v-model="userInfo.email"
                  placeholder="请输入新邮箱"
                  clearable
                />
                <el-button
                  type="primary"
                  class="submit-btn"
                  @click="updateProfile('email')"
                >
                  修改
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 账号安全 -->
      <div v-show="activeTab === 'security'" class="security-section">
        <el-card class="form-card">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="当前密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                show-password
                placeholder="请输入当前密码"
              />
            </el-form-item>

            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                show-password
                placeholder="8-20位字母、数字或符号"
              />
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                show-password
                placeholder="请再次输入新密码"
              />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="updatePassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>

      <!-- 历史记录 -->
      <!-- 修改历史记录部分 -->
  <div v-if="activeTab.startsWith('history')" class="history-section">
    <div class="section-header">
      <h3>{{ activeTabText }}</h3>
    </div>

    <div v-loading="loading" class="video-grid">
      <template v-if="historyList.length > 0">
        <template v-for="item in historyList" :key="item.contentId">
          <!-- 视频内容 -->
          <VideoCard
            v-if="item.type === 'VIDEO'"
            :video="item"
            class="video-item"
          />

          <!-- 文章内容 -->
          <ArticleCard
            v-else-if="item.type === 'ARTICLE'"
            :article="item"
            class="video-item"
          />
        </template>
      </template>
      <el-empty v-else description="暂无相关记录" />
    </div>

        <div class="pagination-wrapper" v-if="total > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            layout="prev, pager, next"
            :total="total"
            @current-change="loadHistoryData"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Clock, CameraFilled } from '@element-plus/icons-vue'
import VideoCard from '@/components/VideoCard.vue'
import { useAuthStore } from '@/stores/auth'
import type { UploadRequestOptions } from 'element-plus/es/components/upload/src/upload'
import { useHistoryStore } from '@/stores/history'
import type { HistoryType } from '@/stores/history'
import ArticleCard from '@/components/ArticleCard.vue'
import { ElMessageBox } from 'element-plus'
import router from '@/router'
const historyStore = useHistoryStore()
// 类型定义
type HistoryTab = 'profile' | 'security' | 'history-view' | 'history-like' | 'history-favorite'

// 响应式状态
const activeTab = ref<HistoryTab>('profile')
const authStore = useAuthStore()

// 计算属性
const activeTabText = computed(() => {
  const tabMap: Record<HistoryTab, string> = {
    'profile': '个人资料',
    'security': '账号安全',
    'history-view': '观看历史',
    'history-like': '点赞记录',
    'history-favorite': '收藏记录'
  }
  return tabMap[activeTab.value]
})

// 用户信息
const userInfo = reactive({
  avatar: authStore.currentUser?.avatar || '',
  username: authStore.currentUser?.username || '',
  email: authStore.currentUser?.email || '' // 新增邮箱字段
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 新增验证规则
const profileRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, max: 16, message: '长度在2到16个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
  ]
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    {
      pattern: /^(?=.*[a-zA-Z])(?=.*\d).{8,20}$/,
      message: '8-20位字母和数字组合'
    }
  ],
  confirmPassword: [
    {
      validator: (rule: unknown, value: string, callback: (error?: Error) => void) => {
        if (value !== passwordForm.newPassword) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 头像上传处理
const handleCustomUpload = async (options: UploadRequestOptions) => {
  try {
    // 调用store的上传方法并传入文件对象
    const newAvatarUrl = await authStore.uploadAvatar(options.file)

    // 更新本地响应式数据
    userInfo.avatar = newAvatarUrl

    // 显示成功提示
    ElMessage.success({
      message: '头像更新成功',
      duration: 2000
    })

    return { success: true }
  } catch (error) {
    ElMessage.error({
      message: (error as Error).message || '头像上传失败',
      duration: 3000
    })
    return Promise.reject(error)
  }
}

// 保持原有验证逻辑
const beforeAvatarUpload = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  const isImage = validTypes.includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('仅支持 JPG/PNG/WEBP 格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB!')
    return false
  }
  return true
}

// 修改后的更新方法
const profileFormRef = ref<FormInstance>()
const updateProfile = async (field: 'username' | 'email') => {
  try {
    if (!profileFormRef.value) return
    // 验证单个字段
    await profileFormRef.value.validateField(field)
    // 调用更新接口
    await authStore.updateProfile({
      [field]: userInfo[field]
    })
    ElMessage.success(`${field === 'username' ? '用户名' : '邮箱'}修改成功`)
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '更新失败')
  }
}

// 密码修改
const updatePassword = async () => {
  try {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      throw new Error('两次输入的密码不一致')
    }

    await authStore.changePassword(
      passwordForm.oldPassword,
      passwordForm.newPassword
    )

    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''

    ElMessage.success('密码修改成功')
  } catch (error: unknown) {
    ElMessage.error((error as Error).message || '密码修改失败')
  }
}


// 添加计算属性获取 store 状态
const historyList = computed(() => historyStore.historyList)
const loading = computed(() => historyStore.loading)
const total = computed(() => historyStore.pagination.total)
const currentPage = computed({
  get: () => historyStore.pagination.page,
  set: (value) => historyStore.pagination.page = value
})
const pageSize = computed(() => historyStore.pagination.pageSize)

// 修改加载历史记录方法
const loadHistoryData = async () => {
  try {
    const historyType = getHistoryType(activeTab.value)
    await historyStore.fetchHistory(historyType, currentPage.value, pageSize.value)
  } catch (err) {
    const message = (err as Error)?.message || '数据加载失败'
    ElMessage.error(message)
    console.error('加载失败:', err)
  }
}

// 添加类型转换方法
const getHistoryType = (tab: HistoryTab): HistoryType => {
  const typeMap: Record<HistoryTab, HistoryType | null> = {
    'profile': null,
    'security': null,
    'history-view': 'view',
    'history-like': 'like',
    'history-favorite': 'favorite'
  }
  return typeMap[tab] || 'view' // 默认返回 view 类型
}

// 修改 tab 切换处理
const handleTabChange = (key: HistoryTab) => {
  if (key.startsWith('history')) {
    historyStore.clearHistory()
    currentPage.value = 1
    activeTab.value = key
    loadHistoryData()
  } else {
    activeTab.value = key
  }
}

// 退出登录处理
const handleLogout = async () => {
  try {
    // 确认对话框
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定退出',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'logout-confirm-dialog',
      confirmButtonClass: 'confirm-danger-btn',
      cancelButtonClass: 'cancel-safe-btn'
    })

    // 执行退出逻辑
    await authStore.userlogout()

    // 跳转到登录页
    router.replace({ name: 'Login' })

    // 显示成功提示
    ElMessage.success({
      message: '已安全退出系统',
      duration: 2000
    })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // 用户取消退出时不处理
    console.log('退出操作已取消')
  }
}
// 生命周期
onMounted(() => {
  if (activeTab.value.startsWith('history')) {
    loadHistoryData()
  }
})
</script>

<style scoped lang="scss">
.form-item-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.submit-btn {
  flex-shrink: 0;
  width: 80px;
}
// 退出按钮动画
@keyframes shake {
  0% { transform: rotate(0deg); }
  25% { transform: rotate(15deg); }
  50% { transform: rotate(0deg); }
  75% { transform: rotate(-15deg); }
  100% { transform: rotate(0deg); }
}

// 移动端适配
@media (max-width: 768px) {
  .user-center-container {
    .nav-sidebar {
      :deep(.el-menu-item[data-index="logout"]) {
        position: static;
        border-top: none;

        span {
          font-size: 14px;
        }
      }
    }
  }
}

// 对话框自定义样式
:global(.logout-confirm-dialog) {
  .el-message-box__content {
    padding: 20px;
  }

  .confirm-danger-btn {
    background-color: #ff4d4f;
    border-color: #ff4d4f;

    &:hover {
      background-color: #ff7875;
      border-color: #ff7875;
    }
  }

  .cancel-safe-btn {
    &:hover {
      color: #409eff;
      border-color: #c6e2ff;
    }
  }
}
.user-center-container {
  display: flex;
  max-width: 1200px;
  margin: 20px auto;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);

  .nav-sidebar {
    position: relative; // 为绝对定位子元素提供基准
    width: 240px;
    border-right: 1px solid #e7e7e7;

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e7e7e7;

      h2 {
        margin: 0;
        font-size: 18px;
        color: #212121;
      }
    }
    :deep(.el-menu-item[data-index="logout"]) {
      position: absolute;
      bottom: 0;
      width: 100%;
      border-top: 1px solid #eee;
      transition: all 0.3s ease;

      &:hover {
        background-color: #fff5f5 !important;

        span {
          color: #ff4d4f !important;
          font-weight: 500;
        }

        .el-icon {
          animation: shake 0.5s ease;
        }
      }
    }
    .user-center-menu {
      border-right: none;

      :deep(.el-menu-item) {
        height: 56px;
        display: flex;
        align-items: center;
        font-size: 14px;
        color: #616161;

        &.is-active {
          color: #00a1d6;
          background: #f5fbff;
        }

        .el-icon {
          margin-right: 12px;
          font-size: 18px;
        }
      }
    }
  }

  .content-main {
    flex: 1;
    padding: 30px;

    .form-card {
      max-width: 600px;
      margin: 0 auto;

      .avatar-uploader {
        text-align: center;
        margin-bottom: 30px;

        .avatar-upload {
          position: relative;
          display: inline-block;

          .upload-mask {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            border-radius: 50%;
            opacity: 0;
            transition: opacity 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;

            .el-icon {
              font-size: 24px;
            }
          }

          &:hover .upload-mask {
            opacity: 1;
          }
        }

        .upload-tip {
          margin-top: 10px;
          color: #999;
          font-size: 14px;
        }
      }

      .submit-btn {
        margin-left: 20px;
      }

      :deep(.el-form-item__label) {
        color: #666;
      }
    }

    .history-section {
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 0 10px;

        h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }
      }

      .video-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        padding: 10px;

        .video-item {
          margin-bottom: 0;
        }
      }

      .pagination-wrapper {
        margin-top: 30px;
        display: flex;
        justify-content: center;
      }
    }
  }
}

@media (max-width: 768px) {
  .user-center-container {
    flex-direction: column;

    .nav-sidebar {
      width: 100%;
      border-right: none;
    }

    .content-main {
      padding: 20px;
    }
  }

  .video-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}

@media (max-width: 480px) {
  .video-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
