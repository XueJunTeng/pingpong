<!-- src/views/admin/DashboardView.vue -->
<template>
  <div class="dashboard-container">
    <h1>管理仪表盘</h1>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>总用户数</h3>
        <p class="stat-value">{{ formatNumber(stats.totalUsers) }}</p>
      </div>
      <div class="stat-card">
        <h3>今日新增</h3>
        <p class="stat-value text-success">{{ formatNumber(stats.todayNew) }}</p>
      </div>
      <div class="stat-card">
        <h3>待审内容</h3>
        <p class="stat-value text-warning">{{ formatNumber(stats.pendingContents) }}</p>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

// 图表引用使用明确的类型标注
const userChartRef = ref<HTMLElement | null>(null)
const contentChartRef = ref<HTMLElement | null>(null)

const stats = ref({
  totalUsers: 1234,
  todayNew: 23,
  pendingContents: 12
})

const formatNumber = (num: number) => {
  return num.toLocaleString()
}

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  // 使用模板引用替代 querySelector
  if (!userChartRef.value || !contentChartRef.value) return

  const userChart = echarts.init(userChartRef.value)
  const contentChart = echarts.init(contentChartRef.value)

  // 保持原有图表配置不变
  userChart.setOption({
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    yAxis: { type: 'value' },
    series: [{ data: [150, 230, 224, 218, 135, 147, 260], type: 'line' }]
  })

  contentChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      data: [
        { value: 1048, name: '视频' },
        { value: 735, name: '文章' },
      ]
    }]
  })
}
</script>

<style scoped>
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