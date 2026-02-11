<script setup>
import { ref, watch, inject } from 'vue'
import { supabase } from '../utils/supabase'
import { toJST, startRestTimer, toHalfWidthNumber } from '@/common/util'
import ChestExerciseSelect from '@/parts/ChestExerciseSelect.vue'
import cautionMessages from '@/common/cautionMessages.json'
import exerciseMaster from '@/common/exercise.json'

// emitイベント定義（親コンポーネントにTop遷移を通知）
const emit = defineEmits(['go-top'])

// フォームデータをrefで管理
const exercise = ref('') // 種目
const weight = ref('') // 重量
const sets = ref('') // セット数
const reps = ref('') // 回数
const comment = ref('') // メモ
const trainings = ref([]) // DBから取得した過去トレーニング
const restSeconds = ref(0) // インターバルタイマー
const cautionMessage = ref('') // 注意メッセージ
const showCautionScreen = ref(false) // フルスクリーン注意表示
const showCautionSidebar = ref(false) // 右側注意パネル表示
const isFetchAllSets = ref(false) // 前回日の全セット取得トグル
const username = inject('username')

// トレーニング開始ボタン押下時の処理
const startTraining = () => {
  showCautionScreen.value = false
  showCautionSidebar.value = true
}

// 選択種目 or セット数が変わったときDBから過去データ取得
watch([exercise, sets, isFetchAllSets], ([newExercise, newSets, toggle]) => {
  if (!newExercise) {
    trainings.value = []
    return
  }

  if (toggle) {
    fetchAllSetsFromLastDate(newExercise)
  } else if (newSets) {
    fetchTrainings(newExercise, parseInt(newSets))
  }
})

// 種目選択に応じて注意メッセージをセット
watch(exercise, (newVal) => {
  switch (newVal) {
    case 'ベンチプレス':
      cautionMessage.value = cautionMessages.BP
      break
    case 'インクラインベンチプレス':
      cautionMessage.value = cautionMessages.INBP
      break
    case 'ディップス':
      cautionMessage.value = cautionMessages.DIPS
      break
    case 'インクラインダンベルプレス':
      cautionMessage.value = cautionMessages.INDBFLY
      break
    case 'ダンベルフライ':
      cautionMessage.value = cautionMessages.DBFLY
      break
    case '腕立て伏せ':
      cautionMessage.value = cautionMessages.PUSHUP
      break
    default:
      cautionMessage.value = ''
      return
  }

  // 注意メッセージがあればフルスクリーン表示
  if (cautionMessage.value) {
    showCautionScreen.value = true
  }
})

// DBから過去のトレーニングを取得
const fetchTrainings = async (exerciseName, setCount) => {
  const { data, error } = await supabase
    .from('TraningDatabase')
    .select('*')
    .eq('muscle_group', '胸')
    .eq('exercise', exerciseName)
    .eq('name', username.value) // ← 追加
    .eq('sets', setCount)
    .order('training_date', { ascending: false })
    .limit(1)

  if (error) {
    console.error('取得エラー', error)
    trainings.value = []
    return
  }

  trainings.value = data
}

const fetchAllSetsFromLastDate = async (exerciseName) => {
  // ① 前回トレーニング日を取得
  const { data: latestData, error: latestError } = await supabase
    .from('TraningDatabase')
    .select('training_date')
    .eq('muscle_group', '胸')
    .eq('exercise', exerciseName)
    .eq('name', username.value) // ← 追加
    .order('training_date', { ascending: false })
    .limit(1)

  if (latestError || !latestData.length) {
    trainings.value = []
    return
  }

  const latestDate = latestData[0].training_date

  // ② その日の全セットを取得
  const { data, error } = await supabase
    .from('TraningDatabase')
    .select('*')
    .eq('muscle_group', '胸')
    .eq('exercise', exerciseName)
    .eq('name', username.value) // ← 追加
    .gte('training_date', latestDate.split('T')[0] + 'T00:00:00')
    .lte('training_date', latestDate.split('T')[0] + 'T23:59:59')
    .order('sets', { ascending: true })

  if (error) {
    trainings.value = []
    return
  }

  trainings.value = data
}

