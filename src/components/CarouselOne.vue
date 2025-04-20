<!-- src/components/CarouselOne.vue -->
<template>
  <div
    class="carousel"
    @mouseenter="carouselStore.stopAutoPlay"
    @mouseleave="() => carouselStore.startAutoPlay(3000)"
  >
    <div
      v-for="(item, index) in carouselStore.items"
      :key="item.id"
      class="carousel-item"
      :class="{ active: index === carouselStore.currentIndex }"
    >
      <img
        :src="item.imageUrl"
        :alt="item.altText"
        class="carousel-img"
      >
    </div>

    <div class="carousel-controls">
      <button
        v-for="(item, index) in carouselStore.items"
        :key="'indicator-' + item.id"
        class="indicator"
        :class="{ active: index === carouselStore.currentIndex }"
        @click="carouselStore.setCurrentIndex(index)"
      />
    </div>

    <button class="nav-arrow prev" @click="prevSlide">‹</button>
    <button class="nav-arrow next" @click="nextSlide">›</button>
  </div>
</template>

<script setup lang="ts">
import { useCarouselStore } from '@/stores/CarouselStore'
import { onMounted, onUnmounted } from 'vue'

const carouselStore = useCarouselStore()

const prevSlide = () => {
  const newIndex = carouselStore.currentIndex - 1
  carouselStore.setCurrentIndex(newIndex < 0 ? carouselStore.items.length - 1 : newIndex)
}

const nextSlide = () => {
  carouselStore.setCurrentIndex((carouselStore.currentIndex + 1) % carouselStore.items.length)
}

onMounted(() => {
  carouselStore.fetchCarouselItems().then(() => {
    carouselStore.startAutoPlay()
  })
})

onUnmounted(() => {
  carouselStore.stopAutoPlay()
})
</script>

<style scoped>
.carousel {
  height: 400px;
  overflow: hidden;
  position: relative;
}

.carousel-item {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.carousel-item.active {
  opacity: 1;
}

.carousel-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid white;
  background: transparent;
  cursor: pointer;
  transition: background 0.3s ease;
}

.indicator.active {
  background: white;
}

.nav-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0,0,0,0.3);
  color: white;
  border: none;
  padding: 15px;
  font-size: 24px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.nav-arrow:hover {
  background: rgba(0,0,0,0.6);
}

.prev {
  left: 20px;
}

.next {
  right: 20px;
}
</style>
