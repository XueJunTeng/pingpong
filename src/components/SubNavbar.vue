<!-- src/components/SubNavbar.vue -->
<template>
  <nav class="sub-navbar">
    <div class="nav-container">
      <div class="nav-left">
        <router-link
          to="/articles"
          class="nav-title"
          active-class="active"
        >
          🏓 PingPongPro
        </router-link>
      </div>

      <div class="nav-center">

          📢: 欢迎来到乒乓球技术交流系统：pingpong！

      </div>

      <div class="nav-right">
        <router-link
          to="/articles"
          class="nav-title"
          active-class="active"
        >
          📚 文章
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNavStore } from '@/stores/TagStore'

const router = useRouter()
const selectedTags = ref<number[]>([])
const navStore = useNavStore()

watch(selectedTags, (newVal) => {
  if (newVal.length > 0) {
    const tagId = newVal[0]
    navStore.setActiveByTagId(tagId)
    router.push({
      query: {
        tag: tagId.toString(),
        page: '1'
      }
    })
  }
})

onMounted(() => {
  navStore.fetchTags()
})
</script>

<style scoped>
.sub-navbar {
  background: #fff;
  margin-bottom: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 15px 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 0 20px;
}

.nav-left .nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-right: 30px;
  border-right: 1px solid #eee;
  text-decoration: none;
  display: block;
  transition: color 0.2s;
}

.nav-right .nav-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  padding-left: 30px;
  border-left: 1px solid #eee;
  text-decoration: none;
  display: block;
  transition: color 0.2s;
}

.nav-title:hover {
  color: #00aeec !important;
}

.nav-title.active {
  color: #00aeec !important;
  border-bottom: none;
}

.nav-center {
  flex: 1;
  display: flex;
  gap: 35px;
  overflow-x: auto;
}

.nav-tag {
  font-size: 15px;
  color: #666;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  padding: 8px 0;
}

.nav-tag.active {
  color: #00aeec;
  font-weight: 500;
  border-bottom: 2px solid #00aeec;
}

.nav-tag:hover {
  color: #00aeec;
}

@media (max-width: 768px) {
  .nav-container {
    padding: 0 15px !important;
    gap: 15px !important;
  }

  .nav-center {
    gap: 20px !important;
  }

  .nav-tag {
    font-size: 14px !important;
  }

  .nav-title {
    font-size: 16px !important;
  }
}
</style>
