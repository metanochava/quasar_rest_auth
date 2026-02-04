<template>
  <q-page padding>

    <!-- ================= HEADER ================= -->
    <div class="text-h5 q-mb-lg">
      🔧 {{ tdc('Scaffold Wizard') }}
    </div>

    <!-- ================= PERMISSION ================= -->
    <q-banner
      v-if="!User.can('add_scaffold')"
      class="bg-warning text-black"
      rounded
    >
      {{ tdc('You do not have permission to access this feature') }}
    </q-banner>

    <!-- ================= STEPPER ================= -->
    <q-stepper v-else v-model="step" flat animated>

      <!-- ================================================= -->
      <!-- STEP 1 MODULE -->
      <!-- ================================================= -->
      <q-step :name="1" :title="tdc('Module')" icon="folder">

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


      <!-- ================================================= -->
      <!-- STEP 2 MODEL -->
      <!-- ================================================= -->
      <q-step :name="2" :title="tdc('Model')" icon="schema">

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
          dense outline
          class="q-mr-xs q-mt-xs"
        >
          {{ m }}
        </q-chip>

      </q-step>


      <!-- ================================================= -->
      <!-- STEP 3 FIELDS -->
      <!-- ================================================= -->
      <q-step :name="3" :title="tdc('Fields')" icon="list">

        <div
          v-for="(f,i) in form.fields"
          :key="f.id"
          class="q-mb-md bordered q-pa-sm rounded-borders bg-grey-1"
        >

          <!-- ================= BASIC ROW ================= -->
          <div class="row q-col-gutter-sm items-center">

            <q-btn flat dense icon="arrow_upward" @click="moveUp(i)" />
            <q-btn flat dense icon="arrow_downward" @click="moveDown(i)" />

            <div class="col-3">
              <q-input v-model="f.name" :label="tdc('Name')" outlined/>
            </div>

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

            <q-btn
              v-if="User.can('delete_scaffold')"
              flat dense icon="delete" color="negative"
              @click="removeField(i)"
            />
          </div>


          <!-- ================= OPTIONS ================= -->
          <div class="row q-col-gutter-sm q-mt-sm">

            <q-checkbox v-model="f.required" :label="tdc('Required')" />
            <q-checkbox v-model="f.unique" :label="tdc('Unique')" />

            <div class="col-2">
              <q-input v-model="f.default" :label="tdc('Default')" outlined/>
            </div>

            <div class="col-2">
              <q-input v-model="f.verbose_name" :label="tdc('Verbose name')" outlined/>
            </div>

            <div class="col-3">
              <q-input v-model="f.help_text" :label="tdc('Help text')" outlined/>
            </div>

          </div>


          <!-- ================= RELATION ================= -->
          <div v-if="isRelation(f.type)" class="row q-col-gutter-sm q-mt-sm">

            <div class="col-3">
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

            <div class="col-3">
              <q-select
                v-model="f.relation"
                :options="f.relModels"
                outlined
                :label="tdc('Model')"
              />
            </div>

          </div>


          <!-- ================= FILE OPTIONS ================= -->
          <div v-if="isFile(f.type)" class="row q-col-gutter-sm q-mt-sm">

            <div class="col-3">
              <q-input
                v-model="f.upload_to"
                outlined
                :label="tdc('Upload path')"
                placeholder="uploads/model/"
              />
            </div>

          </div>


          <!-- ================= NUMBER OPTIONS ================= -->
          <div v-if="isNumeric(f.type)" class="row q-col-gutter-sm q-mt-sm">

            <div class="col-2">
              <q-input v-model="f.min" type="number" outlined :label="tdc('Min')"/>
            </div>

            <div class="col-2">
              <q-input v-model="f.max" type="number" outlined :label="tdc('Max')"/>
            </div>

          </div>


          <!-- ================= DECIMAL ================= -->
          <div v-if="f.type==='DecimalField'" class="row q-col-gutter-sm q-mt-sm">

            <div class="col-2">
              <q-input v-model="f.max_digits" type="number" outlined label="max_digits"/>
            </div>

            <div class="col-2">
              <q-input v-model="f.decimal_places" type="number" outlined label="decimal_places"/>
            </div>

          </div>

        </div>


        <q-btn
          icon="add"
          outlined
          class="q-mt-md"
          :label="tdc('Add field')"
          @click="addField"
        />

      </q-step>


      <!-- ================================================= -->
      <!-- STEP 4 PREVIEW -->
      <!-- ================================================= -->
      <q-step :name="4" :title="tdc('Preview')" icon="code">

        <pre class="bg-grey-10 text-white q-pa-md">{{ preview }}</pre>

      </q-step>


      <!-- ================================================= -->
      <!-- NAV -->
      <!-- ================================================= -->
      <template #navigation>

        <q-btn flat :label="tdc('Back')" @click="step--"/>

        <q-btn v-if="step<4" color="primary" :label="tdc('Next')" @click="nextStep"/>

        <q-btn
          v-else
          color="positive"
          :label="modelExists ? tdc('Update') : tdc('Create')"
          @click="submit"
        />

        <q-btn
          v-if="modelExists && User.can('delete_scaffold')"
          color="negative"
          flat
          :label="tdc('Delete')"
          @click="deleteModel"
        />

      </template>

    </q-stepper>

  </q-page>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc, UserStore } from './../../index'
