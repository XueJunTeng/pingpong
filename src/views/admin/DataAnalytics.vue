<!-- src/views/admin/DataAnalytics.vue -->
<template>
  <div class="analytics-container">
    <h2>数据分析</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>总访问量</h3>
        <p class="stat-value">{{ formatNumber(analyticsData.totalVisits) }}</p>
      </div>
      <div class="stat-card">
        <h3>平均停留时间</h3>
        <p class="stat-value">{{ analyticsData.avgDuration }}分钟</p>
      </div>
    </div>

    <div class="charts">
      <div class="chart-card">
        <h3>访问趋势</h3>
        <div ref="visitChartRef" style="height: 400px;"></div>
      </div>
      <div class="chart-card">
        <h3>用户设备分布</h3>
        <div ref="deviceChartRef" style="height: 400px;"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'

const visitChartRef = ref<HTMLElement | null>(null)
const deviceChartRef = ref<HTMLElement | null>(null)

interface AnalyticsData {
  totalVisits: number
  avgDuration: number
}

const analyticsData = ref<AnalyticsData>({
  totalVisits: 12345,
  avgDuration: 8.2
})

const formatNumber = (num: number) => {
  return num.toLocaleString()
}

onMounted(() => {
  initCharts()
})

const initCharts = () => {
  if (!visitChartRef.value || !deviceChartRef.value) return

  // 访问趋势图表
  const visitChart = echarts.init(visitChartRef.value)
  visitChart.setOption({
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [{
      data: [820, 932, 901, 934, 1290, 1330, 1320],
      type: 'line',
      smooth: true
    }]
  })

  // 设备分布图表
  const deviceChart = echarts.init(deviceChartRef.value)
  deviceChart.setOption({
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '60%',
      data: [
        { value: 1048, name: 'Desktop' },
        { value: 735, name: 'Mobile' },
        { value: 580, name: 'Tablet' }
      ]
    }]
  })
}
</script>

<style scoped>
.analytics-container {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin: 24px 0;
}

.charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 32px;
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