<template>
  <q-input
    v-model="json"
    type="textarea"
    autogrow
    outlined
  />
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ modelValue:Object })
const emit = defineEmits(['update:modelValue'])

const json = computed({
  get: () => JSON.stringify(props.modelValue, null, 2),
  set: v => emit('update:modelValue', JSON.parse(v || '{}'))
})
</script>
