<template>
  <div class="rich-editor">
    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- 字体选择 -->
      <select class="font-select" @change="changeFont($event)">
        <option value="">字体</option>
        <option value="SimSun">宋体</option>
        <option value="Microsoft YaHei">微软雅黑</option>
        <option value="Arial">Arial</option>
      </select>

      <!-- 字号选择 -->
      <select class="size-select" @change="changeFontSize($event)">
        <option value="">字号</option>
        <option value="1">12px</option>
        <option value="2">14px</option>
        <option value="3">16px</option>
        <option value="4">18px</option>
      </select>

      <!-- 文字颜色 -->
      <input type="color" @input="changeTextColor($event)">

      <!-- 基础格式 -->
      <button type="button" @click="formatText('bold')"><strong>B</strong></button>
      <button type="button" @click="formatText('italic')"><em>I</em></button>
      <button type="button" @click="formatText('underline')"><u>U</u></button>

      <!-- 对齐方式 -->
      <button @click="setAlignment('left')">↙</button>
      <button @click="setAlignment('center')">↔</button>
      <button @click="setAlignment('right')">↘</button>
      <button @click="setAlignment('justify')">⇆</button>

      <!-- 列表功能 -->
      <button @click="insertList('unordered')">•</button>
      <button @click="insertList('ordered')">1.</button>

      <!-- 历史记录 -->
      <button @click="undo">↩</button>
      <button @click="redo">↪</button>
    </div>

    <!-- 编辑区域 -->
    <div
      class="editor-content"
      contenteditable
      @input="handleInput"
      @paste="handlePaste"
      @mouseup="updateToolbarStatus"
      @keyup="updateToolbarStatus"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted } from 'vue'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits(['update:modelValue'])

// 初始化内容
onMounted(() => {
  const editor = document.querySelector('.editor-content') as HTMLElement
  editor.innerHTML = props.modelValue
})

// 格式操作
const formatText = (style: string) => {
  document.execCommand(style)
}

// 字体选择
const changeFont = (event: Event) => {
  const font = (event.target as HTMLSelectElement).value
  document.execCommand('fontName', false, font)
}

// 字号调整（兼容性处理）
const changeFontSize = (event: Event) => {
  const size = (event.target as HTMLSelectElement).value
  document.execCommand('fontSize', false, size)
}

// 文字颜色
const changeTextColor = (event: Event) => {
  const color = (event.target as HTMLInputElement).value
  document.execCommand('foreColor', false, color)
}

// 对齐方式
const setAlignment = (align: string) => {
  document.execCommand(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`)
}

// 列表功能
const insertList = (type: 'ordered' | 'unordered') => {
  document.execCommand(type === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList')
}

// 历史操作
const undo = () => document.execCommand('undo')
const redo = () => document.execCommand('redo')

// 输入同步
const handleInput = (event: Event) => {
  const html = (event.target as HTMLElement).innerHTML
  emit('update:modelValue', html)
}

// 粘贴处理
const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

// 工具栏状态更新
const updateToolbarStatus = () => {
  const selection = document.getSelection()
  if (!selection?.rangeCount) return

  const element = selection.focusNode?.parentElement

  // 更新字体选择
  const fontSelect = document.querySelector('.font-select') as HTMLSelectElement
  if (element) fontSelect.value = getComputedStyle(element).fontFamily.replace(/"/g, '')

  // 更新字号选择
  const sizeSelect = document.querySelector('.size-select') as HTMLSelectElement
  if (element) {
    const fontSize = parseInt(getComputedStyle(element).fontSize)
    sizeSelect.value = Math.floor(fontSize / 2 - 5).toString() // 转换为传统字号值
  }
}

// 内容同步
watch(() => props.modelValue, (newVal) => {
  const editor = document.querySelector('.editor-content') as HTMLElement
  if (editor.innerHTML !== newVal) {
    editor.innerHTML = newVal
  }
})
</script>

<style scoped>
.rich-editor {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  max-width: 800px;
  margin: 20px auto;
  background: white;
}

.toolbar {
  padding: 12px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

select, button, input[type="color"] {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  height: 32px;
}

button {
  min-width: 32px;
}

select:hover,
button:hover,
input[type="color"]:hover {
  background: #f3f4f6;
  border-color: #ccc;
}

input[type="color"] {
  padding: 2px;
  width: 32px;
  height: 32px;
}

.editor-content {
  min-height: 300px;
  padding: 16px;
  line-height: 1.6;
  overflow-y: auto;
}

.editor-content:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px #3b82f6;
}

/* 自定义列表样式 */
.editor-content ul,
.editor-content ol {
  padding-left: 24px;
  margin: 8px 0;
}

.editor-content ul {
  list-style-type: disc;
}

.editor-content ol {
  list-style-type: decimal;
}

/* 对齐样式 */
.editor-content [style*="text-align: left"] {
  text-align: left !important;
}

.editor-content [style*="text-align: center"] {
  text-align: center !important;
}

.editor-content [style*="text-align: right"] {
  text-align: right !important;
}

.editor-content [style*="text-align: justify"] {
  text-align: justify !important;
}
</style>
