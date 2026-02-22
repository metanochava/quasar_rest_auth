<script setup>
import { ref, watch, computed } from 'vue'
import { tdc } from '../../boot/base'
import { HTTPAuth, url } from '../../boot/api'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  schema: { type: Array, default: () => [] },
  data: { type: Object, default: null },
  module: { type: String, required: true },
  model: { type: String, required: true },
  canDo: { type: Function, default: () => true },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const form = ref({})
const saving = ref(false)
const uploadProgress = ref(0)

// layout por tabs
const tab = ref('general')

const generalFields = computed(() =>
  props.schema.filter(f => !f.ui?.isRelation && !f.ui?.isFile && !f.ui?.isImage)
)

const relationFields = computed(() =>
  props.schema.filter(f => f.ui?.isRelation)
)

const fileFields = computed(() =>
  props.schema.filter(f => f.ui?.isFile || f.ui?.isImage)
)

watch(
  () => props.data,
  (v) => { form.value = v ? { ...v } : {} },
  { immediate: true }
)

function close() {
  emit('update:modelValue', false)
}

function buildPayloadAndConfig() {
  // se tiver file/image, manda multipart
  const hasFiles = fileFields.value.some(f => form.value[f.name] instanceof File || Array.isArray(form.value[f.name]))

  if (!hasFiles) {
    return { data: form.value, config: {} }
  }

  const fd = new FormData()

  for (const [k, v] of Object.entries(form.value)) {
    if (v === undefined) continue
    if (v === null) { fd.append(k, ''); continue }

    if (v instanceof File) {
      fd.append(k, v)
      continue
    }

    // q-file pode retornar array
    if (Array.isArray(v) && v.length && v[0] instanceof File) {
      // assume 1 file
      fd.append(k, v[0])
      continue
    }

    // objects → JSON
    if (typeof v === 'object') {
      fd.append(k, JSON.stringify(v))
      continue
    }

    fd.append(k, String(v))
  }

  const config = {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (!e.total) return
      uploadProgress.value = Math.round((e.loaded * 100) / e.total)
    }
  }

  return { data: fd, config }
}

async function save() {
  saving.value = true
  uploadProgress.value = 0

  try {
    const apiBase = `/api/${props.module}/${props.model}/`

    const { data, config } = buildPayloadAndConfig()

    if (form.value?.id) {
      await HTTPAuth.put(url({ type: 'u', url: `${apiBase}${form.value.id}/` }), data, config)
    } else {
      await HTTPAuth.post(url({ type: 'u', url: apiBase }), data, config)
    }

    emit('saved')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <q-dialog v-model="modelValue" persistent>
    <q-card style="min-width: 760px; max-width: 92vw;">
      <q-card-section class="row items-center justify-between">
        <div class="text-h6">
          {{ form?.id ? 'Editar' : 'Novo' }}
        </div>
        <q-btn dense flat icon="close" @click="close" />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-tabs v-model="tab" dense>
          <q-tab name="general" label="Geral" />
          <q-tab name="relations" label="Relações" />
          <q-tab name="files" label="Ficheiros" />
        </q-tabs>

        <q-separator class="q-mt-sm q-mb-md" />

        <q-tab-panels v-model="tab" animated>
          <q-tab-panel name="general">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="f in generalFields" :key="f.name">
                <component
                  :is="f.component"
                  v-model="form[f.name]"
                  v-bind="f.props"
                />
                <div v-if="f.help_text" class="text-caption text-grey-7 q-mt-xs">{{ f.help_text }}</div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="relations">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="f in relationFields" :key="f.name">
                <component
                  :is="f.component"
                  v-model="form[f.name]"
                  v-bind="f.props"
                />
                <div v-if="f.help_text" class="text-caption text-grey-7 q-mt-xs">{{ f.help_text }}</div>
              </div>
            </div>
          </q-tab-panel>

          <q-tab-panel name="files">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6" v-for="f in fileFields" :key="f.name">
                <!-- preview image -->
                <div v-if="f.ui?.isImage && typeof form[f.name] === 'string' && form[f.name]" class="q-mb-sm">
                  <img :src="form[f.name]" style="max-width: 160px; border-radius: 8px;" />
                </div>

                <component
                  :is="f.component"
                  v-model="form[f.name]"
                  v-bind="f.props"
                />
                <div v-if="f.help_text" class="text-caption text-grey-7 q-mt-xs">{{ f.help_text }}</div>
              </div>
            </div>

            <div v-if="uploadProgress > 0 && uploadProgress < 100" class="q-mt-md">
              <q-linear-progress :value="uploadProgress / 100" />
              <div class="text-caption q-mt-xs">{{ uploadProgress }}%</div>
            </div>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancelar" @click="close" />
        <q-btn color="primary" :loading="saving" label="Salvar" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>