<template>
  <q-page padding>

    <!-- HEADER -->
    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>

    <q-stepper v-model="step" flat animated>

      <!-- ========================= -->
      <!-- STEP 1 -->
      <!-- ========================= -->
       {{}}
      <q-step :name="1" :title="tdc('Module')" icon="folder">

        <q-select
          v-model="form.modulo"
          :options="apps"
          :label="tdc('Select module')"
          outlined
          option-label="name"
          option-value="name"
          emit-value
          map-options
        />

      </q-step>


      <!-- ========================= -->
      <!-- STEP 2 -->
      <!-- ========================= -->
      <q-step :name="2" :title="tdc('Model')" icon="schema">

        <q-input
          v-model="form.modelo"
          :label="tdc('Model name')"
          outlined
        />

        <div v-if="existingModels.length" class="q-mt-md">
          <div class="text-caption text-grey">
            {{ tdc('Existing models') }}
          </div>

          <q-chip
            v-for="m in existingModels"
            :key="m"
            dense
            outlined
          >
            {{ m }}
          </q-chip>
        </div>

      </q-step>


      <!-- ========================= -->
      <!-- STEP 3 — DRAG -->
      <!-- ========================= -->
      <q-step :name="3" :title="tdc('Fields')" icon="list">

        <VueDraggable
          v-model="form.fields"
          handle=".drag"
          item-key="id"
          class="column"
        >

          <template #item="{ element, index }">

            <div class="row q-col-gutter-sm q-mb-sm items-center">

              <q-icon name="drag_indicator" class="drag cursor-pointer" />

              <div class="col-3">
                <q-input
                  v-model="element.name"
                  :label="autoLabel(element.name) || tdc('Name')"
                  outlined
                />
              </div>

              <div class="col-3">
                <q-select
                  v-model="element.type"
                  :options="typeOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  :label="tdc('Type')"
                  outlined
                />
              </div>

              <div class="col-3" v-if="isRelation(element.type)">
                <q-input
                  v-model="element.relation"
                  :label="tdc('Relation app.Model')"
                  outlined
                />
              </div>

              <q-btn
                flat
                icon="delete"
                color="negative"
                @click="removeField(index)"
              />

            </div>

          </template>

        </VueDraggable>

        <q-btn
          class="q-mt-md"
          icon="add"
          outlined
          :label="tdc('Add field')"
          @click="addField"
        />

      </q-step>


      <!-- ========================= -->
      <!-- STEP 4 -->
      <!-- ========================= -->
      <q-step :name="4" :title="tdc('Preview')" icon="code">

        <q-tabs v-model="tab">
          <q-tab name="model" :label="tdc('Model')" />
          <q-tab name="serializer" :label="tdc('Serializer')" />
          <q-tab name="view" :label="tdc('View')" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab">
          <q-tab-panel name="model"><pre>{{ preview.model }}</pre></q-tab-panel>
          <q-tab-panel name="serializer"><pre>{{ preview.serializer }}</pre></q-tab-panel>
          <q-tab-panel name="view"><pre>{{ preview.view }}</pre></q-tab-panel>
        </q-tab-panels>

      </q-step>


      <!-- ========================= -->
      <!-- NAV -->
      <!-- ========================= -->
      <template #navigation>

        <q-btn flat :label="tdc('Back')" @click="step--" :disable="step===1" />

        <q-btn v-if="step<4" color="primary" :label="tdc('Next')" @click="step++" />

        <q-btn
          v-else
          color="positive"
          icon="rocket_launch"
          :label="tdc('Create')"
          :loading="loading"
          :disable="!canSubmit"
          @click="submit"
        />

      </template>

    </q-stepper>

  </q-page>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { VueDraggable } from 'vue-draggable-plus'
import { Notify } from 'quasar'

import { HTTPAuth, tdc, autoLabel } from '@metano/quasar_rest_auth'


const step = ref(1)
const tab = ref('model')
const loading = ref(false)

const apps = ref([])
const existingModels = ref([])

const form = ref({
  modulo: '',
  modelo: '',
  fields: []
})

const preview = ref({
  model: '',
  serializer: '',
  view: ''
})


const rawTypes = [
  'CharField','TextField','IntegerField','DecimalField','BooleanField',
  'ForeignKey','OneToOneField','ManyToManyField',
  'FileField','ImageField','JSONField','MoneyField'
]

const typeOptions = computed(() =>
  rawTypes.map(t => ({ label: tdc(t), value: t }))
)

const canSubmit = computed(() =>
  form.value.modulo && form.value.modelo && form.value.fields.length
)

function addField() {
  form.value.fields.push({ id: Date.now(), name: '', type: 'CharField' })
}

function removeField(i) {
  form.value.fields.splice(i, 1)
}

function isRelation(t) {
  return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)
}

function notifyFromApi(data) {
  if (data?.alert_success) Notify.create({ type:'positive', message:data.alert_success })
  if (data?.alert_error) Notify.create({ type:'negative', message:data.alert_error })
  if (data?.alert_warning) Notify.create({ type:'warning', message:data.alert_warning })
}

async function loadApps() {
  const { data } = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps || []
}

watch(() => form.value.modulo, async (m) => {
  if (!m) return
  const { data } = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models || []
})

watch(form, async () => {
  if (!form.value.modelo) return
  const { data } = await HTTPAuth.post('/saas/scaffold-preview/', form.value)
  preview.value = data
}, { deep:true })

async function submit() {
  loading.value = true
  try {
    const { data } = await HTTPAuth.post('/saas/scaffold/', form.value)
    notifyFromApi(data)
    step.value = 1
    form.value = { modulo:'', modelo:'', fields:[] }
  } finally {
    loading.value = false
  }
}

const route = useRoute()

onMounted(() => {
  loadApps()
  if (route.query.module) form.value.modulo = route.query.module
})
</script>
