<script setup>
import { ref, inject, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

const emit = defineEmits(['go-top'])
const username = inject('username')

const chartData = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('TraningDatabase')
    .select('*')
    .eq('name', username.value)
    .eq('exercise', exerciseName)
    .eq('muscle_group', '胸')
    .order('training_date', { ascending: true })
  chartData.value = data
})

const goTop = () => {
  emit('go-top')
}
</script>

<template>
  <div>
    <h2>Chest Graph</h2>
    <button @click="goTop">Top</button>
    <!-- グラフ描画例。Chart.js などを利用 -->
    <div v-if="chartData.length">
      <pre>{{ chartData }}</pre>
    </div>
    <div v-else>データなし</div>
  </div>
</template>