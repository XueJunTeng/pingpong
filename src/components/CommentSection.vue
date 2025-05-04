<template>
  <div class="comment-section">
    <div class="comment-input">
      <div class="current-user-avatar">
        <img :src="currentUser.avatar" alt="用户头像" v-if="currentUser?.avatar">
        <div class="default-avatar" v-else></div>
      </div>
      <div class="input-area">
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
            <!-- 头像 -->
            <div class="avatar">
              <img
                :src="comment.avatarUrl"
                v-if="comment.avatarUrl"
                :alt="comment.username"
              >
              <div v-else class="default-avatar"></div>
            </div>

            <!-- 内容区域 -->
            <div class="content">
              <div class="user-info">
                <span class="username">{{ comment.username }}</span>
                <span v-if="comment.isAuthor" class="author-tag">作者</span>
              </div>
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
                <div class="avatar small">
                  <img
                    :src="reply.avatarUrl"
                    v-if="reply.avatarUrl"
                    :alt="reply.username"
                  >
                  <div v-else class="default-avatar"></div>
                </div>
                <div class="content">
                  <div class="user-info">
                    <span class="username">@{{ reply.username }}</span>
                    <span v-if="reply.isAuthor" class="author-tag">作者</span>
                  </div>
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
import { useAuthStore } from '@/stores/auth.ts'

const route = useRoute()
const commentStore = useCommentStore()
const authStore = useAuthStore()
const { currentUser } = storeToRefs(authStore)

const { comments, error, isLoading } = storeToRefs(commentStore)
const { fetchComments, addComment } = commentStore

const contentId = computed(() => Number(route.params.contentId))
const newComment = ref('')
const replyContent = ref('')
const activeReply = ref<number | null>(null)
const isSubmitting = ref(false)

onMounted(async () => {
  await fetchComments(contentId.value)
})

const formatTime = (timeStr: string) => {
  try {
    return format(new Date(timeStr), 'yyyy-MM-dd HH:mm')
  } catch {
    return '未知时间'
  }
}

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

.comment-input {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.current-user-avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.current-user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.default-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e7e7e7 url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAgMTBDMjYuOSAxMCA4IDI4LjkgOCA1MnMxOC45IDQyIDQyIDQyIDQyLTE4LjkgNDItNDJTNzMuMSAxMCA1MCAxMHptMCA2MGMtMTEuNiAwLTIxLTkuNC0yMS0yMXM5LjQtMjEgMjEtMjEgMjEgOS40IDIxIDIxLTkuNCAyMS0yMSAyMXptMjItMjljMCA2LjEtNC45IDExLTExIDExcy0xMS00LjktMTEtMTEgNC45LTExIDExLTExIDExIDQuOSAxMSAxMXoiIGZpbGw9IiNjY2MiLz48L3N2Zz4=') center/60% no-repeat;
}

.input-area {
  flex: 1;
}

.comment-input textarea {
  width: 97%;
  height: 100px;
  padding: 12px;
  border: 1px solid #e7e7e7;
  border-radius: 4px;
  background: #fff;
  font-size: 14px;
  resize: vertical;
  transition: border-color 0.2s;
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

.comment-item {
  margin-bottom: 16px;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.comment-main {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.avatar {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar.small {
  width: 32px;
  height: 32px;
}

.content {
  flex: 1;
  min-width: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.username {
  font-weight: 500;
  color: #212121;
  font-size: 14px;
}

.author-tag {
  background: #00a1d6;
  color: white;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
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
  margin-top: 8px;
}

.reply-input {
  margin: 12px 0 0 52px;
  padding-left: 12px;
  border-left: 2px solid #00a1d6;
}

.replies {
  margin: 12px 0 0 52px;
  border-left: 2px solid #eee;
}

.reply-item {
  padding: 12px;
  margin: 8px 0;
  background: #f8f9fa;
  border-radius: 4px;
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

.loading-state {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.error-message {
  color: #f25d8e;
  margin-top: 8px;
  font-size: 12px;
}
</style>
