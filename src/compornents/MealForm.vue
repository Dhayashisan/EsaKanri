<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

const emit = defineEmits(['add', 'close'])

/* =============================
   モード切替
============================= */
const mode = ref('manual') // manual or db

/* =============================
   ① 自由入力
============================= */
const newMeal = ref({
  name: '',
  calorie: 0,
  protein: 0,
  fat: 0,
  carb: 0,
})

/* =============================
   ② DB取得
============================= */
const foods = ref([])
const selectedFood = ref(null)

onMounted(async () => {
  const { data, error } = await supabase.from('foods').select('*')

  if (!error) foods.value = data
})

const selectFood = (food) => {
  selectedFood.value = food
  newMeal.value = { ...food }
}

/* =============================
   追加処理
============================= */
const handleAdd = async () => {
  if (!newMeal.value.name) return

  // ① Supabase に保存
  const { data, error } = await supabase
    .from('foods')
    .insert([
      {
        name: newMeal.value.name,
        calorie: String(newMeal.value.calorie),
        protein: String(newMeal.value.protein),
        fat: String(newMeal.value.fat),
        carb: String(newMeal.value.carb),
      }
    ])
    .select() // 挿入後のデータを取得（optional）

  if (error) {
    console.error('DB登録エラー:', error)
    alert('DB登録に失敗しました')
    return
  }

  // ② ローカルにも追加（親に emit）
  emit('add', { ...newMeal.value })

  // ③ フォーム閉じる
  emit('close')

  // ④ フォームリセット
  newMeal.value = { name: '', calorie: 0, protein: 0, fat: 0, carb: 0 }
  selectedFood.value = null
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
           ① 自由入力
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
           ② DB選択
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
          <p>{{ food.calorie }}kcal | P{{ food.protein }} F{{ food.fat }} C{{ food.carb }}</p>
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
