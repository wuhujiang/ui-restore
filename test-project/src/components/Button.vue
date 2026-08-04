<script setup lang="ts">
defineProps<{
  type?: 'primary' | 'default'
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
}>()
</script>

<template>
  <button class="btn" :disabled="disabled" :data-type="type" :data-size="size">
    <slot />
  </button>
</template>

<style scoped lang="scss">
.btn {
  border: 0;
  cursor: pointer;
  font: inherit;
  background: transparent;
  color: inherit;
  padding: 0;
  width: 100%;
  height: 100%;
}
</style>
