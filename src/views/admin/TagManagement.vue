<template>
  <div class="management-container">
    <!-- 加载状态提示 -->
    <el-alert
      v-if="tagStore.isLoading"
      title="数据加载中..."
      type="info"
      :closable="false"
      show-icon
    />

    <!-- 错误提示 -->
    <el-alert
      v-if="tagStore.error"
      :title="tagStore.error"
      type="error"
      show-icon
      @close="tagStore.error = null"
    />

    <div class="header">
      <h2>标签管理</h2>
      <div class="actions">
        <el-input
          v-model="searchParams.keyword"
          placeholder="搜索标签..."
          style="width: 300px"
          clearable
          @change="handleSearch"
        />
        <el-button type="primary" @click="openCreateDialog">新建标签</el-button>
        <el-button
          type="danger"
          :disabled="selectedTags.length === 0"
          @click="batchDeleteTags"
        >
          批量删除
        </el-button>
      </div>
    </div>

    <!-- 标签表格 -->
    <el-table
      :data="tagStore.tagList"
      border
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="tagName" label="标签名称" />
      <el-table-column prop="usageCount" label="使用次数" width="120" align="center">
        <template #default="{ row }">
          <span class="usage-count">{{ row.usageCount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="weight" label="权重" width="150">
        <template #default="{ row }">
          <div class="weight-control">
            <el-input-number
              v-model="row.weight"
              :min="0"
              :max="9999"
              controls-position="right"
              @change="(val) => updateWeight(row, val)"
            />
          </div>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="deleteTag(row.tagId)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      v-model:current-page="currentPage"
      :page-size="tagStore.currentPagination.pageSize"
      :total="tagStore.currentPagination.total"
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[10, 20, 50, 100]"
      class="pagination"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
    />

    <!-- 新建对话框 -->
    <el-dialog v-model="dialogVisible" title="新建标签" width="500px">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="标签名称" prop="tagName">
          <el-input
            v-model="formData.tagName"
            placeholder="请输入标签名称"
          />
        </el-form-item>
        <el-form-item label="权重" prop="weight">
          <el-input-number
            v-model="formData.weight"
            :min="0"
            :max="9999"
            :step="1"
            controls-position="right"
            style="width: 200px"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createTag">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTagStore } from '@/stores/TagStore'
import type { Tag } from '@/stores/TagStore'

const tagStore = useTagStore()

// 初始化加载数据
onMounted(() => {
  tagStore.fetchTags()
})

// 搜索参数
const searchParams = ref({
  keyword: ''
})

// 分页控制
const currentPage = computed({
  get: () => tagStore.currentPagination.page,
  set: (val) => {
    tagStore.currentPagination.page = val
    tagStore.fetchTags()
  }
})

// 对话框控制
const dialogVisible = ref(false)
const formRef = ref()
const formData = ref({
  tagName: '',
  weight: 1 // 默认权重值
})

// 表单验证规则
const formRules = {
  tagName: [
    { required: true, message: '请输入标签名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在2到20个字符', trigger: 'blur' }
  ],
  weight: [
    { required: true, message: '请输入权重值', trigger: 'blur' },
    {
      type: 'number',
      min: 0,
      max: 9999,
      message: '权重值需在0-9999之间',
      trigger: 'blur'
    }
  ]
}

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page
}

const handleSizeChange = (size: number) => {
  tagStore.currentPagination.pageSize = size
  tagStore.fetchTags()
}

// 搜索处理
const handleSearch = () => {
  tagStore.updateSearchKeyword(searchParams.value.keyword)
  tagStore.currentPagination.page = 1
  tagStore.fetchTags()
}

// 打开创建对话框
const openCreateDialog = () => {
  formData.value = { tagName: '', weight: 1 }
  dialogVisible.value = true
}

// 创建标签
const createTag = async () => {
  try {
    console.log('提交数据:', JSON.stringify(formData.value)) // 关键调试点
    await formRef.value.validate()
    await tagStore.createTag(
      formData.value.tagName,
      formData.value.weight
  )
    ElMessage.success('标签创建成功')
    dialogVisible.value = false
  } catch (error) {
    console.error('创建失败:', error)
  }
}

// 删除标签
const deleteTag = async (tagId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该标签吗？', '警告', {
      type: 'warning'
    })
    await tagStore.deleteTag(tagId)
    ElMessage.success('标签删除成功')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除操作失败')
    }
  }
}

// 批量删除
const selectedTags = ref<number[]>([])
const handleSelectionChange = (selection: Tag[]) => {
  selectedTags.value = selection.map(tag => tag.tagId)
}

const batchDeleteTags = async () => {
  if (selectedTags.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的${selectedTags.value.length}个标签吗？`,
      '警告',
      { type: 'warning' }
    )
    await tagStore.batchDeleteTags(selectedTags.value)
    ElMessage.success('批量删除成功')
    selectedTags.value = []
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 更新权重
const updateWeight = async (tag: Tag, newWeight: number) => {
  try {
    await tagStore.updateTagWeight(tag.tagId, newWeight)
    ElMessage.success('权重更新成功')
  } catch (error) {
    ElMessage.error('权重更新失败')
    tag.weight = tag._prevWeight // 回滚值
  }
}
</script>

<style scoped>
.management-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
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

.el-table {
  margin-top: 16px;
}

.weight-control {
  display: flex;
  align-items: center;
  gap: 8px;

  :deep(.el-input-number) {
    width: 120px;

    .el-input__inner {
      text-align: center;
    }
  }
}

.usage-count {
  font-weight: 500;
  color: #666;
}
</style>
