<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../utils/supabase'

/* =====================================================
   定数
===================================================== */

/**
 * 数量選択（1〜10）
 * @type {number[]}
 */
const quantityOptions = Array.from({ length: 10 }, (_, i) => i + 1)

/* =====================================================
   emit
===================================================== */

/**
 * @event add 食事追加
 * @event close モーダル閉じる
 */
const emit = defineEmits(['add', 'close'])

/* =====================================================
   UI状態
===================================================== */

/**
 * モード
 * manual : 手入力
 * db     : DBから選択
 */
const mode = ref('manual')

/* =====================================================
   食事入力データ
===================================================== */

/**
 * 入力中の食事
 */
const newMeal = ref({
  name: '',
  calorie: 0,
  protein: 0,
  fat: 0,
  carb: 0,
})

/* =====================================================
   DB食品
===================================================== */

/** DB食品一覧 */
const foods = ref([])

/** 選択食品 */
const selectedFood = ref(null)

/** 数量 */
const quantity = ref(1)

/* =====================================================
   初期処理
===================================================== */

/**
 * DBから食品一覧取得
 */
const fetchFoods = async () => {
  const { data, error } = await supabase
    .from('foods')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('食品取得エラー', error)
    return
  }

  foods.value = data
}

onMounted(fetchFoods)

/* =====================================================
   食品選択
===================================================== */

/**
 * 食品選択
 * @param {Object} food
 */
const selectFood = (food) => {
  selectedFood.value = food
  quantity.value = 1

  newMeal.value = {
    ...food,
    name: `${food.name} ×1`,
  }
}

/* =====================================================
   数量変更
===================================================== */

/**
 * 数量変更時の栄養再計算
 */
const updateNutrition = () => {
  if (!selectedFood.value) return

  const food = selectedFood.value
  const q = quantity.value

  newMeal.value = {
    ...food,
    name: `${food.name} ×${q}`,
    calorie: food.calorie * q,
    protein: food.protein * q,
    fat: food.fat * q,
    carb: food.carb * q,
  }
}

watch(quantity, updateNutrition)

/* =====================================================
   foodsテーブル保存
===================================================== */

/**
 * foodsテーブルに保存
 * 同じ名前の食品が存在する場合は登録しない
 */
const saveFood = async () => {
  const { data } = await supabase.from('foods').select('id').eq('name', newMeal.value.name).limit(1)

  if (data && data.length > 0) return

  const { error } = await supabase.from('foods').insert([
    {
      name: newMeal.value.name,
      calorie: newMeal.value.calorie,
      protein: newMeal.value.protein,
      fat: newMeal.value.fat,
      carb: newMeal.value.carb,
      date: new Date().toISOString(),
    },
  ])

  if (error) {
    console.error('foods登録エラー', error)
  }
}

/* =====================================================
   リセット
===================================================== */

/**
 * 入力フォーム初期化
 */
const resetForm = () => {
  newMeal.value = {
    name: '',
    calorie: 0,
    protein: 0,
    fat: 0,
    carb: 0,
  }

  selectedFood.value = null
  quantity.value = 1
}

/* =====================================================
   食事追加
===================================================== */

/**
 * 食事追加処理
 */
const handleAdd = async () => {
  if (!newMeal.value.name) return

  if (mode.value === 'manual') {
    await saveFood()
  }

  emit('add', { ...newMeal.value })
  emit('close')

  resetForm()
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
            {{ food.calorie * quantity }}kcal | P {{ (food.protein * quantity).toFixed(1) }} F
            {{ (food.fat * quantity).toFixed(1) }} C {{ (food.carb * quantity).toFixed(1) }}

            <select v-model.number="quantity" @click.stop>
              <option v-for="n in quantityOptions" :key="n" :value="n">×{{ n }}</option>
            </select>
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
  align-items: flex-start;

  padding-top: 60px;
  padding-left: 16px;
  padding-right: 16px;
  padding-bottom: calc(env(safe-area-inset-bottom) + 16px);

  z-index: 9999;
}

.panel {
  background: #1e1e1e;
  width: 100%;
  max-width: 430px;

  max-height: 80dvh;
  overflow-y: auto;

  padding: 20px;

  border-radius: 16px;

  display: flex;
  flex-direction: column;
  gap: 12px;

  /* ↓ 影でモーダル感 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
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
