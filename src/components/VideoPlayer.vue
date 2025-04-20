<!-- components/VideoPlayer.vue -->
<script setup lang="ts">
import { defineProps } from 'vue'
import 'video.js/dist/video-js.css'

const props = defineProps({
  src: {
    type: String,
    required: true
  }
})
</script>

<template>
  <video-js
    :options="{
      controls: true,
      sources: [{
        src: props.src,
        type: 'video/mp4'
      }]
    }"
    class="vjs-big-play-centered"
  />
</template>