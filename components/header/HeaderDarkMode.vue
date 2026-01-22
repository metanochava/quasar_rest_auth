<template>
  <q-btn
    round dense flat
    :icon="$q.dark.isActive ? 'mdi-weather-night' : 'mdi-white-balance-sunny'"
    @click="toggleDark"
  >
    <q-tooltip>
      {{ $q.dark.isActive ? tdc('Modo dia') : tdc('Modo noite') }}
    </q-tooltip>
  </q-btn>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { tdc } from '../../boot/app'
import { getStorage, setStorage } from '../../boot/base'

const $q = useQuasar()

const toggleDark = () => {
  const newValue = !$q.dark.isActive
  $q.dark.set(newValue)
  setStorage('c', 'dark', newValue, 365)
}

const isDark = getStorage('c', 'dark') === 'true'
$q.dark.set(isDark)
</script>
