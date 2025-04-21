// src/stores/dashboard.ts
import { defineStore } from 'pinia'
import {
    getDashboardStats,
    getGrowthTrend,
    getContentTypes,
    type DashboardStats,
    type UserGrowth,
    type ContentTypeDTO
} from '@/api/dashboard'
import type { ContentType } from '@/types/dashboard'

export const useDashboardStore = defineStore('dashboard', {
    state: () => ({
        stats: {} as DashboardStats,
        growthData: [] as UserGrowth[],
        contentTypes: [] as ContentType[],
        loading: false,
        error: null as string | null
    }),

    actions: {
        async fetchAllData(timeRange = '7d') {
            this.loading = true
            try {
                const [statsRes, growthRes, typesRes] = await Promise.all([
                    getDashboardStats(),
                    getGrowthTrend(timeRange),
                    getContentTypes()
                ])

                this.stats = statsRes.data
                this.growthData = growthRes.data
                this.contentTypes = typesRes.data.map((item: ContentTypeDTO) => ({
                    name: item.name,
                    value: item.value
                }))
            } catch (err) {
                this.error = (err as Error).message || '数据加载失败'
            } finally {
                this.loading = false
            }
        }
    },

    getters: {
        formattedStats(): {
            totalUsers: string
            todayNewUsers: string
            pendingContents: string
        } {
            return {
                totalUsers: this.stats.totalUsers?.toLocaleString() || '0',
                todayNewUsers: this.stats.todayNewUsers?.toLocaleString() || '0',
                pendingContents: this.stats.pendingContents?.toLocaleString() || '0'
            }
        }
    }
})