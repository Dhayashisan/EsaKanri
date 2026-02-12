<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

/**
 * イベント emit 定義
 * @event add - 食事追加時
 * @event close - パネル閉じる
 */
const emit = defineEmits(['add', 'close'])

/* =============================
   モード切替
   manual: 自由入力
   db: DBから選択
============================= */
const mode = ref('manual')

/* =============================
   ① 自由入力用データ
============================= */
const newMeal = ref({
  name: '',
  calorie: 0,
  protein: 0,
  fat: 0,
  carb: 0,
})

/* =============================
   ② DB取得用データ
============================= */
const foods = ref([])
const selectedFood = ref(null)
const quantity = ref(1)

/**
 * コンポーネントマウント時にDBから食品リストを取得
 */
onMounted(async () => {
  const { data, error } = await supabase.from('foods').select('*')

  if (error) {
    console.error('食品リスト取得エラー:', error)
  } else {
    foods.value = data
  }
})

/**
 * 食品を選択
 * @param {Object} food - 選択された食品
 */
const selectFood = (food) => {
  selectedFood.value = food
  newMeal.value = { ...food }
  quantity.value = 1
}

/* =============================
   食事追加処理
============================= */

/**
 * 食事追加ボタン押下時の処理
 */
const handleAdd = async () => {
  if (!newMeal.value.name) return

  let mealToAdd = { ...newMeal.value }

  if (mode.value === 'manual') {
    await addManualMeal()
  } else if (mode.value === 'db') {
    await addDbMeal()

    // 選択したDB食品の場合、数量分を掛け算
    mealToAdd = {
      ...newMeal.value,
      name: `${newMeal.value.name} ×${quantity.value}`,
      calorie: newMeal.value.calorie * quantity.value,
      protein: newMeal.value.protein * quantity.value,
      fat: newMeal.value.fat * quantity.value,
      carb: newMeal.value.carb * quantity.value,
    }
  }

  emit('add', mealToAdd)
  emit('close')

  // 入力値リセット
  newMeal.value = { name: '', calorie: 0, protein: 0, fat: 0, carb: 0 }
  selectedFood.value = null
  quantity.value = 1
}

/* =============================
   自由入力DB登録
============================= */

/**
 * 自由入力で作成した食事をDBに登録
 */
const addManualMeal = async () => {
  const { data, error } = await supabase
    .from('foods')
    .insert([
      {
        name: newMeal.value.name,
        calorie: Number(newMeal.value.calorie),
        protein: Number(newMeal.value.protein),
        fat: Number(newMeal.value.fat),
        carb: Number(newMeal.value.carb),
      },
    ])
    .select()

  if (error) {
    console.error('自由入力DB登録エラー:', error)
    alert('DB登録に失敗しました')
  }
}

/* =============================
   DB選択食事登録
============================= */

/**
 * DBから選択した食事を登録
 * （必要であれば再DB保存も可能）
 */
const addDbMeal = async () => {
  console.log('DBから選択した食事を登録:', newMeal.value)
}
</script>

<template>
  <div class="overlay">
    <div class="panel">
      <h2>🍽 食事登録</h2>

      <!-- モード切替 -->
      <div class="tabs">
        <button @click="mode = 'manual'" :class="{ active: mode === 'manual' }">自由入力</button>
        <button @click="mode = 'db'" :class="{ active: mode === 'db' }">DBから選択</button>
      </div>

      <!-- =============================
           ① 自由入力フォーム
      ============================= -->
      <div v-if="mode === 'manual'" class="manual-form">
        <div class="form-group">
          <label>食事名</label>
          <input v-model="newMeal.name" placeholder="例: 鶏胸肉" />
        </div>

        <div class="form-group">
          <label>カロリー(kcal)</label>
          <input type="number" v-model="newMeal.calorie" placeholder="例: 165" />
        </div>

        <div class="form-group">
          <label>タンパク質(P, g)</label>
          <input type="number" v-model="newMeal.protein" placeholder="例: 31" />
        </div>

        <div class="form-group">
          <label>脂質(F, g)</label>
          <input type="number" v-model="newMeal.fat" placeholder="例: 3.6" />
        </div>

        <div class="form-group">
          <label>炭水化物(C, g)</label>
          <input type="number" v-model="newMeal.carb" placeholder="例: 0" />
        </div>
      </div>

      <!-- =============================
           ② DBから選択
      ============================= -->
      <div v-if="mode === 'db'" class="food-list">
        <div
          v-for="food in foods"
          :key="food.id"
          class="food-item"
          :class="{ selected: selectedFood && selectedFood.id === food.id }"
          @click="selectFood(food)"
        >
          <strong>{{ food.name }}</strong>

          <!-- 選択中の数量を掛けた栄養表示 -->
          <p v-if="selectedFood && selectedFood.id === food.id">
            {{ food.calorie * quantity }}kcal | P {{ food.protein * quantity }} F
            {{ food.fat * quantity }} C {{ food.carb * quantity }}
            <input type="number" min="1" v-model.number="quantity" />
          </p>

          <!-- 通常表示 -->
          <p v-else>
            {{ food.calorie }}kcal | P {{ food.protein }} F {{ food.fat }} C {{ food.carb }}
          </p>
        </div>
      </div>

      <!-- 共通ボタン -->
      <button @click="handleAdd">追加</button>
      <button class="close" @click="$emit('close')">閉じる</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.panel {
  background: #1e1e1e;
  width: 90%;
  max-width: 420px;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tabs {
  display: flex;
  gap: 10px;
}

.tabs button {
  flex: 1;
  background: #333;
}

.tabs .active {
  background: #4caf50;
}

.food-list {
  max-height: 200px;
  overflow-y: auto;
}

.food-item {
  padding: 8px;
  border-bottom: 1px solid #333;
  cursor: pointer;
}

.food-item:hover {
  background: #333;
}

button {
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
}

.close {
  background: gray;
}

.food-item.selected {
  background-color: #b16eb9;
  color: white;
}

.manual-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.manual-form label {
  font-size: 0.9rem;
  color: #ccc;
}
</style>
