<template>
  <q-page padding>
    <div class="row q-col-gutter-sm q-pa-0" v-if="!route.params.model ">
      <div class="col">
        <q-select
          v-model="module"
          :options="modules"
          label="module"
          outlined
          dense 
          map-options
          emit-value
          option-value="name"
          option-label="name"
          @update:model-value="loadModelsRelation()"
        />
      </div>
      <div class="col">
        <q-select
          v-model="model"
          :options="models"
          label="model"
          outlined
          dense 
        />
      </div>
    </div>

    <AutoCrud :module="module" :model="model" :can="User.can"/>

  </q-page>
</template>

<script setup>

import { HTTPAuth, url } from '../../boot/api'
import AutoCrud from './AutoCrud.vue'
import { buildFormFromSchema } from '../../utils/autoForm'
import { UserStore } from '../../stores/AuthStore'

import { ref, watch, computed, onMounted} from 'vue'
import { useRoute } from 'vue-router'

const User = UserStore()
const route = useRoute()

const module = computed(() => route.params.module)
const model = computed(() => route.params.model)
const modules = ref([])
const models = ref([])

async function loadApps() {
  const {data} = await HTTPAuth.get(utl({type:'u', url:'/api/django_saas/modulos/', params:{}}))
  modules.value = data.apps
}

async function loadModelsRelation(){
  const {data} = await HTTPAuth.get(utl({type:'u', url:'/api/django_saas/modulos/'+ module.value, params:{}}))
  models.value = data.models
}
onMounted(async () => {
  await loadApps()
})
</script>
