<template>
  <q-page class="row items-center justify-evenly">

    <q-card square flat class="text-center">
      <q-card-section>

        <q-card v-if="incorrectAuth" class="bg-red text-white">
          <q-card-section>
            {{ tdc('Incorrect username or password') }}
          </q-card-section>
        </q-card>

        <q-form @submit.prevent="login()">

          <q-input v-model="identifier" outlined dense label="Email ou Celular" />

          <q-input
            v-model="password"
            :type="isPwd ? 'password' : 'text'"
            outlined dense
          >
            <template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                @click="isPwd = !isPwd"
                class="cursor-pointer"
              />
            </template>
          </q-input>

          <q-checkbox v-model="User.manterLogado" label="Manter-me logado" />

          <q-btn type="submit" color="primary" label="Entrar" class="full-width" />
        </q-form>

      </q-card-section>
    </q-card>

  </q-page>
</template>

<script >

import { defineComponent } from 'vue'
import { tdc } from '../boot/app'
import { AuthStore, UserStore } from '../stores/AuthStore'
import { setStorage, getStorage } from '../boot/storage';
import { useQuasar } from 'quasar'


export default defineComponent({
  name: 'FormLogin',

  props: {

  },

  components: {

  },
  setup () {
    const Auth = AuthStore()
    const  User = UserStore()
    const q = useQuasar()
    return {
      Auth,
      tdc,
      User,
      q
    }
  },
  data () {
    return {
      user_id: null,
      entidade_id: null,
      isPwd: true,
      readonly: false,
      identifier: '',
      password: '',
      incorrectAuth: false,
      correctAuth: false,
      latitude: '',
      longitude: '',
      local: '',
      ipAddress: '0.0.0.0'
    }
  },
  computed: {

  },
  watch: {

  },
  mounted () {

   if (getStorage('c', 'manterlogado') === 'true') {
      this.User.manterLogado = true
    } else {
      this.User.manterLogado = false
    }
    this.getGeolocation()

  },
  methods: {
    check () {
      setStorage('c', 'manterlogado', this.User.manterLogado, 365)
    },
    getGeolocation () {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(this.setPosition, this.errorPosition)
      } else {
        this.errorPosition()
      }
    },
    setPosition (position) {
      const coords = position.coords
      this.latitude = coords.latitude
      this.longitude = coords.longitude
    },
    errorPosition () {
      this.q.notify({
        position: 'bottom',
        timeout: 3000,
        color: 'negative',
        textColor: 'white',
        actions: [{ icon: 'close', color: 'white' }],
        message: 'Não foi possível recupera sua posição!'
      })
    },

    async login () {

      setStorage('c', 'manterlogado', this.User.manterLogado, 365)

      this.correctAuth = false

      await this.User.login({
        identifier: this.identifier,
        password: this.password,
      }, this.q, this.$router)
    }
  }
})
</script>
