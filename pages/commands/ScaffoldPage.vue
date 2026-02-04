<template>
  <q-page padding>

    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>

    <!-- PERMISSION -->
    <q-banner v-if="!User.can('add_scaffold')" class="bg-warning text-black">
      {{ tdc('No permission') }}
    </q-banner>


    <q-stepper v-else v-model="step" flat animated>

      <!-- STEP 1 MODULE -->
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


      <!-- STEP 2 MODEL -->
      <q-step :name="2" :title="tdc('Model')">

        <q-input v-model="form.modelo" outlined />

        <q-banner v-if="modelExists" class="bg-info text-white q-mt-sm">
          {{ tdc('Editing existing model') }}
        </q-banner>

      </q-step>


      <!-- STEP 3 FIELDS -->
      <q-step :name="3" :title="tdc('Fields')">

        <div
          v-for="(f,i) in form.fields"
          :key="f.id"
          class="row q-col-gutter-sm q-mb-sm items-center"
        >

          <div class="col-3">
            <q-input v-model="f.name" label="name" dense outlined />
          </div>

          <div class="col-3">
            <q-select
              v-model="f.type"
              :options="types"
              dense outlined
            />
          </div>

          <q-checkbox v-model="f.required" label="req"/>
          <q-checkbox v-model="f.unique" label="unique"/>

          <q-input v-model="f.default" dense outlined label="default"/>

          <q-btn
            v-if="User.can('delete_scaffold')"
            icon="delete"
            flat
            color="negative"
            @click="form.fields.splice(i,1)"
          />

        </div>

        <q-btn
          icon="add"
          flat
          @click="addField"
          v-if="User.can('change_scaffold')"
        >
          {{ tdc('Add field') }}
        </q-btn>

      </q-step>


      <!-- STEP 4 PREVIEW -->
      <q-step :name="4" :title="tdc('Preview')">

        <pre class="bg-grey-10 text-white q-pa-md">
{{ preview }}
        </pre>

      </q-step>


      <!-- NAV -->
      <template #navigation>

        <q-btn flat @click="step--" :disable="step===1">Back</q-btn>

        <q-btn v-if="step<4" color="primary" @click="nextStep">Next</q-btn>

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

const User = UserStore()

const step = ref(1)
const loading = ref(false)

const apps = ref([])
const existingModels = ref([])

const form = ref({
  modulo:'',
  modelo:'',
  fields:[]
})

const preview = ref('')

const types = [
  'CharField','TextField','IntegerField','BooleanField',
  'ForeignKey','FileField','ImageField','JSONField'
]

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)

function addField(){
  form.value.fields.push({
    id: Date.now(),
    name:'',
    type:'CharField'
  })
}


async function loadApps(){
  const {data} = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data} = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models
})


async function nextStep(){
  if(step.value===2 && modelExists.value){
    const {data} = await HTTPAuth.get(`/saas/scaffold/?module=${form.value.modulo}&model=${form.value.modelo}`)
    form.value.fields = data.fields
  }

  if(step.value===3){
    preview.value = JSON.stringify(form.value, null, 2)
  }

  step.value++
}


async function submit(){
  loading.value=true

  const {data} = await HTTPAuth.post('/saas/scaffold/', form.value)

  Notify.create({
    type:'positive',
    message:data.alert_success || 'Saved'
  })

  loading.value=false
}

onMounted(loadApps)
</script>
