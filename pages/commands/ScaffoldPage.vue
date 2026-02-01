<template>
  <q-page padding>

    <div class="text-h5 q-mb-lg">
      🔧 Scaffold Wizard
    </div>

    <q-stepper v-model="step" flat animated>

      <!-- ===================== -->
      <!-- STEP 1 - MODULE -->
      <!-- ===================== -->
      <q-step :name="1" title="Módulo" icon="folder">

        <q-select
          v-model="form.modulo"
          :options="apps"
          label="Selecionar módulo"
          filled
        />

      </q-step>


      <!-- ===================== -->
      <!-- STEP 2 - MODEL -->
      <!-- ===================== -->
      <q-step :name="2" title="Modelo" icon="schema">

        <q-input
          v-model="form.modelo"
          label="Nome do modelo"
          filled
        />

        <div v-if="existingModels.length" class="q-mt-md">
          <div class="text-caption text-grey">
            Modelos existentes:
          </div>

          <q-chip
            v-for="m in existingModels"
            :key="m"
            dense
            outline
          >
            {{ m }}
          </q-chip>
        </div>

      </q-step>


      <!-- ===================== -->
      <!-- STEP 3 - FIELDS -->
      <!-- ===================== -->
      <q-step :name="3" title="Campos" icon="list">

        <div
          v-for="(f, i) in form.fields"
          :key="i"
          class="row q-col-gutter-sm q-mb-sm"
        >
          <div class="col-4">
            <q-input v-model="f.name" label="Nome" filled />
          </div>

          <div class="col-4">
            <q-select v-model="f.type" :options="types" label="Tipo" filled />
          </div>

          <div class="col-3" v-if="isRelation(f.type)">
            <q-input v-model="f.relation" label="app.Model" filled />
          </div>

          <div class="col-1">
            <q-btn flat icon="delete" @click="removeField(i)" />
          </div>
        </div>

        <q-btn outline icon="add" label="Adicionar campo" @click="addField" />

      </q-step>


      <!-- ===================== -->
      <!-- STEP 4 - PREVIEW -->
      <!-- ===================== -->
      <q-step :name="4" title="Preview" icon="code">

        <q-tabs v-model="tab">
          <q-tab name="model" label="Model" />
          <q-tab name="serializer" label="Serializer" />
          <q-tab name="view" label="View" />
        </q-tabs>

        <q-separator />

        <q-tab-panels v-model="tab">

          <q-tab-panel name="model">
            <pre>{{ preview.model }}</pre>
          </q-tab-panel>

          <q-tab-panel name="serializer">
            <pre>{{ preview.serializer }}</pre>
          </q-tab-panel>

          <q-tab-panel name="view">
            <pre>{{ preview.view }}</pre>
          </q-tab-panel>

        </q-tab-panels>

      </q-step>


      <!-- ===================== -->
      <!-- NAV -->
      <!-- ===================== -->
      <template #navigation>

        <q-btn
          flat
          label="Voltar"
          @click="step--"
          :disable="step === 1"
        />

        <q-btn
          v-if="step < 4"
          color="primary"
          label="Próximo"
          @click="step++"
        />

        <q-btn
          v-else
          color="positive"
          icon="rocket_launch"
          label="Criar"
          :loading="loading"
          @click="submit"
        />

      </template>

    </q-stepper>

  </q-page>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import AUTHClient from 'boot/AUTHClient'

// -----------------------

const step = ref(1)
const loading = ref(false)
const tab = ref('model')

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

// -----------------------

const types = [
  'CharField',
  'TextField',
  'IntegerField',
  'DecimalField',
  'BooleanField',
  'ForeignKey',
  'ManyToManyField'
]

// -----------------------

function addField () {
  form.value.fields.push({ name: '', type: 'CharField' })
}

function removeField (i) {
  form.value.fields.splice(i, 1)
}

function isRelation (t) {
  return ['ForeignKey', 'ManyToManyField'].includes(t)
}

// -----------------------
// LOAD MODULES + MODELS
// -----------------------

async function loadApps () {
  const { data } = await AUTHClient.get('/saas/scaffold/')
  apps.value = data.apps
}

watch(() => form.value.modulo, async (m) => {
  if (!m) return

  const { data } = await AUTHClient.get(`/saas/${m}/schema/`)
  existingModels.value = data.models || []
})

// -----------------------
// PREVIEW CODE
// -----------------------

watch(form, () => {
  const name = form.value.modelo || 'Modelo'

  preview.value.model =
`class ${name}(BaseModel):
    pass`

  preview.value.serializer =
`class ${name}Serializer(BaseSerializer):
    class Meta:
        model = ${name}
        fields = "__all__"`

  preview.value.view =
`class ${name}APIView(BaseAPIView):
    queryset = ${name}.objects.all()
    serializer_class = ${name}Serializer`
}, { deep: true })

// -----------------------
// SUBMIT
// -----------------------

async function submit () {
  loading.value = true

  try {
    await AUTHClient.post('/api/django_saas/scaffold/', form.value)

    Notify.create({
      type: 'positive',
      message: 'Modelo criado 🚀'
    })

    step.value = 1
    form.value = { modulo: '', modelo: '', fields: [] }

  } finally {
    loading.value = false
  }
}

onMounted(loadApps)
</script>
