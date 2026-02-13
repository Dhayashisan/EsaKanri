<script setup>
import { computed } from 'vue'

const props = defineProps({
  goal: Object,
})

const emit = defineEmits(['save'])

// カロリー2000〜3400を10刻み
const calorieOptions = Array.from({ length: 15 }, (_, i) => 2000 + i * 100)

// PF比率 0〜25%
const ratioOptions = Array.from({ length: 26 }, (_, i) => i)

// C比率 0〜70%
const ratioCarbOptions = Array.from({ length: 71 }, (_, i) => i)

/* =============================
   PFC自動計算
============================= */
const proteinGram = computed(() =>
  Math.round((props.goal.calorie * props.goal.ratioProtein) / 100 / 4),
)

const fatGram = computed(() => Math.round((props.goal.calorie * props.goal.ratioFat) / 100 / 9))

const carbGram = computed(() => Math.round((props.goal.calorie * props.goal.ratioCarb) / 100 / 4))

/* =============================
   バリデーション
============================= */
const ratioTotal = computed(
  () =>
    Number(props.goal.ratioProtein) + Number(props.goal.ratioFat) + Number(props.goal.ratioCarb),
)

const isOverRatio = computed(() => ratioTotal.value > 100)

const handleSave = () => {
  if (isOverRatio.value) return
  emit('save')
}
</script>

<template>
  <div class="card">
    <label>Calories</label>
    <select v-model.number="goal.calorie">
      <option v-for="cal in calorieOptions" :key="cal" :value="cal">{{ cal }} kcal</option>
    </select>

    <label>P比率 (%)</label>
    <select v-model.number="goal.ratioProtein" :class="{ error: isOverRatio }">
      <option v-for="n in ratioOptions" :key="n" :value="n">{{ n }} %</option>
    </select>

    <label>F比率 (%)</label>
    <select v-model.number="goal.ratioFat" :class="{ error: isOverRatio }">
      <option v-for="n in ratioOptions" :key="n" :value="n">{{ n }} %</option>
    </select>

    <label>C比率 (%)</label>
    <select v-model.number="goal.ratioCarb" :class="{ error: isOverRatio }">
      <option v-for="n in ratioCarbOptions" :key="n" :value="n">{{ n }} %</option>
    </select>

    <p>合計: {{ ratioTotal }} %</p>

    <p v-if="isOverRatio" class="error-text">⚠ 比率の合計は100%以内にしてください</p>

    <p>--- 自動計算結果 ---</p>
    <p>Protein: {{ proteinGram }} g</p>
    <p>Fat: {{ fatGram }} g</p>
    <p>Carb: {{ carbGram }} g</p>

    <button @click="handleSave" :disabled="isOverRatio">保存</button>
  </div>
</template>

<style scoped>
.card {
  background: #1e1e1e;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input {
  padding: 8px;
  border-radius: 4px;
  border: none;
}

button {
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
  cursor: pointer;
}

button:disabled {
  background: gray;
  cursor: not-allowed;
}

.error {
  border: 2px solid #ff5252;
}

.error-text {
  color: #ff5252;
  font-weight: bold;
}
</style>
