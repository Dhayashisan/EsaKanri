<script setup>
import { ref, onMounted, computed } from 'vue'
import GoalSetting from './compornents/GoalSetting.vue'
import MealForm from './compornents/MealForm.vue'
const username = ref('')
const isEntered = ref(false)
import MealChart from './compornents/MealChart.vue'

// 目標設定表示フラグ
const showGoalSetting = ref(false)
// トグル処理
const toggleGoalSetting = () => {
  showGoalSetting.value = !showGoalSetting.value
}

const showMealForm = ref(false)
const showMeals = ref(false) // トグル表示用

const toggleMealForm = () => {
  showMealForm.value = !showMealForm.value
}

// 保存時に閉じる
const saveGoal = () => {
  localStorage.setItem('goal', JSON.stringify(goal.value))
  alert('目標を保存しました')
  showGoalSetting.value = false
}
/* =============================
   ログイン処理
============================= */
const enterName = () => {
  if (!username.value) return
  localStorage.setItem('username', username.value)
  isEntered.value = true
}

onMounted(() => {
  const savedName = localStorage.getItem('username')
  if (savedName) {
    username.value = savedName
    isEntered.value = true
  }

  const savedGoal = localStorage.getItem('goal')
  if (savedGoal) goal.value = JSON.parse(savedGoal)

  const savedMeals = localStorage.getItem('meals')
  if (savedMeals) meals.value = JSON.parse(savedMeals)
})

/* =============================
   目標設定（カロリー＋PFC比率）
============================= */
const goal = ref({
  calorie: 2000,
  ratioProtein: 30,
  ratioFat: 20,
  ratioCarb: 50,
})

/* 🔥 自動計算（g換算） */
const proteinGram = computed(() =>
  Math.round((goal.value.calorie * goal.value.ratioProtein) / 100 / 4),
)

const fatGram = computed(() => Math.round((goal.value.calorie * goal.value.ratioFat) / 100 / 9))

const carbGram = computed(() => Math.round((goal.value.calorie * goal.value.ratioCarb) / 100 / 4))

/* =============================
   食事登録
============================= */
const meals = ref([])

const newMeal = ref({
  name: '',
  calorie: 0,
  protein: 0,
  fat: 0,
  carb: 0,
})

const addMeal = (meal) => {
  if (!meal || !meal.name) return
  meals.value.push({ ...meal })
  //localStorage.setItem('meals', JSON.stringify(meals.value))
}

const total = computed(() => {
  return meals.value.reduce(
    (acc, meal) => {
      acc.calorie += Number(meal.calorie)
      acc.protein += Number(meal.protein)
      acc.fat += Number(meal.fat)
      acc.carb += Number(meal.carb)
      return acc
    },
    { calorie: 0, protein: 0, fat: 0, carb: 0 },
  )
})

const resetAll = () => {
  // 食事リストをリセット → total も自動で 0 になる
  meals.value = []
  localStorage.removeItem('meals')

  // 新規入力フォームもリセット
  newMeal.value = { name: '', calorie: 0, protein: 0, fat: 0, carb: 0 }
}
</script>

<template>
  <main>
    <div class="login">
      <div v-if="!isEntered" class="loginform">
        <h2>あなたの名前を入力してください</h2>
        <input v-model="username" placeholder="Name" />
        <button @click="enterName">Start</button>
      </div>

      <div v-else>
        <div class="header">
          <h1>Welcome {{ username }} 🐈</h1>
        </div>

        <div class="main-contents">
          <!-- 目標設定 -->
          <button @click="toggleGoalSetting">
            {{ showGoalSetting ? '閉じる' : '目標設定を開く' }}
          </button>

          <GoalSetting v-if="showGoalSetting" :goal="goal" @save="saveGoal" />

          <!-- 食事登録 -->
          <h2>🍽 食事管理</h2>

          <div class="meal-buttons">
            <button @click="toggleMealForm">食事を登録する</button>
            <button @click="resetAll" class="reset-btn">リセット</button>
          </div>

          <MealForm v-if="showMealForm" @add="addMeal" @close="showMealForm = false" />

          <!-- 合計表示 -->

          <h2>📊 今日の合計</h2>
          <div class="card">
            <p>Calories: {{ total.calorie }} / {{ goal.calorie }}</p>
            <p>Protein: {{ total.protein.toFixed(1) }} / {{ proteinGram.toFixed(1) }}</p>
            <p>Fat: {{ total.fat.toFixed(1) }} / {{ fatGram.toFixed(1) }}</p>
            <p>Carb: {{ total.carb.toFixed(1) }} / {{ carbGram.toFixed(1) }}</p>
          </div>
          <h2>📊 今日の合計グラフ</h2>
          <MealChart
            :total="total"
            :goal="goal"
            :proteinGram="proteinGram"
            :fatGram="fatGram"
            :carbGram="carbGram"
          />
          <!-- 🔥 ここに追加済み食事リストトグル guruguru-->
          <div class="added-meals">
            <button @click="showMeals = !showMeals">
              {{ showMeals ? '▲ 登録済み食事を隠す' : '▼ 登録済み食事を表示' }}
            </button>

            <ul v-if="showMeals">
              <li v-for="(meal, index) in meals" :key="index">
                {{ meal.name }} - {{ meal.calorie }}kcal | P{{ meal.protein.toFixed(1) }} F{{
                  meal.fat.toFixed(1)
                }}
                C{{ meal.carb.toFixed(1) }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* 全体unko */
main {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background-color: #121212;
  color: #fff;
  padding: 8px;
  box-sizing: border-box;
  font-size: 0.9rem; /* 基本フォントサイズをスマホ向けに調整 */
}

/* ログイン / コンテンツ wrapper */
.login {
  width: 100%;
  max-width: 430px; /* iPhone16幅に対応 */
  padding: 12px;
  box-sizing: border-box;
}

/* カード */
.card {
  background: #1e1e1e;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
}

/* 入力欄 */
input {
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  width: 100%;
  box-sizing: border-box;
  font-size: 0.85rem;
  color: #fff;
  background: #1e1e1e;
}

/* ボタン */
button {
  padding: 8px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
  cursor: pointer;
  font-size: 0.85rem;
  flex: 1;
}

/* ホバー効果 */
button:hover {
  opacity: 0.85;
}

/* リセットボタン */
.reset-btn {
  background: #ff5252;
}

/* メールボタン群を横並び */
.meal-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

/* ボタン無効時 */
button:disabled {
  background: gray;
  cursor: not-allowed;
}

/* エラー表示 */
.error {
  border: 2px solid #ff5252;
}

.error-text {
  color: #ff5252;
  font-weight: bold;
}

/* 登録済み食事リスト */
.added-meals {
  margin-top: 12px;
}

.added-meals ul {
  max-height: 200px;
  overflow-y: auto;
  padding-left: 16px;
  margin-top: 8px;
  background: #1e1e1e;
  border-radius: 6px;
  list-style: none;
}

.added-meals li {
  padding: 6px 8px;
  border-bottom: 1px solid #333;
}

/* レスポンシブ調整 */
@media screen and (max-width: 430px) {
  .card {
    padding: 8px;
    font-size: 0.85rem;
  }

  input {
    font-size: 0.85rem;
    padding: 6px;
  }

  button {
    font-size: 0.85rem;
    padding: 6px;
  }

  .meal-buttons {
    gap: 4px;
  }

  .added-meals ul {
    padding-left: 12px;
  }

  .added-meals li {
    padding: 4px 6px;
  }
}
</style>
