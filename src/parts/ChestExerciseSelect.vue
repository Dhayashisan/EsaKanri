<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const chestExercises = [
  'ベンチプレス',
  'インクラインベンチプレス',
  'ディップス',  
  'インクラインダンベルプレス',
  'ダンベルフライ',
  '腕立て伏せ'
]

const onChange = (e) => {
  emit('update:modelValue', e.target.value)
}
</script>

<template>
  <div class="row">
    <select :value="modelValue" @change="onChange">
      <option value="">選択してください</option>
      <option
        v-for="ex in chestExercises"
        :key="ex"
        :value="ex"
      >
        {{ ex }}
      </option>
    </select>
  </div>
</template>

<style scoped>
select {
  padding: 8px;
  background-color: #2a2a2a;
  border: 1px solid #666;
  color: #ffffff;
  font-size: 14px;
}

option {
  background-color: #2a2a2a;
  color: #ffffff;
}
</style>