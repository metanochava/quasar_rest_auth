<template>
<q-page padding class="bg-grey-2">

  <!-- ========================================= -->
  <!-- STICKY HEADER -->
  <!-- ========================================= -->
  <div class="wizard-header bg-primary text-white q-pa-md">

    <div class="row items-center justify-between">

      <div class="text-h6">
        🔧 {{ tdc('Scaffold IDE') }}
      </div>

      <q-btn
        color="positive"
        icon="save"
        :loading="loading"
        :label="modelExists ? tdc('Update') : tdc('Create')"
        @click="submit"
      />

    </div>
  </div>



  <!-- ========================================= -->
  <!-- MODULE + MODEL -->
  <!-- ========================================= -->
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
        :error-message="tdc('Model already exists (edit mode)')"
        :label="tdc('Model')"
      />
    </div>

  </div>



  <!-- ========================================= -->
  <!-- FIELDS CARDS -->
  <!-- ========================================= -->
  <div class="q-mt-lg">

    <div
      v-for="(f,i) in form.fields"
      :key="f.id"
      class="q-mb-md"
    >

      <q-card flat bordered>

        <!-- ====================== -->
        <!-- HEADER -->
        <!-- ====================== -->
        <q-card-section
          class="row items-center cursor-pointer"
          @click="f.open=!f.open"
        >

          <q-icon
            :name="f.open ? 'expand_more' : 'chevron_right'"
            size="20px"
          />

          <div class="text-subtitle2 q-ml-sm">
            {{ f.name || 'field_' + (i+1) }}
          </div>

          <q-space/>

          <q-chip dense outline>
            {{ f.type }}
          </q-chip>

          <q-btn
            flat dense icon="delete"
            color="negative"
            @click.stop="removeField(i)"
          />

        </q-card-section>


        <!-- ====================== -->
        <!-- BODY -->
        <!-- ====================== -->
        <q-slide-transition>
        <div v-show="f.open">

          <q-separator/>

          <q-card-section>

            <div class="row q-col-gutter-sm">

              <!-- name -->
              <div class="col-3">
                <q-input
                  v-model="f.name"
                  :error="!f.name"
                  :error-message="tdc('required')"
                  outlined dense
                  :label="tdc('Name')"
                />
              </div>

              <!-- type -->
              <div class="col-3">
                <q-select
                  v-model="f.type"
                  :options="typeOptions"
                  outlined dense
                  :label="tdc('Type')"
                />
              </div>

              <!-- required -->
              <div class="col-auto">
                <q-toggle v-model="f.required" :label="tdc('Required')" />
              </div>

              <!-- unique -->
              <div class="col-auto">
                <q-toggle v-model="f.unique" :label="tdc('Unique')" />
              </div>

              <!-- default -->
              <div class="col-2">
                <q-input
                  v-model="f.default"
                  outlined dense
                  :label="tdc('Default')"
                />
              </div>

            </div>



            <!-- ====================== -->
            <!-- RELATIONS -->
            <!-- ====================== -->
            <div v-if="isRelation(f.type)" class="row q-col-gutter-sm q-mt-sm">

              <div class="col-3">
                <q-select
                  v-model="f.relModule"
                  :options="apps"
                  option-label="name"
                  option-value="name"
                  outlined dense
                  :label="tdc('Module')"
                  @update:model-value="loadRelationModels(f)"
                />
              </div>

              <div class="col-3">
                <q-select
                  v-model="f.relation"
                  :options="f.relModels"
                  outlined dense
                  :label="tdc('Model')"
                />
              </div>

              <div class="col-2">
                <q-select
                  v-model="f.on_delete"
                  :options="onDeleteOptions"
                  outlined dense
                  :label="tdc('on_delete')"
                />
              </div>

            </div>



            <!-- ====================== -->
            <!-- CHOICES BUILDER -->
            <!-- ====================== -->
            <div class="q-mt-md">

              <div class="text-caption text-grey">
                {{ tdc('Choices') }}
              </div>

              <div
                v-for="(c,ci) in f.choices"
                :key="ci"
                class="row q-col-gutter-xs q-mb-xs"
              >
                <q-input dense v-model="c[0]" class="col" label="value"/>
                <q-input dense v-model="c[1]" class="col" label="label"/>
                <q-btn flat icon="delete" @click="f.choices.splice(ci,1)"/>
              </div>

              <q-btn flat icon="add" @click="f.choices.push(['',''])"/>

            </div>

          </q-card-section>

        </div>
        </q-slide-transition>

      </q-card>

    </div>



    <!-- ADD FIELD -->
    <q-btn
      icon="add"
      color="primary"
      :label="tdc('Add field')"
      @click="addField"
    />

  </div>



  <!-- ========================================= -->
  <!-- PREVIEW -->
  <!-- ========================================= -->
  <q-card class="q-mt-xl">
    <q-card-section>
      <div class="text-subtitle2">Model preview</div>
      <pre class="code">{{ preview }}</pre>
    </q-card-section>
  </q-card>

</q-page>
</template>



<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc } from './../../index'

const step = ref(1)
const loading = ref(false)

const apps = ref([])
const existingModels = ref([])

const form = ref({
  modulo:'',
  modelo:'',
  fields:[]
})


/* ======================= */
/* TYPES */
/* ======================= */

const rawTypes = [
  'CharField','TextField','SlugField','EmailField','URLField','UUIDField',
  'IntegerField','BigIntegerField','SmallIntegerField','FloatField','DecimalField',
  'BooleanField',
  'DateField','DateTimeField','TimeField',
  'FileField','ImageField','JSONField',
  'ForeignKey','OneToOneField','ManyToManyField'
]

const typeOptions = rawTypes.map(t=>({label:t,value:t}))

const onDeleteOptions = [
  'CASCADE','SET_NULL','PROTECT','RESTRICT','SET_DEFAULT'
]


/* ======================= */

const modelExists = computed(() =>
  existingModels.value.includes(form.value.modelo)
)


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


/* ======================= */
/* PREVIEW LIVE */
/* ======================= */

const preview = computed(()=>{
  let out = `class ${form.value.modelo}(models.Model):\n`

  form.value.fields.forEach(f=>{
    out += `    ${f.name} = models.${f.type}(`

    if(f.required===false) out += 'blank=True, '
    if(f.unique) out += 'unique=True, '

    if(f.default) out += `default=${JSON.stringify(f.default)}, `

    if(f.choices.length)
      out += `choices=${JSON.stringify(f.choices)}, `

    if(isRelation(f.type))
      out += `'${f.relModule}.${f.relation}', on_delete=models.${f.on_delete||'CASCADE'}, `

    out += ')\n'
  })

  return out
})


/* ======================= */

function isRelation(t){
  return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t)
}


async function loadApps(){
  const {data} = await HTTPAuth.get('/saas/modulos/')
  apps.value = data.apps
}

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
