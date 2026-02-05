<template>
<q-page padding class="bg-grey-2">

  <!-- ===================================================== -->
  <!-- HEADER STICKY -->
  <!-- ===================================================== -->
  <div class="wizard-header bg-primary text-white q-pa-md">

    <div class="row items-center justify-between">

      <div class="text-h6">
        🔧 {{ tdc('Scaffold IDE') }}
      </div>

      <div class="row q-gutter-sm">

        <q-btn
          v-if="User.can('delete_scaffold') && modelExists"
          color="negative"
          icon="delete"
          @click="deleteModel"
        />

        <q-btn
          v-if="User.can('change_scaffold')"
          color="positive"
          icon="save"
          :loading="loading"
          :label="modelExists ? tdc('Update') : tdc('Create')"
          @click="submit"
        />

      </div>

    </div>
  </div>


  <!-- ===================================================== -->
  <!-- MODULE / MODEL -->
  <!-- ===================================================== -->
  <div class="row q-col-gutter-md q-mt-md">

    <div class="col-3">
      <q-select
        v-model="form.modulo"
        :options="apps"
        option-label="name"
        option-value="name"
        emit-value
        outlined
        :label="tdc('Module')"
      />
    </div>

    <div class="col-3">
      <q-input
        v-model="form.modelo"
        outlined
        :error="modelExists"
        :error-message="tdc('Edit mode')"
        :label="tdc('Model')"
      />
    </div>

  </div>


  <!-- ===================================================== -->
  <!-- FIELDS -->
  <!-- ===================================================== -->
  <div class="q-mt-lg">

    <div
      v-for="(f,i) in form.fields"
      :key="f.id"
      class="q-mb-md"
    >

      <q-card flat bordered>

        <!-- HEADER -->
        <q-card-section
          class="row items-center cursor-pointer"
          @click="f.open=!f.open"
        >

          <q-icon :name="f.open?'expand_more':'chevron_right'" />
          <div class="q-ml-sm text-subtitle2">{{ f.name || 'field_'+(i+1) }}</div>

          <q-space/>

          <q-chip dense outline>{{ f.type }}</q-chip>

          <q-btn flat dense icon="arrow_upward" @click.stop="moveUp(i)" :disable="i===0"/>
          <q-btn flat dense icon="arrow_downward" @click.stop="moveDown(i)" :disable="i===form.fields.length-1"/>

          <q-btn
            flat dense icon="delete"
            color="negative"
            v-if="User.can('delete_scaffold')"
            @click.stop="removeField(i)"
          />

        </q-card-section>


        <!-- BODY -->
        <q-slide-transition>
        <div v-show="f.open">

          <q-separator/>

          <q-card-section>

            <div class="row q-col-gutter-sm">

              <div class="col-3">
                <q-input v-model="f.name" dense outlined
                  :error="!f.name"
                  :label="tdc('Name')" />
              </div>

              <div class="col-3">
                <q-select v-model="f.type"
                  :options="typeOptions"
                  dense outlined
                  :label="tdc('Type')" />
              </div>

              <q-toggle v-model="f.required" :label="tdc('Required')" />
              <q-toggle v-model="f.unique" :label="tdc('Unique')" />

              <div class="col-2">
                <q-input v-model="f.default" dense outlined label="default"/>
              </div>

              <div class="col-2">
                <q-input v-model="f.verbose_name" dense outlined label="verbose_name"/>
              </div>

              <div class="col-2">
                <q-input v-model="f.help_text" dense outlined label="help_text"/>
              </div>

            </div>


            <!-- RELATION -->
            <div v-if="isRelation(f.type)" class="row q-col-gutter-sm q-mt-sm">

              <div class="col-3">
                <q-select
                  v-model="f.relModule"
                  :options="apps"
                  option-label="name"
                  option-value="name"
                  outlined dense
                  label="module"
                  @update:model-value="loadRelationModels(f)"
                />
              </div>

              <div class="col-3">
                <q-select
                  v-model="f.relation"
                  :options="f.relModels"
                  outlined dense
                  label="model"
                />
              </div>

              <div class="col-2">
                <q-select
                  v-model="f.on_delete"
                  :options="onDeleteOptions"
                  outlined dense
                  label="on_delete"
                />
              </div>

            </div>


            <!-- FILE -->
            <div v-if="isFile(f.type)" class="row q-col-gutter-sm q-mt-sm">

              <div class="col-3">
                <q-input v-model="f.upload_to" dense outlined label="upload_to"/>
              </div>

              <q-toggle
                v-model="f.upload_mode_func"
                label="file_path()"
              />

            </div>


            <!-- NUMERIC -->
            <div v-if="isNumeric(f.type)" class="row q-col-gutter-sm q-mt-sm">

              <q-input v-model="f.min" dense outlined label="min"/>
              <q-input v-model="f.max" dense outlined label="max"/>

            </div>


            <!-- CHAR -->
            <div v-if="isChar(f.type)" class="row q-col-gutter-sm q-mt-sm">

              <q-input v-model="f.max_length" dense outlined label="max_length"/>
              <q-input v-model="f.min_length" dense outlined label="min_length"/>

            </div>


            <!-- DECIMAL -->
            <div v-if="f.type==='DecimalField'" class="row q-col-gutter-sm q-mt-sm">

              <q-input v-model="f.max_digits" dense outlined label="max_digits"/>
              <q-input v-model="f.decimal_places" dense outlined label="decimal_places"/>

            </div>


            <!-- CHOICES -->
            <div class="q-mt-sm">

              <div class="text-caption">Choices</div>

              <div
                v-for="(c,ci) in f.choices"
                :key="ci"
                class="row q-col-gutter-xs"
              >
                <q-input dense v-model="c[0]" class="col"/>
                <q-input dense v-model="c[1]" class="col"/>
                <q-btn flat icon="delete" @click="f.choices.splice(ci,1)"/>
              </div>

              <q-btn flat icon="add" @click="f.choices.push(['',''])"/>

            </div>

          </q-card-section>

        </div>
        </q-slide-transition>

      </q-card>

    </div>


    <q-btn
      v-if="User.can('change_scaffold')"
      color="primary"
      icon="add"
      label="Add field"
      @click="addField"
    />

  </div>



  <!-- ===================================================== -->
  <!-- PREVIEW -->
  <!-- ===================================================== -->
  <q-card class="q-mt-xl">

    <q-tabs v-model="tab">
      <q-tab name="model" label="Model"/>
      <q-tab name="serializer" label="Serializer"/>
      <q-tab name="view" label="View"/>
    </q-tabs>

    <q-tab-panels v-model="tab">

      <q-tab-panel name="model"><pre class="code">{{ preview.model }}</pre></q-tab-panel>
      <q-tab-panel name="serializer"><pre class="code">{{ preview.serializer }}</pre></q-tab-panel>
      <q-tab-panel name="view"><pre class="code">{{ preview.view }}</pre></q-tab-panel>

    </q-tab-panels>

  </q-card>

