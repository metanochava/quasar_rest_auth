<template>
  <div>
    <component
      v-for="(field, index) in fields"
      :key="field.name + '_' + index"
      :is="resolveComp(field)"
      v-model="model[field.name]"
      :label="field.label"
      :rules="field.required ? [v => !!v || tdc('Required')] : []"
      class="q-mb-md"
      v-bind="bindProps(field)"
      @filter="(val, update) => onFilter(field, val, update)"
    />
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { QInput, QSelect, QFile, QToggle } from 'quasar'
import { tdc } from './../../boot/base'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  model: { type: Object, required: true }
})

const relationState = reactive({})

const compMap = {
  'q-input': QInput,
  'q-select': QSelect,
  'q-file': QFile,
  'q-toggle': QToggle
}

function resolveComp(field) {
  return compMap[field.component] || QInput
}

function bindProps(field) {
  const p = { ...(field.props || {}) }

  if (field.component === 'q-select' && field.props?._relation) {
    const st = relationState[field.name] || (relationState[field.name] = {
      loading: false,
      options: []
    })

    p.options = st.options
    p.loading = st.loading
    p.optionLabel = 'label'
    p.optionValue = 'value'
    p.emitValue = true
    p.mapOptions = true
    p.clearable = true
    p.useInput = true
    p.inputDebounce = 300
  }

  if (field.component === 'q-file') {
    p.clearable = true
    p.maxFileSize = p.maxFileSize || 20 * 1024 * 1024
  }

  return p
}

async function onFilter(field, val, update) {
  if (!(field.component === 'q-select' && field.props?._relation && typeof field.props.loadOptions === 'function')) {
    return
  }

  const st = relationState[field.name] || (relationState[field.name] = {
    loading: false,
    options: []
  })

  st.loading = true
  try {
    const options = await field.props.loadOptions(val || '')
    update(() => {
      st.options = options
    })
  } finally {
    st.loading = false
  }
}
</script>
