// src/types/dashboard.ts
export interface DashboardStats {
  totalUsers: number
  todayNewUsers: number
  pendingContents: number
}

export interface UserGrowth {
  date: string
  count: number
}

export interface ContentType {
  name: string
  value: number
}