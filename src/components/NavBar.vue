<template>
  <nav class="navbar">
    <!-- 左侧Logo -->
    <router-link to="/" class="logo-link">
      <div class="logo">🏓 PingPong</div>
    </router-link>

    <!-- 中间搜索栏 -->
    <div class="search-container">
      <div class="search-box">
        <input
          type="text"
          placeholder="搜索乒乓球技术..."
          class="search-input"
          @keyup.enter="handleSearch"
          ref="searchInput"
        >
        <button class="search-button" @click="handleSearch">搜索</button>
      </div>
    </div>

    <!-- 右侧菜单 -->
    <div class="right-menu">
      <router-link to="/usercenter" class="menu-item">
        <img :src="currentUser?.avatar" class="avatar" alt="头像">
      </router-link>
      <router-link to="/notifications" class="menu-item">
        <span class="icon">🔔</span>
        <span class="text">消息</span>
      </router-link>
      <router-link to="/Article" class="menu-item">
        <span class="icon">📜</span>
        <span class="text">投稿</span>
      </router-link>
      <router-link to="/upload" class="menu-item">
        <span class="icon">🎥</span>
        <span class="text">上传</span>
      </router-link>

    </div>
  </nav>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)
const router = useRouter()
const searchInput = ref<HTMLInputElement>()

const handleSearch = () => {
  const query = searchInput.value?.value.trim()
  if (!query) {
    // 可以添加空值提示
    return
  }

  // 导航到搜索结果页
  router.push({
    path: '/Search',
    query: { q: query }
  })

  if (searchInput.value) {
    searchInput.value.value = ''
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 60px;
  width: 100%;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 37px 0 20px; /* 调整右侧padding预留滚动条空间 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  gap: 20px;
  position: fixed; /* 关键点：为子元素定位提供基准 */

  /* 左侧Logo */
  .logo-link {
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #00aeec;
      white-space: nowrap;
      transition: transform 0.2s;
      &:hover {
        transform: scale(1.05);
      }
    }
  }

  /* 搜索容器 (关键修改) */
  .search-container {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: min(600px, 60%);

    .search-box {
      width: 100%;
      display: flex;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);

      .search-input {
        flex: 1;
        padding: 8px 20px;
        border: none;
        border-radius: 20px 0 0 20px;
        font-size: 14px;
        &:focus {
          outline: none;
          box-shadow: 0 0 0 2px #00aeec33;
        }
      }

      .search-button {
        padding: 8px 25px;
        background: #00aeec;
        color: white;
        border: none;
        border-radius: 0 20px 20px 0;
        cursor: pointer;
        transition: background 0.2s;
        &:hover {
          background: darken(#00aeec, 10%);
        }
      }
    }
  }

  /* 右侧菜单 */
  .right-menu {
    margin-left: 78%;
    display: flex;
    align-items: center;
    gap: 25px;

    .menu-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: #666;
      transition: all 0.2s;

      &:hover {
        color: #00aeec;
        transform: translateY(-2px);
      }

      .icon {
        font-size: 20px;
        margin-bottom: 2px;
      }

      .text {
        font-size: 12px;
        font-weight: 500;
      }
    }

    .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #eee;
      transition: border-color 0.2s;

      &:hover {
        border-color: #00aeec;
      }
    }
  }

  /* 移动端适配 */
  @media (max-width: 768px) {
    padding: 0 27px 0 10px;
    gap: 10px;

    .logo-link .logo {
      font-size: 20px;
    }

    .search-container {
      width: min(400px, 70%);
      .search-box {
        .search-input {
          padding: 8px 15px;
        }
        .search-button {
          padding: 8px 15px;
        }
      }
    }

    .right-menu {
      gap: 15px;
      .text {
        display: none;
      }
      .avatar {
        width: 28px;
        height: 28px;
      }
    }
  }
}
</style>
