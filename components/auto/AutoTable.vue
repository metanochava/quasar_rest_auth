<script setup>
import { ref, computed } from 'vue'
import { exportFile } from 'quasar'

const props = defineProps({
  rows: Array,
  columns: Array,
  schema: Array,
  loading: Boolean,
  pagination: Object,
  actions: Array,
  canDo: Function
})

const emit = defineEmits([
  'request',
  'create',
  'edit',
  'delete',
  'filter',
  'refresh',
  'inline-patch',
  'run-action'
])

// 🔧 UI state
const visibleColumns = ref([])
const density = ref('normal')

// 🔧 computed
const allColumns = computed(() => props.columns.map(c => c.name))
const effectiveColumns = computed(() =>
  visibleColumns.value.length ? visibleColumns.value : allColumns.value
)

// 🔧 inline edit allowed
function isEditable(name) {
  const f = props.schema.find(x => x.name === name)
  if (!f) return false
  if (f.ui?.isFile || f.ui?.isImage || f.ui?.isRelation) return false
  return true
}

// 🔧 export CSV
function exportCSV() {
  const cols = props.columns.filter(c => c.name !== '__actions')

  const header = cols.map(c => `"${c.label}"`).join(',')

  const body = props.rows.map(r =>
    cols.map(c => `"${String(r[c.field] ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  exportFile('export.csv', `${header}\n${body}`)
}
</script>

<template>
  <mark-table
    :rows="rows"
    :columns="columns"
    :loading="loading"
    v-model:pagination="pagination"
    :visible-columns="effectiveColumns"
    :dense="density === 'dense'"
    row-key="id"
    @request="emit('request', $event)"
  >

    <!-- 🔥 HEADER ACTIONS -->
    <template #top>
      <div class="row q-gutter-sm">

        <q-btn icon="add" color="primary" @click="emit('create')" />
        <q-btn icon="filter_list" @click="emit('filter')" />
        <q-btn icon="refresh" @click="emit('refresh')" />
        <q-btn icon="download" @click="exportCSV" />

        <q-select
          v-model="density"
          :options="['dense','normal']"
          dense
          outlined
          style="width:120px"
        />

        <q-select
          v-model="visibleColumns"
          :options="allColumns"
          multiple
          dense
          outlined
          style="min-width:200px"
          label="Colunas"
        />

      </div>
    </template>

    <!-- 🔥 INLINE EDIT -->
    <template #body-cell="props">
      <q-td :props="props">

        <template v-if="props.col.name !== '__actions' && isEditable(props.col.name)">
          <q-popup-edit
            :model-value="props.value"
            auto-save
            v-slot="scope"
            @save="val => emit('inline-patch', {
              id: props.row.id,
              field: props.col.field,
              value: val
            })"
          >
            <q-input v-model="scope.value" dense autofocus />
          </q-popup-edit>

          <span class="cursor-pointer">{{ props.value }}</span>
        </template>

        <template v-else>
          {{ props.value }}
        </template>

      </q-td>
    </template>

    <!-- 🔥 ACTIONS -->
    <template #body-cell-__actions="props">
      <q-td :props="props">

        <q-btn dense flat icon="edit" @click="emit('edit', props.row)" />
        <q-btn dense flat icon="delete" color="red" @click="emit('delete', props.row)" />

        <q-btn
          v-for="a in actions"
          :key="a.url"
          dense
          flat
          :label="a.details"
          :disable="a.permission && !canDo(a.permission)"
          @click="emit('run-action', { action: a, row: props.row })"
        />

      </q-td>
    </template>

  </mark-table>
</template>