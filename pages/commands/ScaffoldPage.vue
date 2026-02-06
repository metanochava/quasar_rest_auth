<template>
  <q-page class=" q-pa-md">

    <!-- HEADER -->
    <div class="row items-center q-mb-md sticky-header">
      <div class="text-h6">⚡ Scaffold Command Wizard</div>
      <q-space/>
      <q-btn flat icon="visibility" label="Preview" @click="generatePreview" />
      <q-btn color="primary" icon="save" label="Create / Update" @click="submit" />
    </div>
{{form}}
    <div class="row q-col-gutter-md">

      <!-- ================= LEFT (COMMAND STYLE FORM) ================= -->
      <div class="col-3">

        <q-card flat bordered class="">

          <q-card-section class="text-subtitle1" dense>
            🧠 Setup
          </q-card-section>

          <q-separator/>

          <q-card-section>

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

            />

            <q-input dense
              v-model="form.modelo"
              label="Model Name"
              class="q-mt-sm"
              outlined
            />

          </q-card-section>
        </q-card>



        <!-- ================= FIELDS ================= -->
        <q-card flat bordered class=" q-mt-md" dense>

          <q-card-section class="row items-center" dense>
            <div class="text-subtitle1" dense>📋 Fields</div>
            <q-space/>
            <q-btn dense icon="add" @click="addField" />
          </q-card-section>

          <q-separator/>

          <q-list bordered dense>

            <q-expansion-item 
              dense
              v-for="(f,i) in form.fields"
              :key="i"
              :label="f.name || 'new_field'"
              
              expand-separator
            >

              <div class="q-pa-sm column q-gutter-sm">

                <q-input dense v-model="f.name" label="name" outlined />

                <q-select
                  dense
                  v-model="f.type"
                  :options="rawTypes"
                  label="type"
                  outlined
                />

                <div class="row q-col-gutter-md">
                  <div class="col">
                    <q-toggle v-model="f.required" label="required" />
                  </div>
                  <div class="col">
                    <q-toggle v-model="f.unique" label="unique" />
                  </div>
                </div>


                <q-input dense v-model="f.default" label="default" outlined/>

                <q-card flat bordered class=" q-mt-md">
                  <q-card-section>
                    ♋️ Choices
                    <div class="row q-col-gutter-sm q-pa-0">
                      <div class="col">
                        <q-input
                          v-model="newChoice.label"
                          label="Label"
                          outlined
                          dense
                          @keyup.enter="addChoice(f)"
                        />
                      </div>

                      <div class="col">
                        <q-input
                          v-model="newChoice.value"
                          label="Value"
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
                            Vabel{{ choice.label }}
                          </q-item-label>
                          <q-item-label caption>
                            value: {{ choice.value }}
                          </q-item-label>
                        </q-item-section>

                        <q-item-section side>
                          <q-btn
                            icon="delete"
                            color="negative"
                            flat
                            round
                            @click="removeChoice(f, index)"
                          />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>

                

                <!-- CHAR -->
                <div v-if="isChar(f)">
                  <q-input  dense v-model.number="f.max_length" type="number" label="max_length" outlined/>
                  <q-input dense v-model.number="f.min_length" type="number" label="min_length" outlined/>
                </div>

                <!-- NUMERIC -->
                <div v-if="isNumeric(f)">
                  <q-input dense v-model.number="f.min" label="min" outlined/>
                  <q-input dense v-model.number="f.max" label="max" outlined/>
                </div>

                <!-- RELATION -->
                <div v-if="isRelation(f)">
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
                    @update:model-value="loadModels(f)"
                  />

                  <q-select
                    v-model="f.relation"
                    :options="f.models"
                    label="model"
                    outlined
                    dense 
                  />

                  <q-select
                    v-if="f.type !== 'ManyToManyField'"
                    v-model="f.on_delete"
                    :options="onDeletes"
                    label="on_delete"
                    dense
                  />
                </div>

                <!-- FILE -->
                <div v-if="isFile(f)">
                  <q-input v-model="f.upload_to" label="upload_to" outlined dense/>
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
      <div class="col-9">

        <q-tabs v-model="tab" dense >

          <q-tab name="model" label="Model"/>
          <q-tab name="serializer" label="Serializer"/>
          <q-tab name="view" label="View"/>
          <q-tab name="service" label="Service"/>

        </q-tabs>

        <q-separator/>

        <q-tab-panels v-model="tab" animated>

          <q-tab-panel name="model">
            <pre class="code">{{ preview.model }}</pre>
          </q-tab-panel>

          <q-tab-panel name="serializer">
            <pre class="code">{{ preview.serializer }}</pre>
          </q-tab-panel>

          <q-tab-panel name="view">
            <pre class="code">{{ preview.view }}</pre>
          </q-tab-panel>

          <q-tab-panel name="service">
            <pre class="code">{{ preview.service }}</pre>
          </q-tab-panel>

        </q-tab-panels>

      </div>

    </div>

  </q-page>
</template>



<script>

import { ref, computed, watch, onMounted } from 'vue'
import { HTTPAuth, tdc, UserStore , AlertError} from './../../index'



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

      permInput: '',

      newChoice :{
        label: '',
        value: ''
      },

      modules: [],

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
      if (this.newChoice.label!== '' && this.newChoice.value !== '' ){
        f.choices.push({ ...this.newChoice })
        this.newChoice.label = ''
        this.newChoice.value = ''
      }else{
        AlertError('Label, Value ou ambos estao vazios!')
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

    isNumeric (f) {
      return ['IntegerField','DecimalField'].includes(f.type)
    },


    async generatePreview () {
      const { data } = await HTTPAuth.post('/saas/scaffold/preview/', this.form)
      this.preview = data.data
    },


    async submit () {
      await HTTPAuth.post('/saas/scaffold/', this.form)
    },

    async loadApps() {
      const {data} = await HTTPAuth.get('/saas/modulos/')
      this.modules = data.apps
    },

    async loadModels(f) {
      const {data} = await HTTPAuth.get('/saas/modulos/'+ f.relModule)
      f.models = data.models
    },
  }
}
</script>



<style scoped>
.code{
  background:#111;
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



