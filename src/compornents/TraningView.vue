<script setup>
import { ref } from 'vue'
import ChestTraining from '@/compornents/Chest.vue'
import ChestGraph from '@/compornents/ChestGraph.vue'

const props = defineProps({
  mode: String // 'training' または 'graph'
})

const emit = defineEmits(['close-training'])

const currentView = ref(null) // null or 'Chest'

const onChest = () => {
  currentView.value = 'Chest'
}

const goTop = () => {
  currentView.value = null
  emit('close-training')
}
</script>

<template>
  <section class="training">
    <h2 class="title">
      {{ props.mode === 'training' ? 'Training' : 'Graph' }}
    </h2>

    <!-- Chest画面 -->
    <div v-if="currentView === 'Chest'">
      <ChestTraining v-if="props.mode === 'training'" @go-top="goTop" />
      <ChestGraph v-else @go-top="goTop" />
    </div>

    <!-- メニュー -->
    <div v-else class="menu">
      <button class="menu-btn" @click="onChest">Chest 💛</button>
      <button class="menu-btn disabled">Back</button>
      <button class="menu-btn disabled">Shoulder</button>
      <button class="menu-btn disabled">Arm</button>
      <button class="menu-btn disabled">Leg</button>

      <button class="menu-btn cancel" @click="emit('close-training')">
        Cancel
      </button>
    </div>
  </section>
</template>

<style scoped>
/* =========================
   全体
========================= */
.training {
  width: 100%;
  min-height: 100vh;
  padding: 16px;
  background-color: #121212;
  color: #fff;
}

/* タイトル */
.title {
  margin-bottom: 20px;
  text-align: center;
}

/* =========================
   メニュー画面
========================= */
.menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* メニューボタン */
.menu-btn {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  border-radius: 10px;
  border: none;
  background-color: #2a2a2a;
  color: #fff;
  cursor: pointer;
}

/* 未実装 */
.menu-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* キャンセル */
.menu-btn.cancel {
  background-color: #444;
}

/* =========================
   トレーニング表示エリア
========================= */
.training-view {
  width: 100%;
}

/* =========================
   PC向け
========================= */
@media screen and (min-width: 769px) {
  .training {
    max-width: 720px;
    margin: 0 auto;
    padding: 32px;
  }

  .menu-btn {
    font-size: 18px;
    padding: 18px;
  }
}
</style>
