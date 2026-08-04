<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <input
    class="input"
    :value="modelValue"
    :placeholder="placeholder"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<style scoped lang="scss">
.input {
  width: 100%;
  height: 100%;
  border: 0;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  padding: 0 12px;
  font: inherit;
}
</style>