// OKボタン押下時の処理（DB登録＋インターバルタイマー）
const isOK = async (flag) => {
  if (!exercise.value || !weight.value || !reps.value) {
    alert('種目・重量・回数は必須です')
    return
  }
  await supabase.from('TraningDatabase').insert({
    name: username.value,
    training_date: new Date().toISOString(),
    muscle_group: '胸',
    exercise: exercise.value,
    weight: weight.value,
    sets: parseInt(sets.value),
    reps: reps.value,
    comment: comment.value,
  })

  // 休憩タイマー開始
  startRestTimer({
    seconds: getRestSecondsByExercise(),
    onTick: (sec) => {
      restSeconds.value = sec
    },
    onFinish: () => {
      alert('インターバル終了')
      // OKならフォームリセット、継続ならセット数+1
      if (flag === 'insert') {
        resetForm()
      } else {
        isContinue()
      }
    },
  })
}

const getRestSecondsByExercise = () => {
  if (!exercise.value) return 90 // 保険

  const found = exerciseMaster.exercises.find((e) => e.name_jp === exercise.value)

  return found?.rest_seconds ?? 90
}

// フォームを初期化
const resetForm = () => {
  exercise.value = ''
  weight.value = ''
  sets.value = ''
  reps.value = ''
  comment.value = ''
}

// 継続ボタン押下時：セット数+1、回数とコメントはクリア
const isContinue = () => {
  sets.value = parseInt(sets.value) + parseInt(1)
  reps.value = ''
  comment.value = ''
}

// YouTubeを開く
const musicOn = () => {
  window.open('https://www.youtube.com/watch?v=zLpsmg3W1qE', '_blank')
}

// Top画面へ遷移
const isTop = () => {
  emit('go-top')
}
</script>

<template>
  <!-- フルスクリーン注意画面 -->
  <div v-if="showCautionScreen" class="caution-screen">
    <div class="caution-content">
      <h2>⚠️ トレーニング前の注意 ⚠️</h2>
      <p class="caution-text">{{ cautionMessage }}</p>
      <!-- 左寄せ＋改行反映 -->
      <button @click="startTraining">トレーニング開始</button>
    </div>
  </div>

  <!-- 右端注意パネル -->
  <div v-if="showCautionSidebar" class="caution-sidebar">
    <h3>⚠️ 注意 ⚠️</h3>
    <p class="caution-text">{{ cautionMessage }}</p>
  </div>

  <h2>ChestDay</h2>
  <div class="header">
    <button @click="isTop">Top</button>
  </div>

  <div class="flex-box">
    <div class="training-box">
      <!-- 種目選択 -->
      <div class="row">
        <label>種目</label>
        <ChestExerciseSelect v-model="exercise" />
      </div>

      <!-- セット数 -->
      <div class="row small-input">
        <label>セット</label>
        <input type="text" v-model="sets" @input="sets = toHalfWidthNumber(sets)" />
      </div>

      <!-- 重量 -->
      <div class="row small-input">
        <label>重量(kg)</label>
        <input type="text" v-model="weight" @input="weight = toHalfWidthNumber(weight)" />
      </div>

      <!-- 回数 -->
      <div class="row small-input">
        <label>回数</label>
        <input type="text" v-model="reps" @input="reps = toHalfWidthNumber(reps)" />
      </div>

      <!-- コメント -->
      <div class="row large-input">
        <label>メモ</label>
        <textarea placeholder="フォーム・感覚など" v-model="comment"></textarea>
      </div>

      <div class="flex-row">
        <button @click="isOK('insert')">OK</button>
        <button @click="isOK('continue')">継続</button>
      </div>
    </div>

    <!-- 過去トレーニング表示 -->
    <div class="training-box" v-if="trainings.length">
      <h3>前回の記録</h3>
      <div class="row">
        <label>
          <input type="checkbox" v-model="isFetchAllSets" />
          前回日の全セットを表示
        </label>
      </div>
      <div v-for="t in trainings" :key="t.id" class="row">
        <div>日付：{{ toJST(t.training_date) }}</div>
        <div>セット：{{ t.sets }}</div>
        <div>種目：{{ t.exercise }}</div>
        <div>重量：{{ t.weight }} kg</div>
        <div>回数：{{ t.reps }} 回</div>
        <div>メモ：{{ t.comment }}</div>
        <hr />
      </div>
    </div>
  </div>

  <div v-if="restSeconds > 0" class="timer-box">インターバル：{{ restSeconds }} 秒</div>
  <button @click="musicOn">Music On</button>
</template>

