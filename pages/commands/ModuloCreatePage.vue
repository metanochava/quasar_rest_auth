<template>
  <q-page padding>

    <div class="text-h5 q-mb-lg">
      📦 Criar Módulo
    </div>

    <q-card flat bordered class="q-pa-lg" style="max-width: 500px">

      <!-- nome -->
      <q-input
        v-model="name"
        label="Nome do módulo"
        hint="ex: rh, finance, crm"
        filled
        autofocus
        @keyup.enter="createModule"
      />

      <!-- botão -->
      <q-btn
        class="q-mt-md full-width"
        color="primary"
        icon="add"
        label="Criar"
        :loading="loading"
        @click="createModule"
      />

    </q-card>


    <!-- módulos existentes -->
    <div class="q-mt-xl">

      <div class="text-subtitle2 q-mb-sm">
        Módulos existentes
      </div>

      <q-chip
        v-for="app in apps"
        :key="app"
        outline
        class="q-mr-sm q-mb-sm"
      >
        {{ app }}
      </q-chip>

    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Notify } from 'quasar'
import { HTTPAuth } from '../../boot/api'

// ----------------------------------

const name = ref('')
const loading = ref(false)
const apps = ref([])

// ----------------------------------

async function loadApps () {
  const { data } = await HTTPAuth.get('/saas/scaffold/')
  apps.value = data.apps
}

// ----------------------------------

async function createModule () {

  if (!name.value) return

  loading.value = true

  try {
    const { data } = await HTTPAuth.post(
      '/saas/modulo/',
      { name: name.value }
    )

    Notify.create({
      type: 'positive',
      message: data.message || 'Módulo criado 🚀'
    })

    name.value = ''
    await loadApps()

  } catch (err) {

    Notify.create({
      type: 'negative',
      message: err.response?.data?.error || 'Erro ao criar módulo'
    })

  } finally {
    loading.value = false
  }
}

onMounted(loadApps)
</script>
