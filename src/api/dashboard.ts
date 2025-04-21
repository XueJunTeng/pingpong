// src/api/dashboard.ts
import request from './request'

export interface DashboardStats {
    totalUsers: number
    todayNewUsers: number
    pendingContents: number
}

export interface UserGrowth {
    date: string
    count: number
}

export interface ContentTypeDTO {
    name: string
    value: number
}

export const getDashboardStats = () =>
    request.get<DashboardStats>('/api/admin/dashboard/stats')

export const getGrowthTrend = (range: string) =>
    request.get<UserGrowth[]>('/api/admin/dashboard/growth', { params: { range } })

export const getContentTypes = () =>
    request.get<ContentTypeDTO[]>('/api/admin/dashboard/content-types')