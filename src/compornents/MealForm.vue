<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import Tesseract from 'tesseract.js'

const cameraImage = ref(null) // 撮影画像のURL
const ocrResult = ref({
  // OCRで解析した栄養情報
  calorie: 0,
  protein: 0,
  fat: 0,
  carb: 0,
})

const analyzeImage = async () => {
  if (!cameraImage.value) return
  const result = await Tesseract.recognize(cameraImage.value, 'eng') // 英語対応
  const text = result.data.text
  console.log('OCR結果:', text)

  // 簡易パターンマッチングで栄養素を抽出
  const regexCalorie = /calories?\s*[:=]?\s*(\d+)/i
  const regexProtein = /protein\s*[:=]?\s*(\d+)/i
  const regexFat = /fat\s*[:=]?\s*(\d+)/i
  const regexCarb = /carbs?\s*[:=]?\s*(\d+)/i

  ocrResult.value.calorie = Number((text.match(regexCalorie) || [0, 0])[1])
  ocrResult.value.protein = Number((text.match(regexProtein) || [0, 0])[1])
  ocrResult.value.fat = Number((text.match(regexFat) || [0, 0])[1])
  ocrResult.value.carb = Number((text.match(regexCarb) || [0, 0])[1])

  // newMeal に反映
  newMeal.value = {
    name: 'OCR商品',
    ...ocrResult.value,
  }
}

const captureImage = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    const video = document.createElement('video')
    video.srcObject = stream
    await video.play()

    // 1フレームキャプチャ
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    // 画像を保存
    cameraImage.value = canvas.toDataURL('image/png')

    // ビデオ停止
    stream.getTracks().forEach((track) => track.stop())
  } catch (err) {
    console.error('カメラエラー:', err)
    alert('カメラにアクセスできません')
  }
}
const emit = defineEmits(['add', 'close'])

/* =============================
   モード切替
============================= */
const mode = ref('manual') // manual, db, camera

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

  if (mode.value === 'manual') {
    // 自由入力用の登録
    await addManualMeal()
  } else if (mode.value === 'db') {
    // DB選択用の登録
    await addDbMeal()
  }

  // 共通: 親に emit & フォーム閉じる
  emit('add', { ...newMeal.value })
  emit('close')

  // リセット
  newMeal.value = { name: '', calorie: 0, protein: 0, fat: 0, carb: 0 }
  selectedFood.value = null
}

/* 自由入力登録 */
const addManualMeal = async () => {
  // Supabase への保存（数値は Number に変換）
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

/* DB選択登録 */
const addDbMeal = async () => {
  // DBから選んだものはそのまま親に渡すだけでも OK
  // もしDBに再保存したい場合も addManualMeal と同じ形で insert 可能
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
        <button @click="mode = 'camera'" :class="{ active: mode === 'camera' }">カメラ撮影</button>
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

      <div v-if="mode === 'camera'" class="camera-mode">
        <div v-if="!cameraImage">
          <button @click="captureImage">📷 撮影</button>
        </div>

        <div v-else>
          <img :src="cameraImage" alt="Captured" />
          <button @click="analyzeImage">🔍 栄養素解析</button>
          <div v-if="ocrResult.calorie || ocrResult.protein || ocrResult.fat || ocrResult.carb">
            <p>カロリー: {{ ocrResult.calorie }} kcal</p>
            <p>タンパク質: {{ ocrResult.protein }} g</p>
            <p>脂質: {{ ocrResult.fat }} g</p>
            <p>炭水化物: {{ ocrResult.carb }} g</p>
          </div>
          <button @click="cameraImage = null">撮り直す</button>
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
