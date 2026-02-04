<template>
  <div class="row q-col-gutter-sm q-mb-sm items-center">

    <div class="col-2">
      <q-input v-model="field.name" label="Name" dense outlined/>
    </div>

    <div class="col-2">
      <q-select
        v-model="field.type"
        :options="types"
        dense outlined
      />
    </div>

    <div class="col-1">
      <q-checkbox v-model="field.required" label="Req"/>
    </div>

    <div class="col-1">
      <q-checkbox v-model="field.unique" label="Unique"/>
    </div>

    <div class="col-2">
      <q-input v-model="field.default" label="Default" dense outlined/>
    </div>

    <!-- relation -->
    <div v-if="isRelation" class="col-2">
      <q-select
        v-model="field.relModule"
        :options="apps"
        option-label="name"
        option-value="name"
        dense
      />
    </div>

    <!-- file -->
    <div v-if="isFile" class="col-2">
      <q-input
        v-model="field.upload_to"
        label="upload_to"
        dense
      />
    </div>

    <q-btn
      v-if="canDelete"
      icon="delete"
      flat
      color="negative"
      @click="$emit('delete')"
    />

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: Object,
  apps: Array,
  canDelete: Boolean
})

const field = props.modelValue

const types = [
  'CharField','TextField','IntegerField','BooleanField',
  'ForeignKey','OneToOneField','ManyToManyField',
  'FileField','ImageField','JSONField'
]

const isRelation = computed(() =>
  ['ForeignKey','OneToOneField','ManyToManyField'].includes(field.type)
)

const isFile = computed(() =>
  ['FileField','ImageField'].includes(field.type)
)
</script>
