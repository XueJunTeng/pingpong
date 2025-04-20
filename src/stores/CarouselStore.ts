import { defineStore } from 'pinia'
import { mockCarouselItems } from '@/api/mockData'

interface CarouselItem {
  id: number
  imageUrl: string
  altText: string
  linkUrl: string  // 新增链接字段
}

export const useCarouselStore = defineStore('carousel', {
  state: () => ({
    items: [] as CarouselItem[],
    currentIndex: 0,
    intervalId: null as number | null
  }),

  actions: {
    async fetchCarouselItems() {
      // 模拟API调用
      setTimeout(() => {
        this.items = mockCarouselItems
      }, 500)
    },

    setCurrentIndex(index: number) {
      this.currentIndex = index
    },

    startAutoPlay(interval: number = 3000) {
      this.intervalId = setInterval(() => {
        this.currentIndex = (this.currentIndex + 1) % this.items.length
      }, interval)
    },

    stopAutoPlay() {
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.intervalId = null
      }
    }
  }
})
