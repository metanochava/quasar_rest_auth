<template>
  <div>

    <q-table
      :rows="rows"
      :columns="columnsWithActions"
      :loading="loading"
      row-key="id"
      :pagination="pagination"
      @request="onRequest"
      flat bordered
    >

      <!-- TOP -->
      <template #top>
        <div class="row full-width items-center">

          <div class="text-h6">{{ title }}</div>
          <q-space />

          <q-input
            dense outlined
            v-model="search"
            :placeholder="tdc('Search')"
            @keyup.enter="refresh"
          />

          <q-btn outline icon="filter_alt" @click="filtersOpen = !filtersOpen"/>
          <q-btn outline icon="download" @click="exportCsv"/>
          <q-btn color="primary" icon="add" @click="$emit('create')"/>

        </div>


        <!-- 🔥 FILTERS AUTO -->
        <div v-if="filtersOpen" class="row q-col-gutter-sm q-mt-md">

          <div
            v-for="c in filterableColumns"
            :key="c.name"
            class="col-3"
          >

            <!-- relation dropdown -->
            <q-select
              v-if="c.relation"
              dense outlined
              use-input
              :options="relationOptions[c.name]"
              v-model="filters[c.name]"
              @filter="(v,u)=>loadRelationOptions(c,v,u)"
              :label="tdc(c.label)"
              emit-value map-options
            />

            <!-- normal input -->
            <q-input
              v-else
              dense outlined
              v-model="filters[c.name]"
              :label="tdc(c.label)"
            />

          </div>

        </div>
      </template>


      <!-- 🔥 RELATION LABEL AUTO -->
      <template
        v-for="col in relationColumns"
        :key="col.name"
        v-slot:[`body-cell-${col.name}`]="props"
      >
        <q-td>

          {{ resolveRelationLabel(props.row[col.field], col.name) }}

        </q-td>
      </template>


      <!-- ACTIONS -->
      <template #body-cell-actions="props">
        <q-td>
          <q-btn flat icon="edit" @click="$emit('edit', props.row)" />
          <q-btn flat icon="delete" color="negative" @click="$emit('delete', props.row)" />
        </q-td>
      </template>

    </q-table>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { exportFile } from 'quasar'
import { tdc, HTTPAuth } from './../../index'


const props = defineProps({
  rows: Array,
  columns: Array,
  pagination: Object,
  loading: Boolean,
  title: String
})

const emit = defineEmits(['request','create','edit','delete'])

const search = ref('')
const filtersOpen = ref(false)
const filters = reactive({})

const relationOptions = reactive({})
const relationMap = reactive({}) // id → label


// --------------------------------------------------
// RELATION DETECTION
// --------------------------------------------------

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


// --------------------------------------------------
// LOAD RELATION OPTIONS
// --------------------------------------------------

async function loadRelationOptions(col, search, update) {

  const [app, model] = col.relation.split('.')

  const { data } = await HTTPAuth.get(
    `/${app}/${model.toLowerCase()}s/`,
    { params:{ search, page_size:50 } }
  )

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


// --------------------------------------------------
// LABEL RESOLVE
// --------------------------------------------------

function resolveRelationLabel(value, colName) {

  // nested object
  if (value && typeof value === 'object')
    return value.nome || value.name || value.id

  // id mapping
  return relationMap[value] || value
}


// --------------------------------------------------
// CSV
// --------------------------------------------------

function exportCsv() {
  const content = JSON.stringify(props.rows)
  exportFile('export.csv', content)
}


// --------------------------------------------------

function refresh() {
  emit('request', { pagination:props.pagination, search, filters })
}

function onRequest(ctx) {
  emit('request', { pagination:ctx.pagination, search, filters })
}
</script>

