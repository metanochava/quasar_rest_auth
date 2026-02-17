<template>
  <div>

    <q-table
      flat
      bordered
      row-key="id"
      :rows="rows"
      :columns="columnsWithActions"
      :loading="loading"
      :pagination="pagination"
      @request="onRequest"
    >

      <!-- =========================
           TOP BAR
      ========================== -->
      <template #top>
        <div class="row full-width items-center q-gutter-sm">

          <div class="text-h6">{{ title }}</div>
          <q-space />

          <!-- SEARCH -->
          <q-input
            dense
            outlined
            debounce="400"
            v-model="search"
            :placeholder="tdc('Search')"
            @keyup.enter="refresh"
          />

          <!-- FILTER TOGGLE -->
          <q-btn
            outline
            icon="filter_alt"
            @click="filtersOpen = !filtersOpen"
          />

          <!-- EXPORT -->
          <q-btn
            outline
            icon="download"
            @click="exportCsv"
          />

          <!-- CREATE -->
          <q-btn
            color="primary"
            icon="add"
            @click="$emit('create')"
          />
        </div>

        <!-- =========================
             FILTERS
        ========================== -->
        <div
          v-if="filtersOpen"
          class="row q-col-gutter-sm q-mt-md"
        >
          <div
            v-for="c in filterableColumns"
            :key="c.name"
            class="col-3"
          >

            <!-- RELATION FILTER -->
            <q-select
              v-if="c.relation"
              dense
              outlined
              use-input
              emit-value
              map-options
              clearable
              :label="tdc(c.label)"
              v-model="filters[c.name]"
              :options="relationOptions[c.name]"
              @filter="(v,u)=>loadRelationOptions(c,v,u)"
            />

            <!-- NORMAL FILTER -->
            <q-input
              v-else
              dense
              outlined
              clearable
              :label="tdc(c.label)"
              v-model="filters[c.name]"
            />

          </div>
        </div>
      </template>

      <!-- =========================
           RELATION LABEL RENDER
      ========================== -->
      <template
        v-for="col in relationColumns"
        :key="col.name"
        v-slot:[`body-cell-${col.name}`]="props"
      >
        <q-td>
          {{ resolveRelationLabel(props.row[col.field], col.name) }}
        </q-td>
      </template>

      <!-- =========================
           ACTIONS
      ========================== -->
      <template #body-cell-actions="props">
        <q-td class="q-gutter-xs">
          <q-btn
            flat
            dense
            icon="edit"
            @click="$emit('edit', props.row)"
          />
          <q-btn
            flat
            dense
            color="negative"
            icon="delete"
            @click="$emit('delete', props.row)"
          />
        </q-td>
      </template>

    </q-table>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { exportFile } from 'quasar'
import { HTTPAuth, url } from './../../boot/api'
import { tdc } from './../../boot/base'

/* =========================
   PROPS / EMITS
========================= */
const props = defineProps({
  rows: { type:Array, default:()=>[] },
  columns: { type:Array, default:()=>[] },
  pagination: { type:Object, required:true },
  loading: { type:Boolean, default:false },
  title: { type:String, default:'' }
})

const emit = defineEmits(['request','create','edit','delete'])

/* =========================
   STATE
========================= */
const search = ref('')
const filtersOpen = ref(false)
const filters = reactive({})

const relationOptions = reactive({})
const relationMap = reactive({}) // id -> label

/* =========================
   COLUMNS
========================= */
const relationColumns = computed(() =>
  props.columns.filter(c => c.relation)
)

const filterableColumns = computed(() =>
  props.columns.filter(c => c.name !== 'actions')
)

const columnsWithActions = computed(() => {
  const cols = [...props.columns]
  cols.push({ name:'actions', label:'', field:'actions' })
  return cols
})

/* =========================
   LOAD RELATION OPTIONS
========================= */
async function loadRelationOptions(col, search, update) {

  const [app, model] = col.relation.split('.')

  const { data } = await HTTPAuth.get(url({type:'u', url: `/${app}/${model.toLowerCase()}s/`, params: { search, page_size:50 }}) )

  const rows = data.results || data

  const opts = rows.map(r => ({
    label: r.nome || r.name || r.id,
    value: r.id
  }))

  relationOptions[col.name] = opts

  for (const o of opts)
    relationMap[o.value] = o.label

  update(()=>{})
}

/* =========================
   RELATION LABEL
========================= */
function resolveRelationLabel(value, colName) {

  if (value && typeof value === 'object')
    return value.nome || value.name || value.id

  return relationMap[value] || value || ''
}

/* =========================
   CSV EXPORT
========================= */
function exportCsv() {
  const content = JSON.stringify(props.rows, null, 2)
  exportFile('export.csv', content)
}

/* =========================
   REQUEST / PAGINATION
========================= */
function refresh() {
  emit('request', {
    pagination: props.pagination,
    search,
    filters
  })
}

function onRequest(ctx) {
  emit('request', {
    pagination: ctx.pagination,
    search,
    filters
  })
}
</script>
