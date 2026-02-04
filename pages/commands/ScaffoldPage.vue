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


    <!-- ============================ -->
    <!-- STEPPER -->
    <!-- ============================ -->
    <q-stepper
      v-else
      v-model="step"
      flat
      animated
    >

      <!-- ===================================== -->
      <!-- STEP 1 MODULE -->
      <!-- ===================================== -->
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


      <!-- ===================================== -->
      <!-- STEP 2 MODEL -->
      <!-- ===================================== -->
      <q-step :name="2" icon="schema" :title="tdc('Model')">

        <q-input
          v-model="form.modelo"
          outlined
          :label="tdc('Model name')"
        />

        <div v-if="modelExists" class="text-warning q-mt-sm">
          ⚠ {{ tdc('Model already exists. Editing mode enabled') }}
        </div>

        <div v-if="existingModels.length" class="q-mt-md">
          <q-chip
            v-for="m in existingModels"
            :key="m"
            outline
            dense
          >
            {{ m }}
          </q-chip>
        </div>

      </q-step>


      <!-- ===================================== -->
      <!-- STEP 3 FIELDS -->
      <!-- ===================================== -->
      <q-step :name="3" icon="list" :title="tdc('Fields')">

        <VueDraggable
          v-model="form.fields"
          item-key="id"
          handle=".drag"
        >

          <template #item="{ element, index }">

            <div class="row q-col-gutter-sm items-center q-mb-sm">

              <q-icon name="drag_indicator" class="drag cursor-pointer"/>

              <!-- NAME -->
              <div class="col-3">
                <q-input
                  v-model="element.name"
                  :label="autoLabel(element.name) || tdc('Name')"
                  outlined
                />
              </div>

              <!-- TYPE -->
              <div class="col-3">
                <q-select
                  v-model="element.type"
                  :options="typeOptions"
                  emit-value
                  map-options
                  option-label="label"
                  option-value="value"
                  :label="tdc('Type')"
                  outlined
                />
              </div>

              <!-- RELATION -->
              <div
                v-if="isRelation(element.type)"
                class="col-2"
              >
                <q-select
                  v-model="element.relModule"
                  :options="apps"
                  option-label="name"
                  option-value="name"
                  :label="tdc('Module')"
                  outlined
                  @update:model-value="loadRelationModels(element)"
                />
              </div>

              <div
                v-if="isRelation(element.type)"
                class="col-2"
              >
                <q-select
                  v-model="element.relation"
                  :options="element.relModels"
                  :label="tdc('Model')"
                  outlined
                />
              </div>

              <!-- FILE ICON -->
              <q-icon
                v-if="isFile(element.type)"
                name="attach_file"
                color="primary"
              />

              <!-- DELETE -->
              <q-btn
                v-if="User.can('delete_scaffold')"
                flat
                icon="delete"
                color="negative"
                @click="removeField(index)"
              />

            </div>

          </template>

        </VueDraggable>


        <q-btn
          v-if="User.can('change_scaffold')"
          class="q-mt-md"
          icon="add"
          outlined
          :label="tdc('Add field')"
          @click="addField"
        />

      </q-step>


      <!-- ===================================== -->
      <!-- STEP 4 PREVIEW -->
      <!-- ===================================== -->
      <q-step :name="4" icon="code" :title="tdc('Preview')">

        <pre>{{ preview }}</pre>

      </q-step>


      <!-- NAV -->
      <template #navigation>

        <q-btn flat :label="tdc('Back')" @click="step--" :disable="step===1"/>

        <q-btn v-if="step<4" color="primary" :label="tdc('Next')" @click="nextStep"/>

        <q-btn
          v-else
          color="positive"
          icon="rocket_launch"
          :label="modelExists ? tdc('Update') : tdc('Create')"
          :loading="loading"
          @click="submit"
        />

      </template>

    </q-stepper>

  </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { VueDraggable } from 'vue-draggable-plus'
import { HTTPAuth, tdc, autoLabel, UserStore } from './../../index'

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


/* ============================= */
/* TYPES */
/* ============================= */

const rawTypes = [
  'CharField','TextField','IntegerField','DecimalField','BooleanField',
  'ForeignKey','OneToOneField','ManyToManyField',
  'FileField','ImageField','JSONField'
]

const typeOptions = computed(() =>
  rawTypes.map(t => ({ label: tdc(t), value: t }))
)


/* ============================= */

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)


function isRelation(t){
  return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)
}

function isFile(t){
  return ['FileField','ImageField'].includes(t)
}


/* ============================= */

function addField(){
  form.value.fields.push({ id:Date.now(), name:'', type:'CharField', relModels:[] })
}

function removeField(i){
  form.value.fields.splice(i,1)
}


/* ============================= */

async function loadApps(){
  const {data} = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data} = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models
})


/* LOAD FIELDS SE EXISTIR */
async function nextStep(){
  if(step.value===2 && modelExists.value){
    const {data} = await HTTPAuth.get(`/saas/schema/${form.value.modulo}/${form.value.modelo}/`)
    form.value.fields = data.fields.map(f=>({ id:Date.now()+Math.random(), ...f }))
  }
  step.value++
}


/* RELATION */
async function loadRelationModels(field){
  const {data} = await HTTPAuth.get(`/saas/modulos/${field.relModule}/`)
  field.relModels = data.models
}


/* SUBMIT */
async function submit(){
  loading.value = true
  const {data} = await HTTPAuth.post('/saas/scaffold/', form.value)

  if(data.alert_success) Notify.create({type:'positive', message:data.alert_success})
  if(data.alert_error) Notify.create({type:'negative', message:data.alert_error})

  loading.value=false
}


/* INIT */
onMounted(loadApps)
</script>
