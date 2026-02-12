<script setup>
import { computed } from 'vue'
import { Chart as ChartJS,  Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { Bar } from 'vue-chartjs'

ChartJS.register( Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  total: Object,
  goal: Object,
  proteinGram: Number,
  fatGram: Number,
  carbGram: Number,
})

// 横棒用のチャートデータ（Calories を除く）
const data = computed(() => ({
  labels: ['Protein(g)', 'Fat(g)', 'Carb(g)'], // カロリーを除外
  datasets: [
    {
      label: '今日の合計',
      backgroundColor: '#4caf50',
      data: [
        props.total.protein,
        props.total.fat,
        props.total.carb,
      ],
    },
    {
      label: '目標',
      backgroundColor: '#2196f3',
      data: [
        props.proteinGram,
        props.fatGram,
        props.carbGram,
      ],
    },
  ],
}))

const options = {
  indexAxis: 'y', // ← 横棒にする
  responsive: true,
  plugins: {
    legend: { position: 'top' },
  },
  scales: {
    x: { beginAtZero: true }, // 横軸（量）を0スタート
    y: { beginAtZero: true },
  },
}
</script>

<template>
  <Bar :data="data" :options="options" />
</template>
