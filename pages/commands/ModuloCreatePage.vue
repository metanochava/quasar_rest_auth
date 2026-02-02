<template>
  <q-page padding>
    <div class="text-h5 q-mb-lg">
      📦 Módulos
    </div>

    <div class="row q-col-gutter-lg">

      <!-- ================================= -->
      <!-- LEFT: CARDS DE MÓDULOS -->
      <!-- ================================= -->
      <div class="col-12 col-md-7">

        <div class="row q-col-gutter-md">
          <!-- ================================= -->
          <!-- RIGHT: CRIAR -->
          <!-- ================================= -->
          <div class="col-12 col-md-3">
            <q-card bordered flat class="q-pa-lg">
              <div class="text-h6 q-mb-md">
                ➕ Criar Módulo
              </div>

              <q-input
                v-model="name"
                label="Nome do módulo"
                filled
                @keyup.enter="createModule"
              />

              <q-btn
                class="q-mt-md full-width"
                color="primary"
                icon="add"
                label="Criar"
                :loading="loading"
                @click="createModule"
              />
            </q-card>
          </div>


          <div
            v-for="app in apps"
            :key="app.name"
            class="col-12 col-sm-9"
          >
            <q-card bordered class="module-card">

              <q-card-section class="row items-center">

                <q-icon name="folder" size="28px" />

                <div class="text-subtitle1 q-ml-sm">
                  {{ app.name }}
                </div>

                <q-space />

                <!-- badge models -->
                <q-badge color="primary">
                  {{ app.models }}
                </q-badge>

              </q-card-section>

              <q-separator />

              <q-card-actions align="between">

                <!-- abrir scaffold -->
                <q-btn
                  flat
                  color="primary"
                  icon="build"
                  label="Abrir"
                  @click="openScaffold(app.name)"
                />

                <!-- apagar -->
                <q-btn
                  flat
                  round
                  color="negative"
                  icon="delete"
                  @click="confirmDelete(app.name)"
                />

              </q-card-actions>
            </q-card>
          </div>
        </div>
      </div>
    </div>

  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Notify, Dialog } from 'quasar'
import { useRouter } from 'vue-router'
import { HTTPAuth } from '../../boot/api'

// ----------------------------------

const router = useRouter()

const name = ref('')
const loading = ref(false)
const apps = ref([])

// ----------------------------------
// LOAD
// ----------------------------------

async function loadApps () {
  const { data } = await HTTPAuth.get('/saas/scaffold/')
  apps.value = data.apps
}

// ----------------------------------
// CREATE
// ----------------------------------

async function createModule () {

  if (!name.value) return

  loading.value = true

  try {

    await HTTPAuth.post('/saas/modulo/', { name: name.value })

    Notify.create({
      type: 'positive',
      message: 'Módulo criado 🚀'
    })

    name.value = ''
    await loadApps()

  } finally {
    loading.value = false
  }
}

// ----------------------------------
// DELETE
// ----------------------------------

function confirmDelete(app) {

  Dialog.create({
    title: 'Confirmar',
    message: `Tem a certeza que deseja apagar o módulo "${app}"?`,
    cancel: true,
    persistent: true
  }).onOk(() => deleteModule(app))
}

async function deleteModule(app) {

  await HTTPAuth.delete(`/saas/modulo/${app}/`)

  Notify.create({
    type: 'positive',
    message: 'Módulo removido'
  })

  loadApps()
}

// ----------------------------------
// OPEN SCAFFOLD
// ----------------------------------

function openScaffold(app) {
  // router.push(`/dev/scaffold?module=${app}`)
  router.push({ name: 'view_scaffold', params: {modulo: app } })
}

// ----------------------------------

onMounted(loadApps)
</script>

<style scoped>
.module-card {
  transition: 0.2s;
}
.module-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 14px rgba(0,0,0,0.12);
}
</style>
