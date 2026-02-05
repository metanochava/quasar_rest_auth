<template>
  <q-page padding>

    <!-- HEADER -->
    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>


    <!-- ================= PERMISSION ================= -->
    <q-banner
      v-if="!User.can('add_scaffold')"
      class="bg-warning text-black"
      rounded
    >
      {{ tdc('You do not have permission') }}
    </q-banner>


    <!-- ================= STEPPER ================= -->
    <q-stepper
      v-else
      v-model="step"
      flat
      animated
    >

      <!-- ========================================= -->
      <!-- STEP 1 MODULE -->
      <!-- ========================================= -->
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



      <!-- ========================================= -->
      <!-- STEP 2 MODEL -->
      <!-- ========================================= -->
      <q-step :name="2" icon="schema" :title="tdc('Model')">

        <q-input
          v-model="form.modelo"
          outlined
          :label="tdc('Model name')"
        />

        <div v-if="modelExists" class="text-warning q-mt-sm">
          ⚠ {{ tdc('Editing existing model') }}
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



      <!-- ========================================= -->
      <!-- STEP 3 FIELDS -->
      <!-- ========================================= -->
      <q-step :name="3" icon="list" :title="tdc('Fields')">

        <!-- TABLE STYLE (excel-like) -->
        <q-table
          flat
          dense
          :rows="form.fields"
          :columns="columns"
          row-key="id"
          hide-pagination
        >

          <!-- NAME -->
          <template #body-cell-name="p">
            <q-input dense v-model="p.row.name"/>
          </template>

          <!-- TYPE -->
          <template #body-cell-type="p">
            <q-select dense
              v-model="p.row.type"
              :options="typeOptions"
              emit-value map-options
            />
          </template>

          <!-- REQUIRED -->
          <template #body-cell-required="p">
            <q-toggle v-model="p.row.required"/>
          </template>

          <!-- UNIQUE -->
          <template #body-cell-unique="p">
            <q-toggle v-model="p.row.unique"/>
          </template>

          <!-- LENGTH -->
          <template #body-cell-length="p">
            <div class="row">
              <q-input dense style="width:60px" v-model="p.row.min_length" placeholder="min"/>
              <q-input dense style="width:60px" v-model="p.row.max_length" placeholder="max"/>
            </div>
          </template>

          <!-- NUMERIC -->
          <template #body-cell-minmax="p">
            <div class="row">
              <q-input dense style="width:60px" v-model="p.row.min"/>
              <q-input dense style="width:60px" v-model="p.row.max"/>
            </div>
          </template>

          <!-- RELATION -->
          <template #body-cell-relation="p">
            <div v-if="isRelation(p.row.type)" class="row">
              <q-select dense
                v-model="p.row.relModule"
                :options="apps"
                option-label="name"
                option-value="name"
                @update:model-value="loadRelationModels(p.row)"
              />
              <q-select dense
                v-model="p.row.relation"
                :options="p.row.relModels"
              />
              <q-select dense
                v-model="p.row.on_delete"
                :options="onDeleteOptions"
              />
            </div>
          </template>

          <!-- FILE -->
          <template #body-cell-file="p">
            <div v-if="isFile(p.row.type)" class="row">
              <q-toggle v-model="p.row.customUpload"/>
              <q-input
                v-if="p.row.customUpload"
                dense
                v-model="p.row.upload_to"
                placeholder="uploads/"
              />
            </div>
          </template>

          <!-- ACTIONS -->
          <template #body-cell-actions="p">
            <q-btn dense flat icon="arrow_upward" @click="moveUp(p.pageIndex)"/>
            <q-btn dense flat icon="arrow_downward" @click="moveDown(p.pageIndex)"/>
            <q-btn
              v-if="User.can('delete_scaffold')"
              dense flat color="negative" icon="delete"
              @click="removeField(p.pageIndex)"
            />
          </template>

        </q-table>


        <q-btn
          v-if="User.can('change_scaffold')"
          icon="add"
          outlined
          class="q-mt-md"
          :label="tdc('Add field')"
          @click="addField"
        />

      </q-step>



      <!-- ========================================= -->
      <!-- STEP 4 PREVIEW -->
      <!-- ========================================= -->
      <q-step :name="4" icon="code" :title="tdc('Preview')">

        <q-btn
          icon="refresh"
          outline
          class="q-mb-md"
          :label="tdc('Generate preview')"
          @click="generatePreview"
        />

        <pre style="max-height:500px;overflow:auto">{{ preview.model }}</pre>

      </q-step>



      <!-- ========================================= -->
      <!-- NAV -->
      <!-- ========================================= -->
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
          @click="submit"
        />

      </template>

    </q-stepper>

  </q-page>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Notify } from 'quasar'
