<template>
  <q-page padding>

    <!-- HEADER -->
    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>

    <!-- SEM PERMISSÃO -->
    <q-banner
      v-if="!User.can('add_scaffold')"
      class="bg-warning text-black"
      rounded
    >
      {{ tdc('You do not have permission to access this feature') }}
    </q-banner>


    <!-- ===================================================== -->
    <!-- STEPPER -->
    <!-- ===================================================== -->
    <q-stepper v-else v-model="step" flat animated>

      <!-- ===================================================== -->
      <!-- STEP 1 MODULE -->
      <!-- ===================================================== -->
      <q-step :name="1" icon="folder" :title="tdc('Module')">

        <q-select
          v-model="form.modulo"
          :options="apps"
          option-label="name"
          option-value="name"
          emit-value
          map-options
          outlined
          :label="tdc('Select module')"
        />

      </q-step>


      <!-- ===================================================== -->
      <!-- STEP 2 MODEL -->
      <!-- ===================================================== -->
      <q-step :name="2" icon="schema" :title="tdc('Model')">

        <q-input
          v-model="form.modelo"
          outlined
          :label="tdc('Model name')"
        />

        <div v-if="modelExists" class="text-warning q-mt-sm">
          ⚠ {{ tdc('Model already exists. Editing mode enabled') }}
        </div>

        <q-chip
          v-for="m in existingModels"
          :key="m"
          dense
          outline
          class="q-mr-xs q-mt-xs"
        >
          {{ m }}
        </q-chip>

      </q-step>


      <!-- ===================================================== -->
      <!-- STEP 3 FIELDS (SEM DRAG) -->
      <!-- ===================================================== -->
      <q-step :name="3" icon="list" :title="tdc('Fields')">

        <div
          v-for="(f, i) in form.fields"
          :key="f.id"
          class="row q-col-gutter-sm items-center q-mb-sm"
        >

          <!-- reorder -->
          <q-btn flat dense icon="arrow_upward" @click="moveUp(i)" :disable="i===0"/>
          <q-btn flat dense icon="arrow_downward" @click="moveDown(i)" :disable="i===form.fields.length-1"/>

          <!-- name -->
          <div class="col-3">
            <q-input
              v-model="f.name"
              :label="autoLabel(f.name) || tdc('Name')"
              outlined
            />
          </div>

          <!-- type -->
          <div class="col-3">
            <q-select
              v-model="f.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              outlined
              :label="tdc('Type')"
            />
          </div>

          <!-- relation -->
          <div v-if="isRelation(f.type)" class="col-2">
            <q-select
              v-model="f.relModule"
              :options="apps"
              option-label="name"
              option-value="name"
              emit-value
              map-options
              outlined
              :label="tdc('Module')"
              @update:model-value="loadRelationModels(f)"
            />
          </div>

          <div v-if="isRelation(f.type)" class="col-2">
            <q-select
              v-model="f.relation"
              :options="f.relModels"
              outlined
              :label="tdc('Model')"
            />
          </div>

          <!-- file icon -->
          <q-icon
            v-if="isFile(f.type)"
            name="attach_file"
            color="primary"
          />

          <!-- delete -->
          <q-btn
            v-if="User.can('delete_scaffold')"
            flat
            dense
            icon="delete"
            color="negative"
            @click="removeField(i)"
          />

        </div>


        <!-- add -->
        <q-btn
          v-if="User.can('change_scaffold')"
          icon="add"
          outlined
          class="q-mt-md"
          :label="tdc('Add field')"
          @click="addField"
        />

      </q-step>


      <!-- ===================================================== -->
      <!-- STEP 4 PREVIEW -->
      <!-- ===================================================== -->
      <q-step :name="4" icon="code" :title="tdc('Preview')">
        <pre>{{ preview }}</pre>
      </q-step>


      <!-- ===================================================== -->
      <!-- NAV -->
      <!-- ===================================================== -->
      <template #navigation>

        <q-btn flat :label="tdc('Back')" @click="step--" :disable="step===1"/>

        <q-btn
          v-if="step<4"
          color="primary"
          :label="tdc('Next')"
          @click="nextStep"
        />

        <q-btn
          v-else
          color="positive"
          icon="rocket_launch"
          :label="modelExists ? tdc('Update') : tdc('Create')"
          :loading="loading"
          :disable="!User.can('change_scaffold')"
          @click="submit"
        />

      </template>

    </q-stepper>

  </q-page>
</template>


<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { HTTPAuth, tdc, autoLabel, UserStore } from './../../index'

const User = UserStore()

/* ===================================================== */

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

/* ===================================================== */
/* TYPES */
/* ===================================================== */

const rawTypes = [
  'CharField','TextField','IntegerField','DecimalField','BooleanField',
  'ForeignKey','OneToOneField','ManyToManyField',
  'FileField','ImageField','JSONField','MoneyField'
]

const typeOptions = computed(() =>
  rawTypes.map(t => ({ label: tdc(t), value: t }))
)

/* ===================================================== */

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)

/* ===================================================== */

function addField(){
  form.value.fields.push({
    id: Date.now()+Math.random(),
    name:'',
    type:'CharField',
    relModels:[]
  })
}

function removeField(i){
  form.value.fields.splice(i,1)
}

function moveUp(i){
  const arr = form.value.fields
  ;[arr[i-1],arr[i]]=[arr[i],arr[i-1]]
}

function moveDown(i){
  const arr = form.value.fields
  ;[arr[i+1],arr[i]]=[arr[i],arr[i+1]]
}

function isRelation(t){
  return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)
}

function isFile(t){
  return ['FileField','ImageField'].includes(t)
}

/* ===================================================== */
/* API */
/* ===================================================== */

async function loadApps(){
  const {data} = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps || []
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data} = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models || []
})

async function nextStep(){

  if(step.value===2 && modelExists.value){
    const {data} =
      await HTTPAuth.get(`/saas/modulos/${form.value.modulo}/${form.value.modelo}/schema/`)

    form.value.fields =
      data.fields.map(f=>({ id:Date.now()+Math.random(), ...f, relModels:[] }))
  }

  step.value++
}

async function loadRelationModels(field){
  const {data} =
    await HTTPAuth.get(`/saas/modulos/${field.relModule}/`)

  field.relModels = data.models
}

async function submit(){

  loading.value = true

  const {data} =
    await HTTPAuth.post('/saas/scaffold/', form.value)

  if(data.alert_success)
    Notify.create({ type:'positive', message:data.alert_success })

  if(data.alert_error)
    Notify.create({ type:'negative', message:data.alert_error })

  loading.value = false
}

/* ===================================================== */

onMounted(loadApps)
</script>
