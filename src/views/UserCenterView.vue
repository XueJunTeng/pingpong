<template>
  <div class="user-center-container">
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
            ref="usernameForm"
            :model="userInfo"
            :rules="usernameRules"
            label-width="100px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userInfo.username"
                placeholder="请输入新用户名"
                clearable
              />
              <el-button
                type="primary"
                class="submit-btn"
                @click="updateUsername"
              >
                修改用户名
              </el-button>
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
  username: authStore.currentUser?.username || ''
})

// 密码表单
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const usernameRules = {
  username: [
    { required: true, message: '用户名不能为空', trigger: 'blur' },
    { min: 2, max: 16, message: '长度在2到16个字符', trigger: 'blur' }
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

// 用户名更新
const updateUsername = async () => {
  try {
    await authStore.updateProfile({ username: userInfo.username })
    ElMessage.success('用户名修改成功')
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
    // 清空旧数据
    historyStore.clearHistory()

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
  activeTab.value = key
  if (key.startsWith('history')) {
    currentPage.value = 1 // 切换分类时重置页码
    loadHistoryData()
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
.user-center-container {
  display: flex;
  max-width: 1200px;
  margin: 20px auto;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);

  .nav-sidebar {
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
