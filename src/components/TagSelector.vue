<template>
  <div class="tag-selector-container">
    <div class="main-tags">
      <span
        v-for="tag in visibleTags"
        :key="tag.tagId"
        class="nav-tag"
        :class="{ active: selectedTags.includes(tag.tagId) }"
        @click="handleTagClick(tag.tagId)"
      >
        {{ tag.tagName }}
      </span>

      <span
        class="expand-trigger"
        @mouseenter="showDropdown = true"
        @mouseleave="handleTriggerLeave"
      >
        <i class="icon-more" />
        <span class="dropdown-arrow">▼</span>
      </span>
    </div>

    <transition name="fade">
      <div
        v-show="showDropdown"
        ref="dropdownEl"
        class="tag-dropdown"
        @mouseenter="handleDropdownEnter"
        @mouseleave="handleDropdownLeave"
      >
        <div class="dropdown-header">
          <span>所有标签</span>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="搜索标签..."
            @click.stop
          >
        </div>
        <div class="dropdown-tags">
          <span
            v-for="item in filteredTags"
            :key="item.tagId"
            class="dropdown-tag"
            :class="{ active: selectedTags.includes(item.tagId) }"
            @click="handleTagClick(item.tagId)"
          >
            {{ item.tagName }}
          </span>
        </div>
        <div v-if="selectedTags.length >= max" class="max-warning">
          已选择最大数量的标签（{{ max }} 个标签）。
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  ref,
  onMounted,
  onUnmounted,
} from 'vue'
import type { PropType } from 'vue' // [!code ++] 修改点：使用类型导入
import { useNavStore } from '@/stores/TagStore'

const navStore = useNavStore()
const showDropdown = ref(false)
const isHoveringDropdown = ref(false)
const dropdownEl = ref<HTMLElement | null>(null)
const searchQuery = ref('')

// 修改点1：正确定义props和emit
const props = defineProps({
  max: {
    type: Number,
    default: 5
  },
  selectedTags: {
    type: Array as PropType<number[]>, // [!code focus]
    required: true
  }
})

const emit = defineEmits(['update:selectedTags'])

// 修改点2：直接使用props.selectedTags
const visibleTags = computed(() => navStore.tags.slice(0, 10))

const filteredTags = computed(() =>
  navStore.tags.filter(tag =>
    tag.tagName.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

// 修改点3：事件处理逻辑
const handleTagClick = (tagId: number) => {
  let newTags = [...props.selectedTags]

  if (newTags.includes(tagId)) {
    newTags = newTags.filter(id => id !== tagId)
  } else {
    if (newTags.length >= props.max) {
      alert(`最多只能选择 ${props.max} 个标签`)
      return
    }
    newTags.push(tagId)
  }

  emit('update:selectedTags', newTags) // 触发更新事件
}

// 交互处理
const handleDropdownEnter = () => {
  isHoveringDropdown.value = true
  showDropdown.value = true
}

const handleDropdownLeave = () => {
  isHoveringDropdown.value = false
  showDropdown.value = false
}

const handleTriggerLeave = () => {
  setTimeout(() => {
    if (!isHoveringDropdown.value) {
      showDropdown.value = false
    }
  }, 200)
}

// 响应式处理
onMounted(() => {
  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)
})

// 计算下拉框位置
const updatePosition = () => {
  if (!dropdownEl.value) return

  const trigger = document.querySelector('.expand-trigger')
  if (!trigger) return

  const triggerRect = trigger.getBoundingClientRect()
  const dropdown = dropdownEl.value

  dropdown.style.left = `${triggerRect.left + triggerRect.width / 2}px`
  dropdown.style.transform = 'translateX(-50%)'
  dropdown.style.top = `${triggerRect.bottom + 8}px`
}
</script>

<style scoped>
.nav-tag, .dropdown-tag {
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  padding: 6px 12px;
  border-radius: 20px; /* 使标签变为圆形 */
  background-color: #f0f3f7;
  white-space: nowrap; /* 防止标签文字换行 */
}

.nav-tag:hover,
.dropdown-tag:hover {
  background: #00aeec; /* 鼠标悬停时背景变成蓝色 */
  color: white; /* 鼠标悬停时文字颜色变成白色 */
  transform: translateY(-2px);
}

.nav-tag.active,
.dropdown-tag.active {
  color: #00aeec;
  border-bottom: 2px solid #00aeec;
}

.expand-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.dropdown-arrow {
  font-size: 0.8em;
  transition: inherit;
  padding: 8px 0;
}

.dropdown-tag:hover {
  background: #00aeec;
  color: white;
}

.tag-selector-container {
  display: contents;
}

.main-tags {
  display: flex;
  gap: 20px;
  align-items: center;
  position: relative;
  white-space: nowrap;
  overflow-x: auto; /* 如果标签过多，允许横向滚动 */
}

.tag-dropdown {
  position: fixed;
  width: min(900px, 80vw);
  max-height: 60vh;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  z-index: 1000;
  padding: 12px;
  overflow-y: auto;
  transition: opacity 0.2s, transform 0.2s;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  margin-bottom: 12px;
  position: sticky;
  top: 0;
  background: white;
}

.search-input {
  flex: 1;
  max-width: 200px;
  padding: 6px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  outline: none;
  transition: all 0.2s;
  font-size: 14px;
}

.search-input:focus {
  border-color: #00aeec;
  box-shadow: 0 0 0 2px rgba(0, 174, 236, 0.2);
}

.dropdown-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

@media (max-width: 768px) {
  .tag-dropdown {
    width: 95vw;
    left: 2.5vw !important;
    transform: none !important;
    top: 50px !important;
  }

  .dropdown-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
    width: 100%;
  }

  .expand-trigger {
    display: none;
  }
}

.dropdown-tags::-webkit-scrollbar {
  width: 6px;
}

.dropdown-tags::-webkit-scrollbar-thumb {
  background: #00aeec;
  border-radius: 3px;
}

.dropdown-tags::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.max-warning {
  margin-top: 10px;
  font-size: 14px;
  color: red;
}
</style>
