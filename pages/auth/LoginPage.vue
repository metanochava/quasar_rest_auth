<template>
  <div class="q-pa-md">
    <FormLogin />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

import { UserStore } from './../../stores/AuthStore'
import FormLogin from './../../components/FormLogin.vue'

export default defineComponent({
  components: {
    FormLogin,
  },
  setup() {
    const User = UserStore()
    return {
      User,
    }
  },
  data() {
    return {}
  },
  computed: {},

  mounted() {},

  methods: {},
})
</script>