import { HTTPAuth, tdc, UserStore } from './../../index'

const User = UserStore()

const step = ref(1)
const loading = ref(false)

const apps = ref([])
const existingModels = ref([])

const preview = ref({ model:'' })

const form = ref({
  modulo:'',
  modelo:'',
  fields:[],
  permissions:[]
})

/* ================= TABLE COLUMNS ================= */
const columns = [
  {name:'name',label:'Name',field:'name'},
  {name:'type',label:'Type',field:'type'},
  {name:'required',label:'Req',field:'required'},
  {name:'unique',label:'Uniq',field:'unique'},
  {name:'length',label:'Len',field:'len'},
  {name:'minmax',label:'Min/Max',field:'mm'},
  {name:'relation',label:'Relation',field:'rel'},
  {name:'file',label:'Upload',field:'file'},
  {name:'actions',label:'',field:'a'}
]


/* ================= TYPES ================= */
const rawTypes = [
'CharField','TextField','SlugField','EmailField','URLField','UUIDField',
'IntegerField','BigIntegerField','SmallIntegerField','PositiveIntegerField',
'PositiveSmallIntegerField','FloatField','DecimalField',
'BooleanField','DateField','DateTimeField','TimeField','DurationField',
'FileField','ImageField','JSONField',
'ForeignKey','OneToOneField','ManyToManyField'
]

const typeOptions = computed(() => rawTypes.map(t=>({label:t,value:t})))

const onDeleteOptions = ['CASCADE','PROTECT','SET_NULL','DO_NOTHING','RESTRICT']

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)


/* ================= HELPERS ================= */
function addField(){
  form.value.fields.push({
    id:Date.now(),
    name:'',
    type:'CharField',
    required:true,
    unique:false,
    relModels:[]
  })
}

function removeField(i){ form.value.fields.splice(i,1) }
function moveUp(i){ if(i>0) [form.value.fields[i-1],form.value.fields[i]]=[form.value.fields[i],form.value.fields[i-1]] }
function moveDown(i){ if(i<form.value.fields.length-1) [form.value.fields[i+1],form.value.fields[i]]=[form.value.fields[i],form.value.fields[i+1]] }

function isRelation(t){ return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t) }
function isFile(t){ return ['FileField','ImageField'].includes(t) }


/* ================= API ================= */
async function loadApps(){
  const {data}=await HTTPAuth.get('/saas/modulos/')
  apps.value=data.apps
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data}=await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value=data.models
})


async function loadRelationModels(field){
  const {data}=await HTTPAuth.get(`/saas/modulos/${field.relModule}/`)
  field.relModels=data.models
}

async function generatePreview(){
  const {data}=await HTTPAuth.post('/saas/scaffold/preview/',form.value)
  preview.value=data
}

async function submit(){
  loading.value=true
  await HTTPAuth.post('/saas/scaffold/',form.value)
  loading.value=false
  Notify.create({type:'positive',message:'Saved'})
}

function nextStep(){
  if(step.value===2 && modelExists.value){
    HTTPAuth.get(`/saas/modulos/${form.value.modulo}/${form.value.modelo}/schema/`)
      .then(({data})=> form.value.fields=data.fields)
  }
  step.value++
}

onMounted(loadApps)
</script>
