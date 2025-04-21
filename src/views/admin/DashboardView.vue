<!-- src/views/admin/DashboardView.vue -->
<!-- src/views/admin/DashboardView.vue -->
<template>
  <div class="dashboard-container">
    <h1>后台数据</h1>

    <!-- 加载状态 -->
    <div v-if="dashboardStore.loading" class="loading-overlay">
      <div class="loader"></div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>总用户数</h3>
        <p class="stat-value">
          {{ formatNumber(dashboardStore.formattedStats.totalUsers) }}
        </p>
      </div>
      <div class="stat-card">
        <h3>今日新增</h3>
        <p class="stat-value text-success">
          {{ formatNumber(dashboardStore.formattedStats.todayNewUsers) }}
        </p>
      </div>
      <div class="stat-card">
        <h3>待审内容</h3>
        <p class="stat-value text-warning">
          {{ formatNumber(dashboardStore.formattedStats.pendingContents) }}
        </p>
      </div>
    </div>

    <div class="charts-container">
      <div class="chart-card">
        <h3>用户增长趋势</h3>
        <div ref="userChartRef" style="height: 300px;"></div>
      </div>
      <div class="chart-card">
        <h3>内容类型分布</h3>
        <div ref="contentChartRef" style="height: 300px;"></div>
      </div>
    </div>

    <!-- 错误提示 -->
    <ErrorAlert
      v-if="dashboardStore.error"
      :message="dashboardStore.error"
      @dismiss="dashboardStore.error = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as echarts from 'echarts'
import { useDashboardStore } from '@/stores/dashboard'
import ErrorAlert from '@/components/ErrorAlert.vue'

const dashboardStore = useDashboardStore()

// 图表相关
const userChartRef = ref<HTMLElement | null>(null)
const contentChartRef = ref<HTMLElement | null>(null)
let userChart: echarts.ECharts | null = null
let contentChart: echarts.ECharts | null = null

// 数据格式化
const formatNumber = (num: string) => {
  return num // 已在 store 的 getters 中格式化
}

// 初始化图表
const initCharts = () => {
  if (!userChartRef.value || !contentChartRef.value) return

  // 销毁旧实例
  userChart?.dispose()
  contentChart?.dispose()

  // 创建新实例
  userChart = echarts.init(userChartRef.value)
  contentChart = echarts.init(contentChartRef.value)

  // 监听窗口变化自动调整
  window.addEventListener('resize', () => {
    userChart?.resize()
    contentChart?.resize()
  })
}

// 更新图表数据
const updateCharts = () => {
  if (!userChart || !contentChart) return

  // 用户增长趋势图表
  userChart.setOption({
    xAxis: {
      type: 'category',
      data: dashboardStore.growthData.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [{
      data: dashboardStore.growthData.map(item => item.count),
      type: 'line',
      smooth: true,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(46, 204, 113, 0.8)' }, // success 颜色
            { offset: 1, color: 'rgba(46, 204, 113, 0.1)' }
          ]
        }
      }
    }]
  })

  // 内容类型分布图表
  contentChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '55%',
      data: dashboardStore.contentTypes,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

// 生命周期
onMounted(async () => {
  initCharts()
  await dashboardStore.fetchAllData()
  updateCharts()
  console.log('内容类型数据:', dashboardStore.contentTypes)
})

onBeforeUnmount(() => {
  userChart?.dispose()
  contentChart?.dispose()
  window.removeEventListener('resize', () => {
    userChart?.resize()
    contentChart?.resize()
  })
})

// 监听数据变化自动更新图表
watch(
  () => [
    dashboardStore.growthData,
    dashboardStore.contentTypes
  ],
  () => {
    updateCharts()
  },
  { deep: true }
)
</script>

<style scoped>
/* 原有样式保持不变，新增加载样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.loader {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.dashboard-container {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin: 12px 0 0;
}

.text-success { color: #2ecc71; }
.text-warning { color: #f1c40f; }

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 32px;
}

.chart-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
}
</style>