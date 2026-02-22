<template>
  <q-page padding>
    <div class="row q-col-gutter-sm q-pa-0">
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
          @update:model-value="load()"
        />
      </div>
      {{ module }} | {{ model }} 
    </div>

    <AutoCrud :module="module" :model="model" />

   
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'

import { Notify } from 'quasar'

import { tdc } from '../../boot/base'
import { HTTPAuth, url } from '../../boot/api'


import AutoCrud from './AutoCrud.vue'
import { buildFormFromSchema } from '../../utils/autoForm'


const module = ref('django_saas')
const modules = ref([])
const model = ref('User')
const models = ref([])

var title = tdc('Nome da tabela')

// Endpoint do CRUD (ajusta aqui se teu padrão for diferente)
var endpoint = ''

const rows = ref([])
const columns = ref([])
const fields = ref([])
const loading = ref(false)
const saving = ref(false)

const dialog = ref(false)
const editing = ref(false)
const form = ref({})

const delDialog = ref(false)
const delRow = ref(null)

// server-side pagination
const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: 'id',
  descending: true
})

function notifyFromApi(data) {
  if (data?.alert_success) Notify.create({ type:'positive', message:data.alert_success })
  if (data?.alert_error) Notify.create({ type:'negative', message:data.alert_error })
  if (data?.alert_warning) Notify.create({ type:'warning', message:data.alert_warning })
}

async function loadSchema() {
  title = `${model.value}`
  endpoint = `api/${module.value}/${model.value.toLowerCase()}s/`
  fields.value = await buildFormFromSchema(module.value, model.value)

  columns.value = fields.value.map(f => ({
    name: f.name,
    label: f.label,
    field: f.name,
    align: 'left',
    sortable: true,

    // 🔥 ESTA LINHA NOVA
    relation: f.props?.relation || null
  }))
}

async function loadApps() {
  const {data} = await HTTPAuth.get('/api/django_saas/modulos/')
  modules.value = data.apps
}

async function loadModelsRelation(){
  const {data} = await HTTPAuth.get('/api/django_saas/modulos/'+ module.value)
  models.value = data.models
}


function buildParams(p, search = '', filters = {}) {
  const params = {
    page: p.page,
    page_size: p.rowsPerPage
  }

  if (search) params.search = search

  // filtros simples: envia como query param do mesmo nome do campo
  // (backend precisa suportar filterset ou filter backend)
  for (const [k, v] of Object.entries(filters || {})) {
    if (v !== undefined && v !== null && String(v).length) params[k] = v
  }

  // sort (se você suportar ordering)
  if (p.sortBy) {
    params.ordering = (p.descending ? '-' : '') + p.sortBy
  }

  return params
}

async function fetchRows({ pagination: p, search = '', filters = {} }) {
  loading.value = true
  try {
    const { data } = await HTTPAuth.get(url({type:'u', url: endpoint, params: buildParams(p, search, filters)}))
    const items = data?.results || data || []
    rows.value = items
    pagination.value = {
      ...p,
      rowsNumber: Number(data?.count ?? items.length)
    }
  } finally {
    loading.value = false
  }
}

function handleRequest(payload) {
  // payload: { pagination, search, filters }
  fetchRows(payload)
}

function openCreate() {
  form.value = {}
  editing.value = false
  dialog.value = true
}

function openEdit(row) {
  form.value = { ...row }
  editing.value = true
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value }

    let res
    if (editing.value) {
      res = await HTTPAuth.put(url({type:'u', url: `${endpoint}${payload.id}/`, params: {}}), payload)
    } else {
      res = await HTTPAuth.post(url({type:'u', url: endpoint, params: {}}), payload)
    }

    notifyFromApi(res.data || {})
    dialog.value = false

    await fetchRows({ pagination: pagination.value })
  } finally {
    saving.value = false
  }
}

function confirmDelete(row) {
  delRow.value = row
  delDialog.value = true
}

async function remove() {
  if (!delRow.value) return
  saving.value = true
  try {
    const res = await HTTPAuth.delete(url({type:'u', url: `${endpoint}${delRow.value.id}/`, params: {}}))
    notifyFromApi(res.data || {})
    delDialog.value = false
    delRow.value = null
    await fetchRows({ pagination: pagination.value })
  } finally {
    saving.value = false
  }
}

// Inline edit: PATCH /<id>/ { field: value }
async function inlineSave(row, field, value) {
  try {
    const res = await HTTPAuth.patch(url({type:'u', url: `${endpoint}${row.id}/`, params: {}}), { [field]: value })
    notifyFromApi(res.data || { alert_success: tdc('Updated') })
  } catch (e) {
    Notify.create({ type: 'negative', message: tdc('Update failed') })
  }
}

async function load() {
  await loadSchema()
  await fetchRows({ pagination: pagination.value })
}

onMounted(async () => {
  await loadApps()
})
</script>
