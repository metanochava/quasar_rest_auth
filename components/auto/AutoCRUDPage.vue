<template>
  <q-page padding>
    <AutoTable
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :title="title"
      :pagination="pagination"
      @create="openCreate"
      @edit="openEdit"
      @delete="confirmDelete"
      @request="handleRequest"
      @inline-save="inlineSave"
    />

    <!-- FORM DIALOG -->
    <q-dialog v-model="dialog" persistent>
      <q-card style="min-width: 520px; max-width: 92vw;">
        <q-card-section class="text-h6">
          {{ editing ? tdc('Edit') : tdc('Create') }}
        </q-card-section>

        <q-card-section>
          <AutoForm :fields="fields" :model="form" />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat v-close-popup :label="tdc('Cancel')" />
          <q-btn color="primary" :label="tdc('Save')" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DELETE CONFIRM -->
    <q-dialog v-model="delDialog">
      <q-card style="min-width: 420px">
        <q-card-section class="text-h6">
          {{ tdc('Confirm delete') }}
        </q-card-section>
        <q-card-section>
          {{ tdc('Are you sure you want to delete') }}: <b>{{ delRow?.id }}</b> ?
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat v-close-popup :label="tdc('Cancel')" />
          <q-btn color="negative" :label="tdc('Delete')" :loading="saving" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Notify } from 'quasar'

import { tdc, HTTPAuth, buildFormFromSchema } from './../../index'

import AutoTable from './AutoTable.vue'
import AutoForm from './AutoForm.vue'


const route = useRoute()
const module = String(route.params.module)
const model = String(route.params.model)

const title = `${module}/${model}`

// Endpoint do CRUD (ajusta aqui se teu padrão for diferente)
const endpoint = `/${module}/${model.toLowerCase()}s/`

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
  fields.value = await buildFormFromSchema(module, model)

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
    const { data } = await HTTPAuth.get(endpoint, { params: buildParams(p, search, filters) })
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
      res = await HTTPAuth.put(`${endpoint}${payload.id}/`, payload)
    } else {
      res = await HTTPAuth.post(endpoint, payload)
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
    const res = await HTTPAuth.delete(`${endpoint}${delRow.value.id}/`)
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
    const res = await HTTPAuth.patch(`${endpoint}${row.id}/`, { [field]: value })
    notifyFromApi(res.data || { alert_success: tdc('Updated') })
  } catch (e) {
    Notify.create({ type: 'negative', message: tdc('Update failed') })
  }
}

onMounted(async () => {
  await loadSchema()
  await fetchRows({ pagination: pagination.value })
})
</script>
