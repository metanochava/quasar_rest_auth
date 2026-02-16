<!-- DynamicFormEngine.vue (Quasar + Vue 3) -->
<template>
  <div class="row ">
    <component
      outlined
      v-for="field in normalizedFields"
      :key="field.__key"
      :is="field.__component"
      v-model="localModel[field.name]"
      :label="field.label"
      :rules="field.required ? [v => isFilled(field, v) || tdc('Required')] : []"
      class="q-mb-md col-md-4 col-sm-6"
      v-bind="field.__bindProps"
      @filter="(val, update, abort) => onFilter(field, val, update, abort)"
    />

    <!-- debug opcional -->
    <!-- <pre>{{ localModel }}</pre> -->
  </div>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { tdc } from './../../boot/base'

// ✅ IMPORTANTE: Para <component :is="..."> funcionar no Quasar,
// use os componentes reais (QInput/QSelect/QFile/QToggle) e não "q-input".
import { QInput, QSelect, QFile, QToggle } from 'quasar'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  // v-model do pai
  model: { type: Object, required: true },
})

// ✅ mantém referência para o objeto do pai (não clone)
const localModel = props.model

// estado interno p/ relações (options/loading) por field
const relationState = reactive({}) // { [fieldName]: { loading: boolean, options: [] } }

// ---------------------------
// helpers
// ---------------------------
function compFromName(name) {
  const n = String(name || '').toLowerCase().trim()
  if (n === 'q-input' || n === 'qinput') return QInput
  if (n === 'q-select' || n === 'qselect') return QSelect
  if (n === 'q-file' || n === 'qfile') return QFile
  if (n === 'q-toggle' || n === 'qtoggle') return QToggle
  return QInput
}

function defaultFor(field) {
  // prioridade: default vindo do backend
  if (field.default !== undefined && field.default !== null) return field.default

  // relação com multiple => array
  if ((field.type === 'ManyToManyField' || field.props?.multiple) && field.component?.includes('select')) return []

  // q-file pode ser null ou [] se multiple
  if (field.component?.includes('file')) return field.props?.multiple ? [] : null

  // boolean
  if (field.type === 'BooleanField' || field.component?.includes('toggle')) return false

  // números
  if (field.type === 'IntegerField' || field.type === 'FloatField' || field.type === 'DecimalField') return null

  // texto
  return ''
}

function ensureModelKeys(fields) {
  for (const f of fields) {
    if (!f?.name) continue
    if (!(f.name in localModel)) localModel[f.name] = defaultFor(f)
  }
}

function isFilled(field, v) {
  // required para arrays
  if (Array.isArray(v)) return v.length > 0
  // required para boolean: aceita false como preenchido
  if (field.type === 'BooleanField' || field.__component === QToggle) return v === true || v === false
  // required normal
  return v !== null && v !== undefined && String(v).trim() !== ''
}

// ---------------------------
// normalização dos fields
// ---------------------------
const normalizedFields = computed(() => {
  const fs = Array.isArray(props.fields) ? props.fields : []

  // garante keys no model (para v-model não quebrar)
  ensureModelKeys(fs)

  return fs
    .filter(f => f && f.name)
    .map((f, idx) => {
      const component = compFromName(f.component)

      const bindProps = { ...(f.props || {}) }

      // ---- QSelect (relações)
      const isRelation = component === QSelect && !!bindProps._relation
      if (isRelation) {
        const st = relationState[f.name] || (relationState[f.name] = { loading: false, options: [] })

        // normalizações seguras
        bindProps.options = st.options
        bindProps.loading = st.loading

        // garante formato de options
        bindProps.optionLabel = bindProps.optionLabel || 'label'
        bindProps.optionValue = bindProps.optionValue || 'value'
        bindProps.mapOptions = bindProps.mapOptions ?? true
        bindProps.emitValue = bindProps.emitValue ?? true
        bindProps.clearable = bindProps.clearable ?? true

        // UX
        bindProps.useInput = bindProps.useInput ?? true
        bindProps.fillInput = bindProps.fillInput ?? false
        bindProps.inputDebounce = bindProps.inputDebounce ?? 300
      }

      // ---- QFile
      if (component === QFile) {
        bindProps.clearable = bindProps.clearable ?? true
        bindProps.maxFileSize = bindProps.maxFileSize || 20 * 1024 * 1024
      }

      // ---- QInput: se campo numérico e não veio type, define
      if (component === QInput) {
        if (!bindProps.type) {
          if (['IntegerField', 'FloatField', 'DecimalField'].includes(f.type)) bindProps.type = 'number'
          else bindProps.type = 'text'
        }
      }

      return {
        ...f,
        __key: `${f.name}_${idx}`,
        __component: component,
        __bindProps: bindProps,
      }
    })
})

// quando fields mudam, garante que o model tem as chaves
watch(
  () => props.fields,
  (fs) => ensureModelKeys(Array.isArray(fs) ? fs : []),
  { immediate: true, deep: true }
)

// ---------------------------
// filtro remoto (QSelect use-input)
// ---------------------------
async function onFilter(field, val, update, abort) {
  if (field.__component !== QSelect) return
  const p = field.__bindProps || {}
  if (!p._relation) return

  // função que você injeta no field.props.loadOptions
  if (typeof p.loadOptions !== 'function') {
    // sem loader, não faz nada
    update(() => {})
    return
  }

  const st = relationState[field.name] || (relationState[field.name] = { loading: false, options: [] })

  st.loading = true
  try {
    const options = await p.loadOptions(val || '')
    update(() => {
      // garante [{label,value}] ou use optionLabel/optionValue
      st.options = Array.isArray(options) ? options : []
    })
  } catch (e) {
    if (abort) abort()
  } finally {
    st.loading = false
  }
}
</script>
