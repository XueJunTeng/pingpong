<template>
  <div class="rich-editor">
    <div class="toolbar">
      <button type="button" @click="formatText('bold')"><strong>B</strong></button>
      <button type="button" @click="formatText('italic')"><em>I</em></button>
      <button type="button" @click="insertImage">📷</button>
    </div>
    <div
      class="editor-content"
      contenteditable
      @input="handleInput"
      @paste="handlePaste"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

const formatText = (style: string) => {
  document.execCommand(style)
}

const insertImage = () => {
  const url = prompt('输入图片URL')
  if (url) {
    document.execCommand('insertImage', false, url)
  }
}

const handleInput = (e: Event) => {
  const html = (e.target as HTMLElement).innerHTML
  emit('update:modelValue', html)
}

const handlePaste = (e: ClipboardEvent) => {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

watch(() => props.modelValue, (newVal) => {
  const editor = document.querySelector('.editor-content') as HTMLElement
  if (editor.innerHTML !== newVal) {
    editor.innerHTML = newVal
  }
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
}

.toolbar {
  padding: 0.5rem;
  border-bottom: 1px solid #ddd;
  background: #f8f9fa;
}

.toolbar button {
  margin-right: 0.5rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
}

.editor-content {
  min-height: 200px;
  padding: 1rem;
  overflow-y: auto;
}

.editor-content:focus {
  outline: none;
}
</style>