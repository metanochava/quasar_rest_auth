
<template>
  <q-page >
    {{  module }} ||| {{  model }}
    <AutoTable
      :rows="rows"
      :columns="columns"
      :schema="schema"
      :actions="actions"
      :can-do="canDo"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
      @create="openCreate"
      @edit="openEdit"
      @delete="onDelete"
      @filter="showFilter = true"
      @inline-patch="onInlinePatch"
      @run-action="onRunAction"
      @refresh="loadData"
    />

    <!-- <AutoForm
      v-model="showForm"
      :schema="schema"
      :module="module"
      :model="model"
      :data="selectedRow"
      :can-do="canDo"
      @saved="onSaved"
    />

    <AutoFilter
      v-model="showFilter"
      :schema="schema"
      @apply="onApplyFilter"
    /> -->
  </q-page>
</template>



<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AutoTable from './AutoTable.vue'
import AutoForm from './AutoForm.vue'
import AutoFilter from './AutoFilter.vue'

import { HTTPAuth, url } from '../../boot/api'
import { buildFormFromSchema, actionsFromSchema } from '../../utils/autoForm'





// --- props ---
const props = defineProps({
  module: { type: String, required: true },
  model: { type: String, required: true },

  // opcional: função de permissão (ex: (perm) => userCan(perm))
  can: { type: Function, default: null },

  // opcional: schemaPath (se o teu ok() embrulha)
  schemaPath: { type: String, default: 'fields' }, // 'fields' | 'data.fields'
})

watch(
  () => [props.module, props.model],
  async ([module, model], [oldModule, oldModel]) => {
    // 🔒 proteção
    if (!module || !model) return

    // 🔁 evita reload desnecessário
    if (module === oldModule && model === oldModel) return

    // reset estado
    schema.value = []
    actions.value = []
    rows.value = []
    pagination.value.page = 1

    await init()
  },
  { immediate: true }
)
// --- state ---
const schema = ref([])
const actions = ref([])
const rows = ref([])
const loading = ref(false)

const showForm = ref(false)
const showFilter = ref(false)

const selectedRow = ref(null)

// server-side pagination/sort
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'id',
  descending: true,
})

// filtros aplicados (server-side)
const filters = ref({})

// cache simples por module+model
const __cacheKey = computed(() => `${props.module}::${props.model}`)

// columns dinâmicas
const columns = computed(() => {
  const base = schema.value.map(f => ({
    name: f.name,
    label: f.label,
    field: f.name,
    sortable: true,
    align: 'left',
  }))
  base.push({ name: '__actions', label: 'Ações', field: '__actions', sortable: false })
  return base
})

// permissões
function canDo(perm) {
  if (!perm) return true
  if (typeof props.can === 'function') return !!props.can(perm)
  return true // fallback: mostra tudo
}

async function init() {
  if (!props.module || !props.model) {
    console.warn('init skipped: missing module/model')
    return
  }

  schema.value = await buildFormFromSchema({
    module: props.module,
    model: props.model,
    schemaPath: props.schemaPath,
  })

  try {
    actions.value = await actionsFromSchema(props.module, props.model)
  } catch {
    actions.value = []
  }

  await loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      page_size: pagination.value.rowsPerPage,
      ordering: pagination.value.sortBy
        ? `${pagination.value.descending ? '-' : ''}${pagination.value.sortBy}`
        : undefined,
      ...filters.value,
    }

    const { data } = await HTTPAuth.get(
      url({ type: 'u', url: `api/django_saas/modulos/${props.module}/${props.model}/schema/`, params })
    )

    rows.value = data?.results || data || []
    pagination.value.rowsNumber = data?.count ?? rows.value.length
  } finally {
    loading.value = false
  }
}

function onRequest(req) {
  pagination.value = req.pagination
  loadData()
}

function openCreate() {
  selectedRow.value = null
  showForm.value = true
}

function openEdit(row) {
  selectedRow.value = row
  showForm.value = true
}

async function onDelete(row) {
  await HTTPAuth.delete(url({ type: 'u', url: `/api/${props.module}/${props.model}/${row.id}/` }))
  await loadData()
}

async function onSaved() {
  showForm.value = false
  await loadData()
}

function onApplyFilter(payload) {
  filters.value = payload || {}
  pagination.value.page = 1
  showFilter.value = false
  loadData()
}

// inline edit (PATCH)
async function onInlinePatch({ id, field, value }) {
  await HTTPAuth.patch(
    url({ type: 'u', url: `/api/${props.module}/${props.model}/${id}/` }),
    { [field]: value }
  )
  await loadData()
}

// executar action dinâmica (POST /custom-url ou /{id}/action/)
async function onRunAction({ action, row }) {
  if (action?.permission && !canDo(action.permission)) return

  // action.url pode ser absoluto/relativo. Se for relativo, assume /api/...
  const actionUrl = action.url?.startsWith('http')
    ? action.url
    : `/api/${action.url?.replace(/^\//, '')}`

  const method = (action.method || 'POST').toUpperCase()

  if (method === 'GET') {
    await HTTPAuth.get(url({ type: 'u', url: actionUrl, params: { id: row?.id } }))
  } else {
    await HTTPAuth.request({
      method,
      url: url({ type: 'u', url: actionUrl }),
      data: row?.id ? { id: row.id } : {},
    })
  }

  await loadData()
}

onMounted(init)
</script>
