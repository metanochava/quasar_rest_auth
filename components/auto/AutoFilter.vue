<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schema: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'apply'])

const tab = ref('basic')
const f = ref({})

// heurística simples: campos bons para filtrar
const basicFields = computed(() =>
  props.schema.filter(x => {
    if (x.ui?.isFile || x.ui?.isImage) return false
    if (x.ui?.isRelation) return true
    if (x.ui?.isChar || x.ui?.isNumeric) return true
    return false
  }).slice(0, 10)
)

const advancedFields = computed(() =>
  props.schema.filter(x => {
    if (x.ui?.isFile || x.ui?.isImage) return false
    return true
  })
)

watch(() => props.modelValue, (open) => {
  if (open) tab.value = 'basic'
})

function close() {
  emit('update:modelValue', false)
}

function clear() {
  f.value = {}
}

function apply() {
  // remove vazios
  const payload = Object.fromEntries(
    Object.entries(f.value).filter(([_, v]) => v !== null && v !== undefined && v !== '')
  )
  emit('apply', payload)
}
</script>

<template>
  <q-dialog v-model="modelValue">
    <q-card style="min-width: 720px; max-width: 92vw;">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">Filtros</div>
        <q-btn dense flat icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-tabs v-model="tab" dense>
          <q-tab name="basic" label="Básico" />
          <q-tab name="advanced" label="Avançado" />
        </q-tabs>

        <q-separator class="q-mt-sm q-mb-md" />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="basic">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="field in basicFields" :key="field.name">
                <component
                  :is="field.component"
                  v-model="f[field.name]"
                  v-bind="field.props"
                  :label="field.label"
                />
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="advanced">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="field in advancedFields" :key="field.name">
                <component
                  :is="field.component"
                  v-model="f[field.name]"
                  v-bind="field.props"
                  :label="field.label"
                />
              </div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Limpar" @click="clear" />
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn color="primary" label="Aplicar" @click="apply" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>