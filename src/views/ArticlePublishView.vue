<template>
  <div class="upload-container">
    <form @submit.prevent="submitForm">
      <!-- 标题 -->
      <div class="form-section">
        <label>文章标题 <span class="required">*</span></label>
        <input
          v-model="form.title"
          placeholder="请输入标题，2~40字"
          class="input-field"
          required
        />
      </div>

      <!-- 富文本编辑器 -->
      <div class="form-section">
        <label>文章内容 <span class="required">*</span></label>
        <RichTextEditor
          v-model="form.description"
          class="editor-container"
          placeholder="在输入正文"
        />
        <div class="word-count">（限制1~100000字以内）字数：{{ descriptionWordCount }}</div>
      </div>

      <!-- 标签选择 -->
      <div class="form-section">
        <label>文章标签 <span class="required">*</span></label>
        <TagSelector
          v-model:selected-tags="form.tagIds"
          :max="5"
          :required="true"
        />
        <div class="hint">请选择1-5个相关标签</div>
      </div>

      <!-- 封面图片 -->
      <div class="form-section">
        <label>封面图片</label>
        <div class="cover-uploader">
          <FileUploader
            accept="image/*"
            :max-size="5"
            v-model="form.coverImage"
            @file-change="handleCoverUpload"
          >
            <template #default="{ openFilePicker }">
              <div
                class="cover-preview-container"
                @click="openFilePicker"
              >
                <div v-if="coverPreviewUrl" class="cover-preview-wrapper">
                  <img :src="coverPreviewUrl" class="cover-preview" />
                  <div class="cover-overlay">
                    <span class="replace-text">更换封面</span>
                  </div>
                </div>
                <div v-else class="upload-prompt">
                  <div class="upload-icon">📷</div>
                  <div class="upload-hint">点击上传封面图片</div>
                  <div class="upload-requirements">支持 JPG/PNG，最大5MB</div>
                </div>
              </div>
            </template>
          </FileUploader>
        </div>
      </div>

      <!-- 提交区域 -->
      <div class="form-actions">
        <button
          type="submit"
          class="submit-button"
          :disabled="isSubmitting || !formValid"
        >
          <span v-if="isSubmitting">
            <span class="loading-icon">⏳</span> 发布中...
          </span>
          <span v-else>立即发布</span>
        </button>

        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useUploadStore } from '@/stores/upload'
import TagSelector from '@/components/TagSelector.vue'
import FileUploader from '@/components/FileUploader.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import type { ContentUploadForm } from '@/types/content'
const uploadStore = useUploadStore()
// 表单数据
const form = ref<ContentUploadForm>({
  title: '',
  description: '',
  type: 'article',
  contentFile: null,
  coverImage: null,
  tagIds: [] // 明确为数字数组
})

// 状态管理
const isSubmitting = ref(false)
const errorMessage = ref<string | null>(null)
const coverPreviewUrl = ref<string | null>(null)

// 计算属性
const descriptionWordCount = computed(() => {
  return form.value.description.replace(/<[^>]+>/g, '').length
})

const formValid = computed(() => {
  return form.value.title.trim().length >= 2 &&
         form.value.description.replace(/<[^>]+>/g, '').length >= 1 &&
         form.value.tagIds.length >= 1
})

// 封面处理
const handleCoverUpload = (file: File | null) => {
  if (file) {
    coverPreviewUrl.value = URL.createObjectURL(file)
  } else {
    coverPreviewUrl.value = null
  }
}

// 自动保存草稿
watch(form, (newVal) => {
  if (!isSubmitting.value) {
    localStorage.setItem('articleDraft', JSON.stringify(newVal))
  }
}, { deep: true, immediate: true })

// 表单验证
const validateForm = (): boolean => {
  errorMessage.value = null

  if (!form.value.title.trim()) {
    errorMessage.value = '请输入文章标题'
    return false
  }

  if (form.value.title.trim().length < 2) {
    errorMessage.value = '标题至少需要2个字符'
    return false
  }

  const contentText = form.value.description.replace(/<[^>]+>/g, '')
  if (contentText.length < 1) {
    errorMessage.value = `内容至少需要1字（当前${contentText.length}字）`
    return false
  }

  if (form.value.tagIds.length < 1) {
    errorMessage.value = '请至少选择一个标签'
    return false
  }

  return true
}

// 提交表单
const submitForm = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  try {
    const formData = new FormData()

    // 构造DTO
    const dto = {
      title: form.value.title.trim(),
      type:form.value.type.toUpperCase(),
      description: form.value.description,
      tagIds: form.value.tagIds
    }

    formData.append('dto', new Blob([JSON.stringify(dto)], {
      type: 'application/json'
    }))

    if (form.value.coverImage) {
      formData.append('coverImage', form.value.coverImage)
    }

    // 调用Store
    const contentId = await uploadStore.uploadContent(formData)

    // 成功处理
    alert(`文章发布成功！ID: ${contentId}`)
    resetForm()
    localStorage.removeItem('articleDraft')

  } catch (error) {
    handleUploadError(error)
  } finally {
    isSubmitting.value = false
  }

}


const handleUploadError = (error: unknown) => {
  errorMessage.value = error instanceof Error ? error.message : '上传失败，请稍后重试'
  setTimeout(() => (errorMessage.value = null), 5000)
}

// 重置表单
const resetForm = () => {
  form.value = {
    title: '',
    description: '', // 重置合并后的字段
    type: 'article',
    tagIds: [],
    coverImage: null
  }
  coverPreviewUrl.value = null
}

// 加载草稿
const loadDraft = () => {
  const draft = localStorage.getItem('articleDraft')
  if (draft) {
    try {
      const parsed = JSON.parse(draft)
      form.value = {
        ...parsed,
        coverImage: null
      }
      if (parsed.coverImage) {
        coverPreviewUrl.value = parsed.coverImage
      }
    } catch (e) {
      console.warn('草稿加载失败:', e)
    }
  }
}

// 初始化加载草稿
loadDraft()
</script>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 2rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.required {
  color: #e74c3c;
  font-size: 0.8em;
  margin-left: 0.3em;
}

.input-field {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.hint {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.editor-container {
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.word-count {
  text-align: right;
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.cover-uploader {
  margin-top: 1rem;
}

.cover-preview-container {
  cursor: pointer;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.cover-preview-container:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.cover-preview-wrapper {
  position: relative;
  aspect-ratio: 16/9;
}

.cover-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.cover-preview-container:hover .cover-overlay {
  opacity: 1;
}

.replace-text {
  color: white;
  font-weight: 500;
}

.upload-prompt {
  padding: 2rem;
  text-align: center;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.3rem;
}

.upload-requirements {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.form-actions {
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  text-align: center;
}

.submit-button {
  background: #27ae60;
  color: white;
  padding: 0.8rem 2rem;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.2);
}

.submit-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error-message {
  margin-top: 1rem;
  padding: 0.8rem;
  background: #fee;
  border: 1px solid #f5a9a9;
  border-radius: 6px;
  color: #c0392b;
  font-size: 0.9rem;
}

.loading-icon {
  display: inline-block;
  margin-right: 0.5rem;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>