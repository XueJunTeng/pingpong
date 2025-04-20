<template>
  <div class="comment-section">
    <div class="comment-input">
      <textarea
        v-model="newComment"
        placeholder="发个友善的评论吧~"
        :disabled="isSubmitting"
      ></textarea>
      <button
        @click="submitComment"
        :disabled="!newComment.trim() || isSubmitting"
      >
        {{ isSubmitting ? '提交中...' : '发表评论' }}
      </button>
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>

    <div class="comment-list">
      <div v-if="isLoading" class="loading-state">
        <span class="loader"></span> 加载评论中...
      </div>

      <template v-else>
        <div
          v-for="comment in comments"
          :key="comment.commentId"
          class="comment-item"
        >
          <div class="comment-main">
            <div class="avatar"></div>
            <div class="content">
              <div class="username">{{ comment.username }}</div>
              <div class="text">{{ comment.content }}</div>
              <div class="meta">
                <span>{{ formatTime(comment.createTime) }}</span>
                <button
                  @click="toggleReply(comment.commentId)"
                  :disabled="isSubmitting"
                >
                  {{ activeReply === comment.commentId ? '取消回复' : '回复' }}
                </button>
              </div>
            </div>
          </div>

          <transition name="fade">
            <div
              v-if="activeReply === comment.commentId"
              class="reply-input"
            >
              <textarea
                v-model="replyContent"
                placeholder="写下你的回复..."
                :disabled="isSubmitting"
              ></textarea>
              <div class="action-buttons">
                <button
                  @click="submitReply(comment.commentId)"
                  :disabled="!replyContent.trim() || isSubmitting"
                >
                  {{ isSubmitting ? '提交中...' : '提交回复' }}
                </button>
                <button @click="cancelReply">取消</button>
              </div>
            </div>
          </transition>

          <div
            v-if="comment.replies.length"
            class="replies"
          >
            <div
              v-for="reply in comment.replies"
              :key="reply.commentId"
              class="reply-item"
            >
              <div class="comment-main">
                <div class="avatar small"></div>
                <div class="content">
                  <div class="username">@{{ reply.username }}</div>
                  <div class="text">{{ reply.content }}</div>
                  <div class="meta">
                    <span>{{ formatTime(reply.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { format } from 'date-fns'
import { useCommentStore } from '@/stores/CommentStore'

const route = useRoute()
const commentStore = useCommentStore()

// Store 状态解构
const { comments, error, isLoading } = storeToRefs(commentStore)
const { fetchComments, addComment } = commentStore

// 组件状态
const contentId = computed(() => Number(route.params.contentId))
const newComment = ref('')
const replyContent = ref('')
const activeReply = ref<number | null>(null)
const isSubmitting = ref(false)

// 生命周期
onMounted(async () => {
  await fetchComments(contentId.value)
})

// 时间格式化
const formatTime = (timeStr: string) => {
  try {
    return format(new Date(timeStr), 'yyyy-MM-dd HH:mm')
  } catch {
    return '未知时间'
  }
}

// 主评论提交
const submitComment = async () => {
  if (!newComment.value.trim()) return

  try {
    isSubmitting.value = true
    await addComment(newComment.value.trim(), contentId.value)
    newComment.value = ''
  } finally {
    isSubmitting.value = false
  }
}

// 回复提交
const submitReply = async (parentId: number) => {
  if (!replyContent.value.trim()) return

  try {
    isSubmitting.value = true
    await addComment(replyContent.value.trim(), contentId.value, parentId)
    replyContent.value = ''
    activeReply.value = null
  } finally {
    isSubmitting.value = false
  }
}

// 回复控制
const toggleReply = (commentId: number) => {
  activeReply.value = activeReply.value === commentId ? null : commentId
}

const cancelReply = () => {
  activeReply.value = null
  replyContent.value = ''
}
</script>

<style scoped>
.comment-section {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f4f5f6;
  border-radius: 4px;
}

.comment-input textarea {
  width: 100%;
  height: 100px;
  padding: 12px;
  border: 1px solid #e7e7e7;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
}

.comment-input textarea:focus {
  border-color: #00a1d6;
  outline: none;
}

button {
  margin-top: 10px;
  padding: 8px 16px;
  background: #00a1d6;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

button:disabled {
  background: #b8d5e5;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background: #0092c4;
}

.error-message {
  color: #f25d8e;
  margin-top: 8px;
  font-size: 12px;
}

.loading-state {
  color: #999;
  font-size: 14px;
}

.loader {
  border-color: #ddd;
  border-top-color: #00a1d6;
}

.comment-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e7e7e7;
  overflow: hidden;
}

.avatar::after {
  content: '';
  display: block;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTBDMjYuOSAxMCA4IDI4LjkgOCA1MnMxOC45IDQyIDQyIDQyIDQyLTE4LjkgNDItNDJTNzMuMSAxMCA1MCAxMHptMCA2MGMtMTEuNiAwLTIxLTkuNC0yMS0yMXM5LjQtMjEgMjEtMjEgMjEgOS40IDIxIDIxLTkuNCAyMS0yMSAyMXptMjItMjljMCA2LjEtNC45IDExLTExIDExcy0xMS00LjktMTEtMTEgNC45LTExIDExLTExIDExIDQuOSAxMSAxMXoiIGZpbGw9IiNjY2MiLz48L3N2Zz4=') center/cover;
}

.username {
  font-weight: 500;
  color: #212121;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.username::after {
  content: 'Lv6';
  background: #fb7299;
  color: #fff;
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 4px;
}

.text {
  color: #212121;
  font-size: 14px;
  line-height: 1.5;
  margin: 8px 0;
}

.meta {
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta button {
  padding: 2px 8px;
  background: none;
  color: #00a1d6;
  font-size: 12px;
}

.meta button:hover {
  background: rgba(0,161,214,.1);
}

.reply-input {
  margin: 12px 0 0 40px;
  padding-left: 12px;
  border-left: 2px solid #00a1d6;
}

.reply-input textarea {
  height: 80px;
  font-size: 13px;
}

.replies {
  margin: 12px 0 0 40px;
  border-left: 2px solid #eee;
}

.reply-item {
  padding: 12px;
  margin: 8px 0;
  background: #f8f9fa;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-buttons button:last-child {
  background: #f4f5f6;
  color: #666;
}

.action-buttons button:last-child:hover {
  background: #eee;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>