<template>
  <div class="upload-container">
    <form @submit.prevent="submitForm">
      <!-- 标题和描述 -->
      <div class="form-section">
        <label>标题</label>
        <input v-model="form.title" required />
      </div>

      <div class="form-section">
        <label>描述</label>
        <textarea v-model="form.description"></textarea>
      </div>

      <!-- 标签选择 -->
      <div class="form-section">
        <label>选择标签（最多5个）</label>
        <TagSelector
          v-model:selected-tags="form.tagIds"
          :max="5"
        />
      </div>

      <!-- 文件上传 -->
      <div class="form-section">
        <label>主文件</label>
        <FileUploader
          :accept="form.type === 'video' ? 'video/*' : 'text/*'"
          :max-size="form.type === 'video' ? 500 : 10"
          v-model="form.contentFile"
          @file-change="handleVideoUpload"
        />
      </div>

      <!-- 封面预览和上传 -->
      <div class="form-section">
        <label>封面图片</label>
        <div v-if="coverPreviewUrl" class="preview-container">
          <img :src="coverPreviewUrl" class="cover-preview" />
          <button type="button" @click="regenerateCover" class="regen-btn">
            重新生成
          </button>
        </div>
        <FileUploader
          accept="image/*"
          :max-size="5"
          v-model="form.coverImage"
          @file-change="handleManualCover"
        />
        <div v-if="coverGenerating" class="loading">生成封面中...</div>
      </div>

      <!-- 提交和状态 -->
      <button type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '上传中...' : '提交' }}
      </button>
      <ProgressBar :progress="uploadProgress" v-if="uploadProgress > 0" />
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUploadStore } from '@/stores/upload.ts'
import TagSelector from '@/components/TagSelector.vue'
import FileUploader from '@/components/FileUploader.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import type { ContentUploadForm } from '@/types/content'
import { useNavStore } from '@/stores/TagStore'
import {ElMessage} from "element-plus";
const navStore = useNavStore()
onMounted(() => {
  navStore.fetchTags()
})
const MAX_WIDTH = 1280
const MAX_HEIGHT = 720
const COVER_QUALITY = 0.8

// 修改点1：明确定义tagIds为number[]
const form = ref<ContentUploadForm>({
  title: '',
  description: '',
  type: 'video',
  contentFile: null,
  coverImage: null,
  tagIds: [] // 明确为数字数组
})

const uploadStore = useUploadStore()
const isSubmitting = ref(false)
const uploadProgress = ref(0)
const errorMessage = ref<string | null>(null)
const coverPreviewUrl = ref<string | null>(null)
const coverGenerating = ref(false)

const validateForm = (): boolean => {
  errorMessage.value = null

  // 修改点2：添加标签类型校验
  if (form.value.tagIds.some(id => typeof id !== 'number')) {
    errorMessage.value = '标签数据格式错误'
    return false
  }

  if (!form.value.contentFile) {
    errorMessage.value = '请选择要上传的文件'
    return false
  }
  if (form.value.tagIds.length > 5) {
    errorMessage.value = '最多选择5个标签'
    return false
  }
  if (form.value.title.length > 100) {
    errorMessage.value = '标题不能超过100字'
    return false
  }
  return true
}


const handleVideoUpload = async (file: File | null) => {
  if (file && form.value.type === 'video') {

    coverGenerating.value = true
    try {
      const { coverUrl, coverFile } = await generateVideoCover(file)
      coverPreviewUrl.value = coverUrl
      form.value.coverImage = coverFile
    } catch (error) {
      console.error('生成封面失败:', error)
      errorMessage.value = '自动封面生成失败，请手动上传'
    } finally {
      coverGenerating.value = false
    }
  }
}

const generateVideoCover = (file: File): Promise<{ coverUrl: string; coverFile: File }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    video.preload = 'metadata'
    video.src = URL.createObjectURL(file)

    video.addEventListener('loadeddata', () => {
      video.currentTime = Math.min(0.1, video.duration)
    })

    video.addEventListener('seeked', () => {
      try {
        // 计算缩放尺寸
        let width = video.videoWidth
        let height = video.videoHeight
        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
          width = width * ratio
          height = height * ratio
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(video, 0, 0, width, height)

        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('无法生成封面图'))
            return
          }

          const previewUrl = URL.createObjectURL(blob)
          const coverFile = new File([blob], `cover_${Date.now()}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now()
          })

          resolve({ coverUrl: previewUrl, coverFile })
          URL.revokeObjectURL(video.src)
        }, 'image/jpeg', COVER_QUALITY)
      } catch (error) {
        reject(error)
      }
    })

    video.addEventListener('error', (error) => {
      reject(error)
      URL.revokeObjectURL(video.src)
    })
  })
}

const regenerateCover = async () => {
  if (form.value.contentFile) {
    await handleVideoUpload(form.value.contentFile)
  }
}

const handleManualCover = (file: File | null) => {
  if (file) {
    coverPreviewUrl.value = URL.createObjectURL(file)
  } else {
    coverPreviewUrl.value = null
  }
}

const submitForm = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  uploadProgress.value = 0

  try {
    if (form.value.type === 'video' && !form.value.coverImage) {
      await regenerateCover()
    }

    const formData = new FormData()

    // 修改点3：确保数值类型
    const dto = {
      title: form.value.title,
      description: form.value.description,
      type: form.value.type.toUpperCase(),
      tagIds: form.value.tagIds.map(Number) // 双重类型转换保障
    }

    formData.append('dto', new Blob([JSON.stringify(dto)], {
      type: 'application/json'
    }))

    formData.append('contentFile', form.value.contentFile as File)
    if (form.value.coverImage) {
      formData.append('coverImage', form.value.coverImage as File)
    }

    const contentId = await uploadStore.uploadContent(
      formData,
      (progress) => (uploadProgress.value = progress)
    )

    // 显示成功提示
    ElMessage.success({
      message: '上传成功',
      duration: 2000
    })
    resetForm()
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

const resetForm = () => {
  form.value = {
    title: '',
    description: '',
    type: 'video',
    contentFile: null,
    coverImage: null,
    tagIds: []
  }
  coverPreviewUrl.value = null
}
</script>

<style scoped>
.upload-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 1.5rem;

}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

input, textarea, select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.preview-container {
  position: relative;
  margin: 1rem 0;
}

.cover-preview {
  max-width: 100%;
  height: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  display: block;
}

.regen-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.regen-btn:hover {
  opacity: 0.9;
}

.error-message {
  color: #dc3545;
  padding: 1rem;
  margin: 1rem 0;
  border: 1px solid #dc3545;
  border-radius: 4px;
  background-color: #f8d7da;
}

.loading {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

button[type="submit"] {
  background: #007bff;
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: opacity 0.2s;
}

button[type="submit"]:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
