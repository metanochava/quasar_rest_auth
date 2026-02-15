<template>
  <q-page class=" q-pa-md">

    <!-- HEADER -->
    
    <div class="row">
      <q-card flat bordered class="col">

        <q-card-section class="text-subtitle1" dense>
          <div class="row items-center  sticky-header">
            <div class="text-h6">⚡ Scaffold Command Wizard</div>
            <q-space/>
            <q-btn flat icon="visibility" label="Preview" @click="generatePreview" />
            <q-btn color="primary" icon="save" label="Create / Update" @click="submit" />
          </div>
        </q-card-section>

        <q-separator/>

        <q-card-section>

          <div class="row  q-col-gutter-md ">
            <div class="col">
              <q-select
                v-model="form.modulo"
                :options="modules"
                label="Module"
                outlined
                dense 
                map-options
                emit-value
                option-value="name"
                option-label="name"
                @update:model-value="loadModelsSchema(form.modulo)"
              />
            </div>

            <div class="col">
              <q-input dense
                v-model="form.modelo"
                label="Model Name"
                outlined
              />
            </div>
            <div class="col" v-if="models.includes(form.modelo)">
              <q-btn class="full-width" color="primary" icon="refresh"  label="Reload Model" @click="reloadModelShema" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>
    <div class="row q-col-gutter-md">

      <!-- ================= LEFT (COMMAND STYLE FORM) ================= -->
      <div class="col-4">
        <!-- ================= FIELDS ================= -->
        <q-card flat bordered class=" q-mt-md" dense>

          <q-card-section class="row items-center" dense>
            <div class="text-subtitle1" dense>📋 Fields</div>
            <q-space/>
            <q-btn dense icon="add" @click="addField" />
          </q-card-section>

          <q-separator/>

          <q-list bordered dense >
            <q-expansion-item
              dense
              v-for="(f, i) in form.fields"
              :key="i"
              :label="f.name || 'new_field'"
              group="fields"
              :model-value="i === form.fields.length - 1"
              expand-separator
            >


              <div class="q-pa-sm  q-gutter-sm">

                <div class="row q-gutter-sm q-col-gutter-sm">
                  <div class="col">
                    <q-input dense v-model="f.name" label="name" outlined />
                  </div>
                  <div class="col-7">
                    <q-select
                      dense
                      v-model="f.type"
                      :options="filteredTypes"
                      label="type"
                      outlined
                      use-input
                      @filter="filterTypes"
                    >
                      <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                        {{st('Sem resultados')}}
                        </q-item-section>
                      </q-item>
                      </template>
                    </q-select>

                  </div> 
                </div>

                <div class="row q-gutter-sm q-col-gutter-sm">
                  <div class="col">
                    <q-input dense v-model="f.verbose_name" label="Verbose name" outlined />
                  </div>

                  <div class="col-7 q-pr-sm">
                    <q-input dense v-model="f.help_text" label="Help text" outlined />
                  </div>
                </div>

                <div class="row q-gutter-sm  q-mt-md">
                  <div class="col">
                    <q-toggle v-model="f.required" label="required" />
                  </div>
                  <div class="col">
                    <q-toggle v-model="f.unique" label="unique" />
                  </div>
                  <div class="col" v-if="!(['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type))">
                    <q-input dense v-model="f.default" label="default" outlined />
                  </div>
                </div>

                <div  v-if="isChar(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-input dense v-model="f.min_length" type="number" label="min length" outlined/>
                  </div>
                  <div class="col">
                    <q-input  dense v-model="f.max_length" type="number" label="max length" outlined/>
                  </div>
                </div>


                <div  v-if="isDecimalOrMoney(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-input dense v-model="f.max_digits" type="number" label="max digits" outlined/>
                  </div>
                  <div class="col">
                    <q-input  dense v-model="f.decimal_places" type="number" label="decimal places" outlined/>
                  </div>
                  <div class="col">
                    <q-select
                      dense
                      v-model="f.default_currency"
                      :options="filteredMoneys"
                      label="type"
                      outlined
                      use-input
                      @filter="filterMoneys"
                    >
                      <template v-slot:no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                        {{st('Sem resultados')}}
                        </q-item-section>
                      </q-item>
                      </template>
                    </q-select>
                  </div>
                </div>

                <div  v-if="isInteger(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-input dense v-model="f.min" type="number" label="min" outlined/>
                  </div>
                  <div class="col">
                    <q-input  dense v-model="f.max" type="number" label="max" outlined/>
                  </div>
                </div>

                <div  v-if="isFile(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-input dense v-model="f.width_field" type="number" label="width_field" outlined/>
                  </div>
                  <div class="col">
                    <q-input  dense v-model="f.height_field" type="number" label="height_field" outlined/>
                  </div>
                </div>

                <div  v-if="isDate(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-toggle dense v-model="f.auto_now_add"  label="Auto Now Add" outlined/>
                  </div>
                  <div class="col">
                    <q-toggle  dense v-model="f.auto_now"  label="Auto Now" outlined/>
                  </div>
                </div>
                
              
                <q-card flat bordered class=" q-mt-md"  v-if="!(['ForeignKey','OneToOneField','ManyToManyField','FileField', 'ImageField', 'TextField'].includes(f.type))" >
                  <q-card-section>
                    ♋️ Choices
                    <div class="row q-col-gutter-sm q-pa-0">
                      <div class="col">
                        <q-input
                          v-model="newChoice.key"
                          label="Key"
                          outlined
                          dense
                          @keyup.enter="addChoice(f)"
                        />
                      </div>

                      <div class="col">
                        <q-input
                          v-model="newChoice.label"
                          label="Label"
                          outlined
                          dense
                          @keyup.enter="addChoice(f)"
                        />
                      </div>
                    </div>

                    <div v-if="f?.choices?.length === 0" class="text-grey">
                      Nenhum choice adicionado
                    </div>

                    <q-list bordered v-else>
                      <q-item
                        v-for="(choice, index) in f?.choices"
                        :key="index"
                      >
                        <q-item-section>
                          <q-item-label>
                            Key:{{ choice?.key }}
                          </q-item-label>
                          <q-item-label caption>
                            Label: {{ choice?.label }}
                          </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            icon="delete"
                            color="negative"
                            flat
                            dense
                            round
                            @click="removeChoice(f, index)"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
                
                <!-- RELATION -->
                <div v-if="isRelation(f)">

                  <div class="row q-col-gutter-sm q-pa-0">
                    <div class="col">
                      <q-select
                        v-model="f.relModule"
                        :options="modules"
                        label="module"
                        outlined
                        dense 
                        map-options
                        emit-value
                        option-value="name"
                        option-label="name"
                        @update:model-value="loadModelsRelation(f)"
                      />
                    </div>

                    <div class="col">
                      <q-select
                        v-model="f.relation"
                        :options="f?.models"
                        label="model"
                        outlined
                        dense 
                      />
                    </div>

                    <div class="col" v-if="f.type !== 'ManyToManyField'">
                      <q-select
                        v-model="f.on_delete"
                        :options="onDeletes"
                        label="on_delete"
                        dense
                        outlined
                      />
                    </div>
                  </div>
                </div>
                
                <q-btn flat color="negative" label="remove" @click="removeField(i)" dense/>

              </div>

            </q-expansion-item>

          </q-list>
        </q-card>

        <!-- ================= actions ================= -->
        <q-card flat bordered class="q-mt-md">
          <q-card-section class="row q-col-gutter-sm">
            🔐 Extra actions
            <q-select
              class="col-3"
              v-model="permMethod"
              :options="['GET', 'POST', 'PUT', 'DELETE']"
              label="model"
              outlined
              dense 
            />
            <q-input class="col-6" dense v-model="permInput" @keyup.enter="addPerm()"/>
            <q-toggle
              class="col-3"
              v-model="permDetails"
              label="model"
              outlined
              dense 
            />
            <q-input class="col-12" dense v-model="permUrl" @keyup.enter="addPerm()" placeholder="'(?P<model>[^/.]+)/schema'"/>

            <q-chip
              :class="{
                'bg-green text-white': p.startsWith('GET'),
                'bg-blue text-white': p.startsWith('POST'),
                'bg-orange text-white': p.startsWith('PUT'),
                'bg-red text-white': p.startsWith('DELETE')
              }"
              v-for="(p,i) in form?.actions"
              :key="i"
              removable
              @remove="form?.actions.splice(i,1)"
            >
              {{ p }}
            </q-chip>
          </q-card-section>
          <pre>
    @action(detail=True, methods=["get"], url_path=r"url com parametros")
    def metodo_accao(self, request, pk=None, model=None):
        print(pk, model)
          </pre>
        </q-card>

      </div>

      <!-- ================= RIGHT (PREVIEW CODE) ================= -->
      <div class="col-8" v-if="out">
        <q-btn v-if="out == 'migrate'" flat icon="refresh" color="accent" label="Migrate" @click="generateMigrate" />
       <div class="col" v-else>
        <br>
        <br>
        <pre  class="code">{{ out }}</pre>
       </div>
      </div>
      <div class="col-8" v-else>

        <q-tabs v-model="tab" dense >

          <q-tab name="model" label="Model"/>
          <q-tab name="serializer" label="Serializer"/>
          <q-tab name="view" label="View"/>

        </q-tabs>

        <q-separator/>

        <q-tab-panels v-model="tab" animated>

          <q-tab-panel name="model">
            <pre class="code">{{ preview?.model }}</pre>
          </q-tab-panel>

          <q-tab-panel name="serializer">
            <pre class="code">{{ preview?.serializer }}</pre>
          </q-tab-panel>

          <q-tab-panel name="view">
            <pre class="code">{{ preview?.view }}</pre>
          </q-tab-panel>

        </q-tab-panels>
      </div>
    </div>
  </q-page>
