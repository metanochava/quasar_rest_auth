<template>
  <q-page class="bg-dark text-white q-pa-md">

    <!-- HEADER -->
    <div class="row items-center q-mb-md sticky-header">
      <div class="text-h6">⚡ Scaffold Command Wizard</div>
      <q-space/>
      <q-btn flat icon="visibility" label="Preview" @click="generatePreview" />
      <q-btn color="primary" icon="save" label="Create / Update" @click="submit" />
    </div>


    <div class="row q-col-gutter-md">

      <!-- ================= LEFT (COMMAND STYLE FORM) ================= -->
      <div class="col-5">

        <q-card flat bordered class="bg-grey-10">

          <q-card-section class="text-subtitle1">
            🧠 Setup
          </q-card-section>

          <q-separator/>

          <q-card-section>

            <q-select
              v-model="form.modulo"
              :options="modules"
              label="Module"
              dark
              filled
            />

            <q-input
              v-model="form.modelo"
              label="Model Name"
              dark
              filled
              class="q-mt-sm"
            />

          </q-card-section>
        </q-card>



        <!-- ================= FIELDS ================= -->
        <q-card flat bordered class="bg-grey-10 q-mt-md">

          <q-card-section class="row items-center">
            <div class="text-subtitle1">📋 Fields</div>
            <q-space/>
            <q-btn dense icon="add" @click="addField" />
          </q-card-section>

          <q-separator/>

          <q-list bordered>

            <q-expansion-item
              v-for="(f,i) in form.fields"
              :key="i"
              :label="f.name || 'new_field'"
              dark
              expand-separator
            >

              <div class="q-pa-sm column q-gutter-sm">

                <q-input v-model="f.name" label="name" dark filled />

                <q-select
                  v-model="f.type"
                  :options="rawTypes"
                  label="type"
                  dark
                  filled
                />

                <q-toggle v-model="f.required" label="required"/>
                <q-toggle v-model="f.unique" label="unique"/>

                <q-input v-model="f.default" label="default" dark filled/>

                <!-- CHAR -->
                <div v-if="isChar(f)">
                  <q-input v-model.number="f.max_length" type="number" label="max_length" dark filled/>
                  <q-input v-model.number="f.min_length" type="number" label="min_length" dark filled/>
                </div>

                <!-- NUMERIC -->
                <div v-if="isNumeric(f)">
                  <q-input v-model.number="f.min" label="min" dark filled/>
                  <q-input v-model.number="f.max" label="max" dark filled/>
                </div>

                <!-- RELATION -->
                <div v-if="isRelation(f)">
                  <q-select
                    v-model="f.relModule"
                    :options="modules"
                    label="module"
                    dark
                    filled
                    @update:model-value="loadModels(f)"
                  />

                  <q-select
                    v-model="f.relation"
                    :options="f.models"
                    label="model"
                    dark
                    filled
                  />

                  <q-select
                    v-if="f.type !== 'ManyToManyField'"
                    v-model="f.on_delete"
                    :options="onDeletes"
                    label="on_delete"
                    dark
                    filled
                  />
                </div>

                <!-- FILE -->
                <div v-if="isFile(f)">
                  <q-input v-model="f.upload_to" label="upload_to" dark filled/>
                </div>

                <q-btn flat color="negative" label="remove" @click="removeField(i)"/>

              </div>

            </q-expansion-item>

          </q-list>
        </q-card>



        <!-- ================= PERMISSIONS ================= -->
        <q-card flat bordered class="bg-grey-10 q-mt-md">
          <q-card-section>
            🔐 Extra Permissions
            <q-input v-model="permInput" @keyup.enter="addPerm"/>
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
      <div class="col-7">

        <q-tabs v-model="tab" dense dark>

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
import { HTTPAuth, tdc, UserStore } from './../../index'

const User = UserStore()

export default {

  name: 'ScaffoldCommandWizard',

  data () {
    return {

      tab: 'model',

      permInput: '',

      modules: window.APP_MODULES || [],

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


  methods: {

    addField () {
      this.form.fields.push({
        name: '',
        type: 'CharField',
        required: true
      })
    },

    removeField (i) {
      this.form.fields.splice(i,1)
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
    }

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
  background:#121212;
}
</style>
