<template>
  <div>
    <div v-for="(c,i) in choices" :key="i" class="row q-gutter-sm">
      <q-input v-model="c[0]" dense/>
      <q-input v-model="c[1]" dense/>
    </div>

    <q-btn icon="add" flat @click="choices.push(['',''])"/>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
const choices = reactive([])
</script>