</template>

<script>

import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc, UserStore , AlertError, buildFormFromSchema} from './../../index'



export default {

  name: 'ScaffoldCommandWizard',

  setup () {
    const User = UserStore()
    return {
      User
    }
  },

  data () {
    return {

      tab: 'model',

      out: null,
      permInput: '',
      permMethod: 'GET',
      permDetails: false,
      permUrl: '',

      newChoice :{
        label: '',
        key: ''
      },

      modules: [],
      models: [],
      filteredTypes: [],
      filteredMoneys: [],
      rawMoneys : [
        'MZN',
        'USD',
        '...',
      ],

      rawTypes : [

        //  # TEXT
        'CharField',
        'TextField',
        'EmailField',
        'SlugField',
        'URLField',
        'UUIDField',

        //  # NUMBERS
        'IntegerField',
        'BigIntegerField',
        'SmallIntegerField',
        'PositiveIntegerField',
        'PositiveBigIntegerField',
        'FloatField',
        'DecimalField',

        //  # BOOLEAN
        'BooleanField',

        //  # DATE
        'DateField',
        'DateTimeField',
        'TimeField',
        'DurationField',

        //  # FILES
        'FileField',
        'ImageField',

        //  # DATA
        'JSONField',
        'BinaryField',

        //  # RELATIONS
        'ForeignKey',
        'OneToOneField',
        'ManyToManyField',

        //  # MONEY
        'MoneyField',

      ],


      onDeletes: ['CASCADE','PROTECT','SET_NULL','SET_DEFAULT','DO_NOTHING','RESTRICT'],

      form: {
        modulo: '',
        modelo: '',
        fields: [],
        actions: []
      },

      preview: {
        model: '',
        serializer: '',
        view: '',
      }

    }
  },

  mounted(){
    this.loadApps()
    this.filteredTypes = this.rawTypes
    this.filteredMoneys = this.rawMoneys
  },


  methods: {

     filterTypes (val, update) {
      if (val === '') {
        update(() => {
          this.filteredTypes = this.rawTypes
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredTypes = this.rawTypes
          .filter((v) => v.toLowerCase().indexOf(needle) > -1)
      })
    },

    filterMoneys (val, update) {
      if (val === '') {
        update(() => {
          this.filteredMoneys = this.rawMoneys
        })
        return
      }

      update(() => {
        const needle = val.toLowerCase()
        this.filteredMoneys = this.rawMoneys
          .filter((v) => v.toLowerCase().indexOf(needle) > -1)
      })
    },


    addField () {
      this.form.fields.push({
        name: '',
        type: '',
        required: true, 
      })
    },

    removeField (i) {
      this.form.fields.splice(i,1)
    },

    addChoice(f){
      if (this.newChoice.key!== '' && this.newChoice.label !== '' ){
        f.choices.push({ ...this.newChoice })
        this.newChoice.label = ''
        this.newChoice.key = ''
      }else{
        AlertError('Label, Key ou ambos estao vazios!')
      }
   
    },

    removeChoice (f, index){
      f.choices.splice(index, 1)
    },

    addPerm () {
      if (!this.permInput) return
      if (!this.permMethod) return
      this.form.actions.push({'method' :this.permMethod, 'permition': this.permInput,  'url' : this.permUrl, 'details' : this.permDetails})
      this.permInput=''
      this.permMethod=''
      this.permMethod=''
      this.permUrl=''
      this.permDetails=''
    },

    isRelation (f) {
      return ['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type)
    },

    isFile (f) {
      return ['FileField','ImageField'].includes(f.type)
    },

    isDate (f) {
      return ['DateField', 'DuractionField','DateTimeField'].includes(f.type)
    },

    isChar (f) {
      return f.type === 'CharField'
    },

    isInteger (f) {
      return f.type === 'IntegerField'
    },

    isDecimalOrMoney (f) {
      return ['MoneyField', 'DecimalField'].includes(f.type)
    },

    normalizeFields(fields) {
      return fields.map(f => {
        const field = {
          name: f.name,
          type: f.type,
          verbose: f.verbose,
          null: f.null,
          blank: f.blank,
          default: f.default,
          choices: f.choices,
          on_delete: f.on_delete,
          min: f.min,
          max: f.max,
          min_length: f.min_length,
          max_length: f.max_length,
          max_digits: f.max_digits,
          decimal_places: f.decimal_places,
          default_currency: f.default_currency,
          auto_now_add: f.auto_now_add,
          auto_now: f.auto_now,
          width_field: f.width_field,
          height_field: fheight_field,
        }

        // RELAÇÃO
        if (f.relModule && f.relation) {
          field.relation = `${f.relModule}.${f.relation}`
        }

        return field
      })
    },


    async generatePreview () {
      this.out=null
      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields),
      }
      const { data } = await HTTPAuth.post('/saas/scaffold/preview/', payload)

      this.preview = data.data || data || {
        model:'',
        serializer:'',
        view:'',
      }
    },

    async generateMigrate () {
      this.out=null
      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields)
      }
      const { data } = await HTTPAuth.post('/saas/scaffold/migrate/', payload)
      this.out = data.out 
    },

    async reloadModelShema(){
      this.form.fields = await buildFormFromSchema(this.form.modulo, this.form.modelo)
    },

    async submit () {
      this.out = 'response...'
      const payload = {
        ...this.form,
        fields: this.normalizeFields(this.form.fields)
      }
      const {data} = await HTTPAuth.post('/saas/scaffold/', payload)
      this.out = data.out
    },

    async loadApps() {
      const {data} = await HTTPAuth.get('/saas/modulos/')
      this.modules = data.apps
    },

    async loadModelsRelation(f){
      const {data} = await HTTPAuth.get('/saas/modulos/'+ f.relModule)
      f.models = data.models
    },

    async loadModelsSchema(f){
      const {data} = await HTTPAuth.get('/saas/modulos/'+ f)
      this.models = data.models
    },
  }
}
</script>



<style scoped>
.code{
  padding:16px;
  border-radius:8px;
  font-size:12px;
  overflow:auto;
}
.sticky-header{
  position:sticky;
  top:0;
  z-index:5;
  /* background:#121212; */
} 
</style>