<style scoped>
/* =========================
   全体
========================= */
h2 {
  text-align: center;
  margin-bottom: 12px;
  letter-spacing: 1px;
  font-size: 20px;
  color: #f5f5f5;
}

h3 {
  font-size: 18px;
}

.header {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.header button {
  padding: 10px 18px;
  font-size: 16px;
  background: transparent;
  border: 1px solid #00ffd5;
  color: #00ffd5;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 255, 213, 0.6);
}

/* =========================
   レイアウト
========================= */
.flex-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

/* PC：2カラム */
@media screen and (min-width: 768px) {
  .flex-box {
    flex-direction: row;
    max-width: 1100px;
    margin: 0 auto;
  }
}

/* =========================
   トレーニングボックス
========================= */
.training-box {
  flex: 1;
  margin-top: 20px;
  padding: 16px;
  background: #151515;
  border: 1px solid #00ffd5;
  border-radius: 12px;
  box-shadow:
    0 0 10px rgba(0, 255, 213, 0.3),
    inset 0 0 10px rgba(0, 255, 213, 0.1);
}

/* =========================
   行単位
========================= */
.row {
  display: flex;
  flex-direction: column;
  margin-bottom: 14px;
  font-size: 16px;
}

/* =========================
   ラベル
========================= */
label {
  font-size: 16px;
  margin-bottom: 6px;
  color: #9eece0;
}

/* =========================
   入力系
========================= */
input,
textarea {
  padding: 10px;
  background-color: #0f0f0f;
  border: 1px solid #444;
  color: #eaeaea;
  font-size: 16px;
  border-radius: 6px;
}

input::placeholder,
textarea::placeholder {
  font-size: 16px;
  color: #777;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #00ffd5;
  box-shadow: 0 0 6px rgba(0, 255, 213, 0.7);
}

textarea {
  resize: vertical;
}

/* =========================
   小さい入力欄
========================= */
.row.small-input input {
  width: 140px;
}

/* =========================
   コメント欄
========================= */
.row.large-input textarea {
  width: 100%;
  height: 120px;
}

/* =========================
   ボタン
========================= */
.flex-row {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.flex-row button {
  flex: 1;
  padding: 14px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: bold;
}

/* OK */
.flex-row button:first-child {
  background: #00ffd5;
  color: #000;
  box-shadow: 0 0 12px rgba(0, 255, 213, 0.8);
}

/* 継続 */
.flex-row button:last-child {
  background: transparent;
  color: #00ffd5;
  border: 1px solid #00ffd5;
}

/* =========================
   インターバルタイマー
========================= */
.timer-box {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 14px 18px;
  background: #000;
  border: 1px solid #00ffd5;
  border-radius: 10px;
  font-size: 18px;
  color: #00ffd5;
  font-weight: bold;
  z-index: 2000;
  box-shadow: 0 0 15px rgba(0, 255, 213, 0.9);
}

/* =========================
   フルスクリーン注意画面
========================= */
.caution-screen {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.95);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  color: #fff;
}

.caution-content {
  max-width: 900px;
  padding: 32px;
  background-color: #1a1a1a;
  border: 2px solid #ff4444;
  border-radius: 14px;
  text-align: center;
  box-shadow:
    0 0 20px rgba(255, 60, 60, 0.8),
    inset 0 0 10px rgba(255, 60, 60, 0.4);
}

.caution-content h2 {
  font-size: 22px;
  margin-bottom: 20px;
  color: #ff5555;
}

.caution-content p {
  font-size: 18px;
  line-height: 1.7;
  margin-bottom: 30px;
}

.caution-content button {
  padding: 14px 32px;
  font-size: 16px;
  background-color: #ff5555;
  border: none;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
}

/* =========================
   右下 注意サイドバー
========================= */
.caution-sidebar {
  position: fixed;
  bottom: 80px;
  right: 16px;
  width: calc(100% - 32px);
  max-width: 420px;
  background-color: #1a1a1a;
  border: 2px solid #ff5555;
  padding: 16px;
  border-radius: 10px;
  color: #fff;
  font-size: 16px;
  z-index: 1500;
  box-shadow: 0 0 15px rgba(255, 60, 60, 0.8);
}

.caution-sidebar h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #ff6666;
}

/* =========================
   注意文言
========================= */
.caution-text {
  white-space: pre-line;
  text-align: left;
  font-size: 16px;
  line-height: 1.6;
}

</style>
