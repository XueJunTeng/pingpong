<template>
  <div class="upload-container">
    <form @submit.prevent="submitForm">
      <!-- 标题 -->
      <div class="form-section">
        <label>标题 <span class="required">*</span></label>
        <input
          v-model="form.title"
          placeholder="请输入视频标题"
          class="input-field"
          required
        />
      </div>

      <!-- 描述 -->
      <div class="form-section">
        <label>视频描述 <span class="required">*</span></label>
        <textarea
          v-model="form.description"
          class="input-field"
          placeholder="请输入视频描述"
          rows="4"
        ></textarea>
      </div>

      <!-- 标签选择 -->
      <div class="form-section">
        <label>视频标签 <span class="required">*</span></label>
        <TagSelector
          v-model:selected-tags="form.tagIds"
          :max="5"
          :required="true"
        />
        <div class="hint">请选择1-5个相关标签</div>
      </div>

      <!-- 主文件上传 -->
      <div class="form-section">
        <label>视频文件 <span class="required">*</span></label>
        <FileUploader
          :accept="form.type === 'video' ? 'video/*' : 'text/*'"
          :max-size="form.type === 'video' ? 500 : 10"
          v-model="form.contentFile"
          @file-change="handleVideoUpload"
        >
          <template #default="{ openFilePicker }">
            <div class="upload-prompt" @click="openFilePicker">
              <div class="upload-icon">📼</div>
              <div class="upload-hint">点击上传视频文件</div>
              <div class="upload-requirements">支持 MP4/AVI，最大500MB</div>
            </div>
          </template>
        </FileUploader>
      </div>

      <!-- 封面图片 -->
      <div class="form-section">
        <label>封面图片</label>
        <div class="cover-uploader">
          <FileUploader
            accept="image/*"
            :max-size="5"
            v-model="form.coverImage"
            @file-change="handleManualCover"
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
                  <div class="upload-icon">🖼️</div>
                  <div class="upload-hint">点击上传封面图片</div>
                  <div class="upload-requirements">支持 JPG/PNG，最大5MB</div>
                </div>
              </div>
            </template>
          </FileUploader>
          <div v-if="coverGenerating" class="loading">
            <span class="loading-icon">⏳</span> 生成封面中...
          </div>
        </div>
      </div>

      <!-- 提交区域 -->
      <div class="form-actions">
        <button
          type="submit"
          class="submit-button"
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">
            <span class="loading-icon">⏳</span> 上传中...
          </span>
          <span v-else>立即发布</span>
        </button>
        <ProgressBar
          :progress="uploadProgress"
          v-if="uploadProgress > 0"
          class="progress-bar"
        />
        <div v-if="errorMessage" class="error-message">
          ⚠️ {{ errorMessage }}
        </div>
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
.upload-prompt {
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  border: 2px dashed #ddd;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.upload-prompt:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.upload-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  margin-top: 1rem;
}

.hint {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
}

.loading {
  color: #7f8c8d;
  padding: 0.8rem;
  text-align: center;
  margin-top: 1rem;
}
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

input,
textarea,
select {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.preview-container {
  position: relative;
  margin: 1rem 0;
  border: 2px dashed #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.preview-container:hover {
  border-color: #3498db;
  background: #f8f9fa;
}

.cover-preview {
  width: 100%;
  height: auto;
  object-fit: cover;
  aspect-ratio: 16/9;
}

.regen-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  padding: 0.5rem 1rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.form-actions {
  margin-top: 2rem;
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  text-align: center;
}

button[type="submit"] {
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

button[type="submit"]:hover:not(:disabled) {
  background: #219a52;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(39, 174, 96, 0.2);
}

button[type="submit"]:disabled {
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

.loading {
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.upload-requirements {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 0.5rem;
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
