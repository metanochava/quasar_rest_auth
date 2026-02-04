<template>
  <q-page padding>

    <!-- HEADER -->
    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>

    <!-- PERMISSÃO -->
    <q-banner v-if="!User.can('add_scaffold')" class="bg-warning text-black">
      {{ tdc('No permission') }}
    </q-banner>


    <q-stepper
      v-else
      v-model="step"
      flat
      animated
    >

      <!-- STEP 1 -->
      <q-step :name="1" :title="tdc('Module')">
        <q-select
          v-model="form.modulo"
          :options="apps"
          option-label="name"
          option-value="name"
          emit-value
          map-options
          outlined
        />
      </q-step>


      <!-- STEP 2 -->
      <q-step :name="2" :title="tdc('Model')">

        <q-input v-model="form.modelo" outlined />

        <q-banner
          v-if="modelExists"
          class="bg-info text-white q-mt-sm"
        >
          {{ tdc('Edit mode enabled') }}
        </q-banner>

      </q-step>


      <!-- STEP 3 -->
      <q-step :name="3" :title="tdc('Fields')">

        <FieldRow
          v-for="f in form.fields"
          :key="f.id"
          v-model="f"
          :apps="apps"
          :can-delete="User.can('delete_scaffold')"
          @delete="removeField(f)"
        />

        <q-btn
          v-if="User.can('change_scaffold')"
          icon="add"
          outlined
          class="q-mt-md"
          @click="addField"
          :label="tdc('Add field')"
        />

      </q-step>


      <!-- STEP 4 -->
      <q-step :name="4" :title="tdc('Preview')">

        <DiffViewer
          :old="oldCode"
          :new="preview"
        />

        <q-btn
          icon="download"
          class="q-mt-md"
          @click="download"
          label="Export .py"
        />

      </q-step>


      <!-- NAV -->
      <template #navigation>

        <q-btn flat @click="step--">Back</q-btn>

        <q-btn v-if="step<4" color="primary" @click="nextStep">
          Next
        </q-btn>

        <q-btn
          v-else
          color="positive"
          :loading="loading"
          @click="submit"
        >
          {{ modelExists ? 'Update' : 'Create' }}
        </q-btn>

      </template>

    </q-stepper>

  </q-page>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { HTTPAuth, tdc, UserStore } from '@/index'

import FieldRow from './../scaffold/FieldRow.vue'
import DiffViewer from './../scaffold/DiffViewer.vue'

const User = UserStore()

const step = ref(1)
const loading = ref(false)

const apps = ref([])
const existingModels = ref([])

const form = ref({
  modulo: '',
  modelo: '',
  fields: []
})

const preview = ref('')
const oldCode = ref('')

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)

function addField() {
  form.value.fields.push({
    id: Date.now(),
    name: '',
    type: 'CharField'
  })
}

function removeField(f) {
  form.value.fields =
    form.value.fields.filter(x => x !== f)
}

async function loadApps() {
  const { data } = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps
}

watch(() => form.value.modulo, async m => {
  if (!m) return
  const { data } = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models
})

async function nextStep() {
  if (step.value === 2 && modelExists.value) {
    const { data } =
      await HTTPAuth.get(`/saas/scaffold/?module=${form.value.modulo}&model=${form.value.modelo}`)

    form.value.fields = data.fields
  }
  step.value++
}

async function submit() {
  loading.value = true

  const { data } =
    await HTTPAuth.post('/saas/scaffold/', form.value)

  Notify.create({
    type: 'positive',
    message: data.alert_success || 'Saved'
  })

  loading.value = false
}

function download() {
  const blob = new Blob([preview.value])
  const url = URL.createObjectURL(blob)
  window.open(url)
}

onMounted(loadApps)
</script>
