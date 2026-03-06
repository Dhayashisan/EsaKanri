<script setup>
/**
 * MealChart.vue
 * --------------------------------------
 * 今日のPFC摂取量と目標値を比較する横棒グラフ
 *
 * Props
 * total       : 今日の摂取量 { protein, fat, carb }
 * proteinGram : 目標Protein(g)
 * fatGram     : 目標Fat(g)
 * carbGram    : 目標Carb(g)
 */

import { computed } from 'vue'
import { Chart as ChartJS, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Bar } from 'vue-chartjs'

/**
 * Chart.js 必須モジュール登録
 */
ChartJS.register(Tooltip, Legend, BarElement, CategoryScale, LinearScale)

/**
 * Props定義
 */
const props = defineProps({
  total: {
    type: Object,
    required: true,
  },
  proteinGram: {
    type: Number,
    required: true,
  },
  fatGram: {
    type: Number,
    required: true,
  },
  carbGram: {
    type: Number,
    required: true,
  },
})

/**
 * ラベル定義
 */
const labels = ['Protein (g)', 'Fat (g)', 'Carb (g)']

/**
 * 今日の摂取量
 */
const todayData = computed(() => [props.total.protein, props.total.fat, props.total.carb])

/**
 * 目標値
 */
const goalData = computed(() => [props.proteinGram, props.fatGram, props.carbGram])

/**
 * Chart.js用データ
 */
const chartData = computed(() => ({
  labels,
  datasets: [
    {
      label: '今日の合計',
      backgroundColor: '#4caf50',
      data: todayData.value,
    },
    {
      label: '目標',
      backgroundColor: '#2196f3',
      data: goalData.value,
    },
  ],
}))

/**
 * Chart.jsオプション
 */
const chartOptions = {
  indexAxis: 'y', // 横棒グラフ
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'grams',
      },
    },
  },
}
</script>

<template>
  <div class="chart-container">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  height: 220px;
}
</style>
