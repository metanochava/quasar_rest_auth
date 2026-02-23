<template>
  <q-page padding>
    <AutoCrud :module="module" :model="model" :can="User.can"/>
  </q-page>
</template>

<script setup>
import { ref, watch, computed} from 'vue'
import { useRoute } from 'vue-router'
import AutoCrud from './AutoCrud.vue'
import { UserStore } from '../../stores/AuthStore'

const User = UserStore()
const route = useRoute()

// estado
const module = computed(() => route.params.module)
const model = computed(() => route.params.model)

// 🔥 WATCH REATIVO DA ROTA
// watch(
//   () => route.params,
//   (params) => {
//     if (!params?.module || !params?.model) return

//     module.value = params.module
//     model.value = params.model
//   },
//   { immediate: true }
// )
</script>