import { Notify } from 'quasar'

const User = UserStore()

const step = ref(1)
const apps = ref([])
const existingModels = ref([])

const form = ref({
  modulo:'',
  modelo:'',
  fields:[]
})

const preview = ref('')


/* ================= TYPES ================= */
const rawTypes = [
  'CharField','TextField','IntegerField','DecimalField','BooleanField',
  'DateField','DateTimeField','FloatField',
  'ForeignKey','OneToOneField','ManyToManyField',
  'FileField','ImageField','JSONField'
]

const typeOptions = computed(() =>
  rawTypes.map(t=>({label:tdc(t),value:t}))
)

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)


/* ================= HELPERS ================= */
function isRelation(t){
  return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)
}

function isFile(t){
  return ['FileField','ImageField'].includes(t)
}

function isNumeric(t){
  return ['IntegerField','FloatField','DecimalField'].includes(t)
}

function addField(){
  form.value.fields.push({ id:Date.now(), required:true })
}

function removeField(i){
  form.value.fields.splice(i,1)
}

function moveUp(i){
  const a=form.value.fields
  ;[a[i-1],a[i]]=[a[i],a[i-1]]
}

function moveDown(i){
  const a=form.value.fields
  ;[a[i+1],a[i]]=[a[i],a[i+1]]
}


/* ================= API ================= */
async function loadApps(){
  const {data}=await HTTPAuth.get('/saas/modulos/')
  apps.value=data.apps||[]
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data}=await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value=data.models||[]
})

async function nextStep(){
  if(step.value===2 && modelExists.value){
    const {data}=await HTTPAuth.get(`/saas/modulos/${form.value.modulo}/${form.value.modelo}/schema/`)
    form.value.fields=data.fields
  }
  step.value++
}

async function loadRelationModels(f){
  const {data}=await HTTPAuth.get(`/saas/modulos/${f.relModule}/`)
  f.relModels=data.models
}


/* ================= PREVIEW CODE ================= */
watch(form, ()=>{
  preview.value = generateModelCode()
},{deep:true})


function generateModelCode(){

  const fields = form.value.fields.map(f=>{
    let opts=[]

    if(!f.required) opts.push('blank=True')
    if(!f.required) opts.push('null=True')
    if(f.unique) opts.push('unique=True')
    if(f.default) opts.push(`default=${JSON.stringify(f.default)}`)
    if(f.upload_to) opts.push(`upload_to="${f.upload_to}"`)
    if(f.max_digits) opts.push(`max_digits=${f.max_digits}`)
    if(f.decimal_places) opts.push(`decimal_places=${f.decimal_places}`)

    return `    ${f.name} = models.${f.type}(${opts.join(', ')})`
  })

  return `
class ${form.value.modelo}(models.Model):

${fields.join('\n')}

    class Meta:
        verbose_name = "${form.value.modelo}"
`
}


/* ================= SUBMIT ================= */
async function submit(){
  const {data}=await HTTPAuth.post('/saas/scaffold/', form.value)
  Notify.create({ type:'positive', message:data.alert_success })
}

async function deleteModel(){
  await HTTPAuth.delete(`/saas/modulos/${form.value.modulo}/${form.value.modelo}/`)
  Notify.create({ type:'negative', message:tdc('Deleted') })
}


/* ================= INIT ================= */
onMounted(loadApps)
</script>
