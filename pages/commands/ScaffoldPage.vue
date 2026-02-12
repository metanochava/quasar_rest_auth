<template>
  <q-page class=" q-pa-md">

    <!-- HEADER -->{{ form.fields }}
    
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
            {{form.modelo}} | {{models}}
            <div class="col" v-if="form.modelo in models">
              <q-btn color="primary" icon="reload" label="Reload Model" @click="reloadModelShema" />
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

                  <div class="col">
                    <q-input dense v-model="f.verbose_name" label="Verbose name" outlined />
                  </div>
                  <div class="col">
                    <q-select
                      dense
                      v-model="f.type"
                      :options="rawTypes"
                      label="type"
                      outlined
                    />
                  </div>

                  <div class="col-12 q-pr-sm">
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


                <div  v-if="isDecimal(f) " class="row q-gutter-sm q-col-gutter-sm q-mt-md">
                  <div class="col">
                    <q-input dense v-model="f.max_digits" type="number" label="max digits" outlined/>
                  </div>
                  <div class="col">
                    <q-input  dense v-model="f.decimal_places" type="number" label="decimal places" outlined/>
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

                    <div v-if="f.choices.length === 0" class="text-grey">
                      Nenhum choice adicionado
                    </div>

                    <q-list bordered v-else>
                      <q-item
                        v-for="(choice, index) in f.choices"
                        :key="index"
                      >
                        <q-item-section>
                          <q-item-label>
                            Key:{{ choice.key }}
                          </q-item-label>
                          <q-item-label caption>
                            Label: {{ choice.label }}
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
                        @update:model-value="loadModelsRelation(f.relModule)"
                      />
                    </div>

                    <div class="col">
                      <q-select
                        v-model="f.relation"
                        :options="f.models"
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

        <!-- ================= PERMISSIONS ================= -->
        <q-card flat bordered class=" q-mt-md">
          <q-card-section>
            🔐 Extra Permissions
            <q-input dense v-model="permInput" @keyup.enter="addPerm"/>
            <q-chip
              v-for="(p,i) in form.permissions"
              :key="i"
              removable
              @remove="form.permissions.splice(i,1)"
            >
              {{ p }}
            </q-chip>
          </q-card-section>
        </q-card>

      </div>



      <!-- ================= RIGHT (PREVIEW CODE) ================= -->
      <div class="col-8" v-if="out">
        <pre class="code">{{ out }}</pre>
      </div>
      <div class="col-8" v-else>

        <q-tabs v-model="tab" dense >

          <q-tab name="model" label="Model"/>
          <q-tab name="serializer" label="Serializer"/>
          <q-tab name="view" label="View"/>
          <q-tab name="service" label="Service"/>

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

          <q-tab-panel name="service">
            <pre class="code">{{ preview?.service }}</pre>
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

      newChoice :{
        label: '',
        key: ''
      },

      modules: [],
      models: [],

      rawTypes: [
        'CharField','TextField','IntegerField','DecimalField','BooleanField',
        'ForeignKey','OneToOneField','ManyToManyField',
        'FileField','ImageField','JSONField','MoneyField'
      ],

      onDeletes: ['CASCADE','PROTECT','SET_NULL','SET_DEFAULT','DO_NOTHING','RESTRICT'],

      form: {
        modulo: '',
        modelo: '',
        fields: [],
        permissions: []
      },

      preview: {
        model: '',
        serializer: '',
        view: '',
        service: ''
      }

    }
  },

  mounted(){
    this.loadApps()
  },


  methods: {

    addField () {
      this.form.fields.push({
        name: '',
        type: 'CharField',
        required: true, 
        choices: []
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
      this.form.permissions.push(this.permInput)
      this.permInput=''
    },

    isRelation (f) {
      return ['ForeignKey','OneToOneField','ManyToManyField'].includes(f.type)
    },

    isFile (f) {
      return ['FileField','ImageField'].includes(f.type)
    },

    isChar (f) {
      return f.type === 'CharField'
    },

    isInteger (f) {
      return f.type === 'IntegerField'
    },

    isDecimal (f) {
      return f.type === 'DecimalField'
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
          decimal_places: f.decimal_places
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
        fields: this.normalizeFields(this.form.fields)
      }
      const { data } = await HTTPAuth.post('/saas/scaffold/preview/', payload)

      this.preview = data.data || data || {
        model:'',
        serializer:'',
        view:'',
        service:''
      }
    },

    async reloadModelShema(){
      this.form.fields = await buildFormFromSchema(this.modules, this.form.modelo)
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
      this.f.models = this.loadModels(f)
    },

    async loadModelsSchema(f){
      this.models = this.loadModels(f)
    },

    async loadModels(modulo) {
      const {data} = await HTTPAuth.get('/saas/modulos/'+ modulo)
      return data.models
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



