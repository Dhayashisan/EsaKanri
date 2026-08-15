```vue
<script setup>
/**
 * App.vue
 *
 * 食事管理アプリのメインコンポーネント
 *
 * 機能
 * - ユーザーログイン（簡易）
 * - 目標カロリー / PFC設定s
 * - 食事登録
 * - 食事削除
 * - 今日の合計計算
 * - グラフ表示
 */

import { ref, onMounted, computed } from 'vue'
import { supabase } from './utils/supabase'

import GoalSetting from './compornents/GoalSetting.vue'
import MealForm from './compornents/MealForm.vue'
import MealChart from './compornents/MealChart.vue'

/* ========================================
   ユーザー状態
======================================== */

const username = ref('')
const isEntered = ref(false)

/**
 * ユーザー名入力
 */
const enterName = async () => {
  if (!username.value.trim()) return

  username.value = username.value.trim()

  localStorage.setItem('username', username.value)
  isEntered.value = true

  await loadMeals()
}

/* ========================================
   UI表示管理
======================================== */

const showGoalSetting = ref(false)
const showMealForm = ref(false)
const showMeals = ref(false)
const showChart = ref(false)

/** 目標設定 */
const toggleGoalSetting = () => {
  showGoalSetting.value = !showGoalSetting.value
}

/** 食事フォーム */
const toggleMealForm = () => {
  showMealForm.value = !showMealForm.value
}

/* ========================================
   目標設定
======================================== */

const goal = ref({
  calorie: 2000,
  ratioProtein: 30,
  ratioFat: 20,
  ratioCarb: 50,
})

/**
 * 目標保存
 */
const saveGoal = () => {
  localStorage.setItem('goal', JSON.stringify(goal.value))
  alert('目標を保存しました')
  showGoalSetting.value = false
}

/* ========================================
   PFC自動計算
======================================== */

const proteinGram = computed(() =>
  Math.round((goal.value.calorie * goal.value.ratioProtein) / 100 / 4),
)

const fatGram = computed(() =>
  Math.round((goal.value.calorie * goal.value.ratioFat) / 100 / 9),
)

const carbGram = computed(() =>
  Math.round((goal.value.calorie * goal.value.ratioCarb) / 100 / 4),
)

/* ========================================
   食事データ
======================================== */

const meals = ref([])

/**
 * Supabaseから食事データ取得
 */
const loadMeals = async () => {
  if (!username.value) return

  const { data, error } = await supabase
    .from('meals')
    .select('*')
    .eq('user_id', username.value)
    .order('date', { ascending: false })

  if (!error) {
    meals.value = data || []
  } else {
    console.error(error)
  }
}

/**
 * 食事追加
 */
const addMeal = async (meal) => {
  const { data, error } = await supabase
    .from('meals')
    .insert([
      {
        user_id: username.value,
        name: meal.name,
        calorie: meal.calorie,
        protein: meal.protein,
        fat: meal.fat,
        carb: meal.carb,
        date: new Date(),
      },
    ])
    .select()

  if (error) {
    console.error(error)
    return
  }

  if (data && data.length > 0) {
    meals.value.unshift(data[0])
  }

  showMealForm.value = false
}

/**
 * 食事削除
 */
const deleteMeal = async (id) => {
  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('id', id)

  if (error) {
    console.error(error)
    return
  }

  meals.value = meals.value.filter((meal) => meal.id !== id)
}

/**
 * 全データ削除
 */
const resetAll = async () => {
  if (!confirm('すべての食事データを削除しますか？')) return

  const { error } = await supabase
    .from('meals')
    .delete()
    .eq('user_id', username.value)

  if (error) {
    console.error(error)
    return
  }

  meals.value = []
}

/* ========================================
   今日の食事だけを抽出
======================================== */

const todayMeals = computed(() => {
  const today = new Date()

  return meals.value.filter((meal) => {
    const mealDate = new Date(meal.date)

    return (
      mealDate.getFullYear() === today.getFullYear() &&
      mealDate.getMonth() === today.getMonth() &&
      mealDate.getDate() === today.getDate()
    )
  })
})

/* ========================================
   今日の合計
======================================== */

const total = computed(() => {
  return todayMeals.value.reduce(
    (acc, meal) => {
      acc.calorie += Number(meal.calorie) || 0
      acc.protein += Number(meal.protein) || 0
      acc.fat += Number(meal.fat) || 0
      acc.carb += Number(meal.carb) || 0

      return acc
    },
    {
      calorie: 0,
      protein: 0,
      fat: 0,
      carb: 0,
    },
  )
})

/* ========================================
   残りカロリー / PFC
======================================== */

const remainingCalorie = computed(() =>
  Math.max(0, goal.value.calorie - total.value.calorie),
)

const remainingProtein = computed(() =>
  Math.max(0, proteinGram.value - total.value.protein),
)

const remainingFat = computed(() =>
  Math.max(0, fatGram.value - total.value.fat),
)

const remainingCarb = computed(() =>
  Math.max(0, carbGram.value - total.value.carb),
)

/* ========================================
   日付
======================================== */

const todayText = computed(() => {
  const today = new Date()

  const week = ['日', '月', '火', '水', '木', '金', '土']

  return `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${week[today.getDay()]}）`
})

/* ========================================
   初期化
======================================== */

onMounted(async () => {
  const savedName = localStorage.getItem('username')

  if (savedName) {
    username.value = savedName
    isEntered.value = true

    await loadMeals()
  }

  const savedGoal = localStorage.getItem('goal')

  if (savedGoal) {
    try {
      goal.value = JSON.parse(savedGoal)
    } catch (error) {
      console.error('目標データの読み込みに失敗しました', error)
    }
  }
})
</script>

<template>
  <main>
    <!-- ==============================
         ログイン
    =============================== -->
    <div v-if="!isEntered" class="login-screen">
      <div class="login-card">
        <div class="login-icon">🍽️</div>

        <h1>食事管理</h1>

        <p>名前を入力してスタート</p>

        <input
          v-model="username"
          placeholder="名前"
          @keyup.enter="enterName"
        />

        <button class="start-button" @click="enterName">
          Start
        </button>
      </div>
    </div>

    <!-- ==============================
         メイン画面
    =============================== -->
    <div v-else class="app">

      <!-- ヘッダー -->
      <header class="header">
        <div>
          <p class="date">{{ todayText }}</p>
          <h1>Welcome {{ username }} 😾</h1>
        </div>

        <button
          class="settings-button"
          @click="toggleGoalSetting"
        >
          ⚙️
        </button>
      </header>

      <!-- 目標設定 -->
      <div v-if="showGoalSetting" class="goal-area">
        <GoalSetting
          :goal="goal"
          @save="saveGoal"
        />
      </div>

      <!-- ==============================
           今日の残り
      =============================== -->
      <section class="summary-card">

        <div class="summary-header">
          <div>
            <p class="section-label">TODAY</p>
            <h2>今日の残り</h2>
          </div>

          <div class="calorie-target">
            / {{ goal.calorie }} kcal
          </div>
        </div>

        <div class="calorie-main">
          <span>{{ remainingCalorie }}</span>
          <small>kcal</small>
        </div>

        <div class="calorie-progress">
          <div
            class="progress-bar"
            :style="{
              width:
                Math.min(
                  (total.calorie / goal.calorie) * 100,
                  100
                ) + '%'
            }"
          ></div>
        </div>

        <p class="consumed">
          摂取 {{ Math.round(total.calorie) }} kcal
        </p>

      </section>

      <!-- ==============================
           PFC
      =============================== -->
      <section class="pfc-section">

        <div class="pfc-card protein">
          <span class="pfc-label">PROTEIN</span>
          <strong>{{ remainingProtein.toFixed(1) }}g</strong>
          <small>/ {{ proteinGram }}g</small>
        </div>

        <div class="pfc-card fat">
          <span class="pfc-label">FAT</span>
          <strong>{{ remainingFat.toFixed(1) }}g</strong>
          <small>/ {{ fatGram }}g</small>
        </div>

        <div class="pfc-card carb">
          <span class="pfc-label">CARB</span>
          <strong>{{ remainingCarb.toFixed(1) }}g</strong>
          <small>/ {{ carbGram }}g</small>
        </div>

      </section>

      <!-- ==============================
           食事登録
      =============================== -->
      <section class="meal-section">

        <button
          class="add-meal-button"
          @click="toggleMealForm"
        >
          <span class="plus">＋</span>
          <span>
            {{ showMealForm ? '食事登録を閉じる' : '食事を登録する' }}
          </span>
        </button>

        <MealForm
          v-if="showMealForm"
          @add="addMeal"
          @close="showMealForm = false"
        />

      </section>

      <!-- ==============================
           今日の食事
      =============================== -->
      <section class="today-meals">

        <div class="section-title">
          <h2>🍽 今日の食事</h2>

          <span>
            {{ todayMeals.length }}件
          </span>
        </div>

        <div
          v-if="todayMeals.length === 0"
          class="empty-meals"
        >
          まだ食事が登録されていません
        </div>

        <div
          v-else
          class="meal-list"
        >

          <div
            v-for="meal in todayMeals"
            :key="meal.id"
            class="meal-item"
          >

            <div class="meal-info">
              <strong>{{ meal.name }}</strong>

              <span>
                {{ meal.calorie }} kcal
                · P{{ Number(meal.protein).toFixed(1) }}
                F{{ Number(meal.fat).toFixed(1) }}
                C{{ Number(meal.carb).toFixed(1) }}
              </span>
            </div>

            <button
              class="delete-btn"
              @click="deleteMeal(meal.id)"
            >
              削除
            </button>

          </div>

        </div>

      </section>

      <!-- ==============================
           グラフ
      =============================== -->
      <section class="details-section">

        <button
          class="details-button"
          @click="showChart = !showChart"
        >
          <span>
            {{ showChart ? '▲ 栄養グラフを閉じる' : '▼ 栄養グラフを見る' }}
          </span>
        </button>

        <div
          v-if="showChart"
          class="chart-area"
        >
          <MealChart
            :total="total"
            :goal="goal"
            :proteinGram="proteinGram"
            :fatGram="fatGram"
            :carbGram="carbGram"
          />
        </div>

      </section>

      <!-- ==============================
           管理
      =============================== -->
      <section class="management">

        <button
          class="management-button"
          @click="showMeals = !showMeals"
        >
          {{ showMeals ? '▲ 登録データを隠す' : '▼ 登録データを表示' }}
        </button>

        <div v-if="showMeals" class="all-meals">

          <div
            v-for="meal in meals"
            :key="meal.id"
            class="all-meal-item"
          >

            <div>
              <strong>{{ meal.name }}</strong>

              <span>
                {{ meal.calorie }} kcal
                / {{ new Date(meal.date).toLocaleDateString('ja-JP') }}
              </span>
            </div>

            <button
              class="delete-btn"
              @click="deleteMeal(meal.id)"
            >
              削除
            </button>

          </div>

        </div>

        <button
          class="reset-button"
          @click="resetAll"
        >
          データをすべてリセット
        </button>

      </section>

    </div>
  </main>
</template>

<style scoped>

/* ========================================
   全体
======================================== */

main {
  min-height: 100dvh;
  width: 100%;
  box-sizing: border-box;

  background: #121212;
  color: #fff;

  padding:
    max(16px, env(safe-area-inset-top))
    max(16px, env(safe-area-inset-right))
    max(32px, env(safe-area-inset-bottom))
    max(16px, env(safe-area-inset-left));

  overflow-x: hidden;
}

/* ========================================
   アプリ本体
======================================== */

.app {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* ========================================
   ログイン
======================================== */

.login-screen {
  min-height: calc(100dvh - 32px);

  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 100%;
  max-width: 360px;

  background: #1e1e1e;
  border-radius: 20px;

  padding: 32px 24px;

  box-sizing: border-box;
  text-align: center;
}

.login-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-card h1 {
  margin: 0 0 8px;
  font-size: 1.6rem;
}

.login-card p {
  color: #aaa;
  margin: 0 0 24px;
}

.login-card input {
  width: 100%;
  box-sizing: border-box;

  padding: 14px;

  border: none;
  border-radius: 10px;

  background: #2a2a2a;
  color: #fff;

  font-size: 16px;

  margin-bottom: 12px;
}

.start-button {
  width: 100%;
  padding: 14px;

  border: none;
  border-radius: 10px;

  background: #4caf50;
  color: white;

  font-size: 1rem;
  font-weight: bold;
}

/* ========================================
   ヘッダー
======================================== */

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 8px 0 18px;
}

.header h1 {
  margin: 2px 0 0;
  font-size: 1.45rem;
}

.date {
  margin: 0;
  color: #999;
  font-size: 0.8rem;
}

.settings-button {
  flex: none;

  width: 44px;
  height: 44px;

  padding: 0;

  border: none;
  border-radius: 50%;

  background: #242424;
  color: white;

  font-size: 1.1rem;
}

/* ========================================
   目標設定
======================================== */

.goal-area {
  background: #1e1e1e;

  padding: 14px;
  margin-bottom: 16px;

  border-radius: 14px;
}

/* ========================================
   今日の残り
======================================== */

.summary-card {
  background: #1e1e1e;

  border-radius: 18px;

  padding: 20px;

  margin-bottom: 12px;

  box-sizing: border-box;
}

.summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.section-label {
  margin: 0;

  color: #4caf50;

  font-size: 0.7rem;
  font-weight: bold;
  letter-spacing: 1px;
}

.summary-header h2 {
  margin: 3px 0 0;

  font-size: 1.1rem;
}

.calorie-target {
  color: #888;
  font-size: 0.8rem;
  padding-top: 6px;
}

.calorie-main {
  display: flex;
  align-items: baseline;

  margin-top: 14px;
}

.calorie-main span {
  font-size: 3rem;
  line-height: 1;

  font-weight: 700;
}

.calorie-main small {
  margin-left: 6px;

  color: #aaa;
  font-size: 0.9rem;
}

.calorie-progress {
  height: 8px;

  margin-top: 18px;

  background: #333;

  border-radius: 10px;

  overflow: hidden;
}

.progress-bar {
  height: 100%;

  background: #4caf50;

  border-radius: 10px;

  transition: width 0.3s ease;
}

.consumed {
  margin: 8px 0 0;

  color: #888;

  font-size: 0.8rem;
}

/* ========================================
   PFC
======================================== */

.pfc-section {
  display: grid;

  grid-template-columns: repeat(3, 1fr);

  gap: 8px;

  margin-bottom: 14px;
}

.pfc-card {
  background: #1e1e1e;

  border-radius: 14px;

  padding: 14px 10px;

  box-sizing: border-box;
}

.pfc-label {
  display: block;

  color: #888;

  font-size: 0.65rem;
  font-weight: bold;

  letter-spacing: 0.5px;

  margin-bottom: 5px;
}

.pfc-card strong {
  display: block;

  font-size: 1.25rem;
}

.pfc-card small {
  display: block;

  color: #666;

  font-size: 0.7rem;

  margin-top: 3px;
}

/* ========================================
   食事登録
======================================== */

.meal-section {
  margin-bottom: 18px;
}

.add-meal-button {
  width: 100%;

  min-height: 58px;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;

  border: none;
  border-radius: 14px;

  background: #4caf50;
  color: white;

  font-size: 1rem;
  font-weight: bold;
}

.plus {
  font-size: 1.5rem;
  line-height: 1;
}

/* ========================================
   今日の食事
======================================== */

.today-meals {
  margin-bottom: 18px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-bottom: 8px;
}

.section-title h2 {
  margin: 0;

  font-size: 1rem;
}

.section-title span {
  color: #777;
  font-size: 0.75rem;
}

.empty-meals {
  background: #1e1e1e;

  padding: 20px;

  border-radius: 14px;

  color: #777;

  text-align: center;

  font-size: 0.85rem;
}

.meal-list {
  background: #1e1e1e;

  border-radius: 14px;

  overflow: hidden;
}

.meal-item {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 10px;

  padding: 13px;

  border-bottom: 1px solid #303030;
}

.meal-item:last-child {
  border-bottom: none;
}

.meal-info {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 4px;
}

.meal-info strong {
  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;

  font-size: 0.9rem;
}

.meal-info span {
  color: #888;

  font-size: 0.7rem;
}

.delete-btn {
  flex: none;

  padding: 6px 9px;

  border: none;
  border-radius: 7px;

  background: #3a2222;
  color: #ff7070;

  font-size: 0.7rem;
}

/* ========================================
   グラフ
======================================== */

.details-section {
  margin-bottom: 18px;
}

.details-button {
  width: 100%;

  padding: 12px;

  border: none;
  border-radius: 12px;

  background: #242424;
  color: #ccc;

  font-size: 0.85rem;
}

.chart-area {
  background: #1e1e1e;

  margin-top: 8px;

  padding: 10px;

  border-radius: 14px;

  overflow-x: auto;
}

/* ========================================
   管理
======================================== */

.management {
  padding-top: 4px;
}

.management-button {
  width: 100%;

  padding: 12px;

  border: none;
  border-radius: 12px;

  background: #242424;
  color: #aaa;

  font-size: 0.8rem;
}

.all-meals {
  max-height: 40vh;

  overflow-y: auto;

  margin-top: 8px;

  background: #1e1e1e;

  border-radius: 12px;
}

.all-meal-item {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 10px;

  padding: 12px;

  border-bottom: 1px solid #303030;
}

.all-meal-item div {
  min-width: 0;
}

.all-meal-item strong {
  display: block;

  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  font-size: 0.85rem;
}

.all-meal-item span {
  display: block;

  color: #777;

  font-size: 0.7rem;

  margin-top: 3px;
}

.reset-button {
  width: 100%;

  margin-top: 18px;

  padding: 11px;

  border: none;
  border-radius: 10px;

  background: transparent;
  color: #666;

  font-size: 0.75rem;
}

/* ========================================
   ボタン共通
======================================== */

button {
  cursor: pointer;

  -webkit-tap-highlight-color: transparent;

  transition:
    opacity 0.15s ease,
    transform 0.1s ease;
}

button:active {
  transform: scale(0.98);
}

button:hover {
  opacity: 0.9;
}

/* ========================================
   iPhoneサイズ調整
======================================== */

@media screen and (max-width: 430px) {

  main {
    padding-left: 14px;
    padding-right: 14px;
  }

  .header h1 {
    font-size: 1.3rem;
  }

  .summary-card {
    padding: 18px;
  }

  .calorie-main span {
    font-size: 2.7rem;
  }

  .pfc-card {
    padding: 12px 9px;
  }

  .pfc-card strong {
    font-size: 1.1rem;
  }

  .meal-item {
    padding: 12px 10px;
  }
}

/* ========================================
   小さいスマホ
======================================== */

@media screen and (max-width: 360px) {

  main {
    padding-left: 10px;
    padding-right: 10px;
  }

  .pfc-section {
    gap: 5px;
  }

  .pfc-card {
    padding: 10px 7px;
  }

  .pfc-card strong {
    font-size: 1rem;
  }

  .calorie-main span {
    font-size: 2.4rem;
  }
}

</style>
```