</q-page>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc, UserStore } from './../../index'

const User = UserStore()

const loading = ref(false)
const apps = ref([])
const existingModels = ref([])
const tab = ref('model')

const form = ref({
  modulo:'',
  modelo:'',
  fields:[],
  permissions:[]
})


/* ===================== */

const rawTypes = [
  'CharField','TextField','SlugField','EmailField','URLField','UUIDField',
  'IntegerField','BigIntegerField','SmallIntegerField','FloatField','DecimalField',
  'BooleanField','DateField','DateTimeField','TimeField',
  'FileField','ImageField','JSONField',
  'ForeignKey','OneToOneField','ManyToManyField'
]

const typeOptions = rawTypes.map(t=>({label:t,value:t}))
const onDeleteOptions = ['CASCADE','SET_NULL','PROTECT','RESTRICT','SET_DEFAULT']

/* ===================== */

function addField(){
  form.value.fields.push({
    id:Date.now()+Math.random(),
    open:true,
    name:'',
    type:'CharField',
    required:true,
    unique:false,
    choices:[],
    relModels:[]
  })
}

function removeField(i){ form.value.fields.splice(i,1) }
function moveUp(i){ const a=form.value.fields;[a[i-1],a[i]]=[a[i],a[i-1]] }
function moveDown(i){ const a=form.value.fields;[a[i+1],a[i]]=[a[i],a[i+1]] }

/* ===================== */

const modelExists = computed(()=> existingModels.value.includes(form.value.modelo))

const preview = ref({model:'',serializer:'',view:''})

watch(form, async ()=>{
  const {data} = await HTTPAuth.post('/saas/scaffold/preview/', form.value)
  preview.value = data
},{deep:true})

/* ===================== */

async function loadApps(){
  const {data} = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps
}

async function loadRelationModels(f){
  const {data} = await HTTPAuth.get(`/saas/modulos/${f.relModule}/`)
  f.relModels = data.models
}

watch(()=>form.value.modulo, async m=>{
  if(!m) return
  const {data} = await HTTPAuth.get(`/saas/modulos/${m}/`)
  existingModels.value = data.models
})

async function submit(){
  loading.value=true

  if(modelExists.value)
    await HTTPAuth.put(`/saas/scaffold/${form.value.modulo}.${form.value.modelo}/`, form.value)
  else
    await HTTPAuth.post('/saas/scaffold/', form.value)

  loading.value=false
}

async function deleteModel(){
  await HTTPAuth.delete(`/saas/scaffold/${form.value.modulo}.${form.value.modelo}/`)
}

/* ===================== */

function isRelation(t){return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)}
function isFile(t){return ['FileField','ImageField'].includes(t)}
function isChar(t){return ['CharField','SlugField','EmailField','URLField'].includes(t)}
function isNumeric(t){return ['IntegerField','FloatField','DecimalField'].includes(t)}

onMounted(loadApps)
</script>



<style scoped>
.wizard-header{
  position:sticky;
  top:0;
  z-index:10;
}
.code{
  background:#1e1e1e;
  color:#9cdcfe;
  padding:12px;
  border-radius:8px;
  font-family:monospace;
}
</style>
