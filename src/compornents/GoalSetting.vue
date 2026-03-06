<script setup>
import { computed } from 'vue'

/**
 * GoalSetting.vue
 * -----------------------------
 * 1日の摂取カロリーとPFC比率を設定するコンポーネント
 *
 * 機能
 * ・カロリー設定
 * ・PFC比率設定
 * ・比率バリデーション（合計100%以内）
 * ・PFCグラム自動計算
 *
 * emit
 * save : 設定保存
 */

/* =============================
   Props / Emits
============================= */

/**
 * @typedef {Object} Goal
 * @property {number} calorie
 * @property {number} ratioProtein
 * @property {number} ratioFat
 * @property {number} ratioCarb
 */

const props = defineProps({
  goal: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['save'])

/* =============================
   定数
============================= */

const CALORIE_START = 2000
const CALORIE_STEP = 100
const CALORIE_COUNT = 15

const PROTEIN_KCAL = 4
const CARB_KCAL = 4
const FAT_KCAL = 9

/* =============================
   Utility
============================= */

/**
 * 数値配列生成
 * @param {number} length
 * @param {(index:number)=>number} fn
 * @returns {number[]}
 */
const createArray = (length, fn) => Array.from({ length }, (_, i) => fn(i))

/**
 * PFCグラム計算
 * @param {number} calorie
 * @param {number} ratio
 * @param {number} kcal
 * @returns {number}
 */
const calcGram = (calorie, ratio, kcal) => Math.round((calorie * ratio) / 100 / kcal)

/* =============================
   セレクトボックスデータ
============================= */

const calorieOptions = createArray(CALORIE_COUNT, (i) => CALORIE_START + i * CALORIE_STEP)

const ratioOptions = createArray(31, (i) => i)
const ratioCarbOptions = createArray(71, (i) => i)

/* =============================
   PFC自動計算
============================= */

const proteinGram = computed(() =>
  calcGram(props.goal.calorie, props.goal.ratioProtein, PROTEIN_KCAL),
)

const fatGram = computed(() => calcGram(props.goal.calorie, props.goal.ratioFat, FAT_KCAL))

const carbGram = computed(() => calcGram(props.goal.calorie, props.goal.ratioCarb, CARB_KCAL))

/* =============================
   バリデーション
============================= */

const ratioTotal = computed(
  () =>
    Number(props.goal.ratioProtein) + Number(props.goal.ratioFat) + Number(props.goal.ratioCarb),
)

const isOverRatio = computed(() => ratioTotal.value > 100)

/**
 * 保存処理
 */
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
  border-radius: 12px;
  margin-bottom: 20px;

  display: flex;
  flex-direction: column;
  gap: 10px;

  max-height: 70dvh;
  overflow-y: auto;
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
