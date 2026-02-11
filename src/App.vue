<script setup>
import { ref, onMounted } from 'vue'
import TraningView from '@/compornents/TraningView.vue'

const isMode = ref(false)
const username = ref('')
const isEntered = ref(false)
const currentMode = ref('training') // 'training' or 'graph'

// 名前入力処理
const enterName = () => {
  if (!username.value) return
  localStorage.setItem('username', username.value)
  isEntered.value = true
}

// 初回ロード時に名前があればスキップ
onMounted(() => {
  const savedName = localStorage.getItem('username')
  if (savedName) {
    username.value = savedName
    isEntered.value = true
  }
})

// モード切替
const showTraining = () => {
  currentMode.value = 'training'
  isMode.value = true
}

const showGraph = () => {
  currentMode.value = 'graph'
  isMode.value = true
}

const closeTraining = () => {
  isMode.value = false
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

      <div v-else class="main-contents">
        <div v-if="isMode">
          <TraningView :mode="currentMode" @close-training="closeTraining" />
        </div>

        <div v-else>
          <div class="header">
            <h1>Welcome {{ username }} 💪</h1>
          </div>

          <button @click="showTraining">Training💛</button>
          <button>Edit</button>
          <button>Setting</button>
          <button @click="showGraph">Graph💛</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
/* =========================
   全体レイアウト
========================= */
main {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background-color: #121212;
  color: #fff;
}

.login {
  width: 100%;
  max-width: 960px;
  padding: 16px;
}

/* =========================
   ログイン画面
========================= */
.loginform {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20vh;
}

.loginform input {
  padding: 12px;
  font-size: 16px;
}

.loginform button {
  padding: 12px;
  font-size: 16px;
}

/* =========================
   トップ画面
========================= */
.main-contents {
  width: 100%;
}

.header {
  margin-bottom: 24px;
}

/* メニューボタン */
.main-contents button {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
}

/* =========================
   PC向け微調整
========================= */
@media screen and (min-width: 769px) {
  .login {
    padding: 32px;
  }

  .loginform {
    max-width: 400px;
    margin: 20vh auto 0;
  }

  .main-contents button {
    max-width: 320px;
  }
}
</style>
