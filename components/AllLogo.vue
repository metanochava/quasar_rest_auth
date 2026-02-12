
<template>
  <div class=" text-center col-md-6">
    <img v-if="User.Entidade" :src="User.Entidade?.logo?.url"   class="" style="width:40%" align="center" />
    <img v-else-if="this.$route.params.entidade_id" :src="User.Entidade?.logo?.url"   class="" style="width:40%" align="center" />
    <img v-else :src="User.TipoEntidade?.icon?.url"   class="" style="width:40%" align="center" />
    <br/>
   <label v-if="this.$route.params.entidade_id" class="text-grey-6 text-h4"> {{st(User.Entidade?.nome)}}</label>
   <label v-else class="text-grey-6 text-h4"> {{st(User.TipoEntidade?.nome)}}</label>
  </div>
</template>

<script setup>
import { HTTPClient, url} from './../boot/api'
import { UserStore, } from './../stores/AuthStore'

const User = UserStore()

</script>

<script >
import { HTTPClient, apiUrl } from 'src/boot/axios'
import { useStore } from 'vuex'
import { appName, appLogo, entidadeName, entidadeLogo, setStorage, getStorage, st } from 'src/js/appMytech'
import { defineComponent, computed } from 'vue'

export default defineComponent({
  name: 'Logo',
  components: {

  },
  
  computed: {
  },
  watch: {
    Entidade (value, oldvalue) {
    }
  },
  methods: {
    getHostname (tipoEnt) {
      const domain = window.location.href.split('/')[2].split('.')[0]
      if (domain.toLocaleLowerCase() !== tipoEnt.nome.toLowerCase()) {
        return true
      } else {
        this.$store.commit('tipoEntidade/SET_TIPO_ENTIDADE', tipoEnt)
        this.TipoEntidade = tipoEnt
        setStorage('c', 'tipoEntidade', JSON.stringify(tipoEnt))
        return false
      }
    },

    async getTipoEntidades () {
      this.spiner = true
      try {
        await HTTPClient.get(apiUrl({ type: 'au', url: 'tipoEntidades/', params: {} }))
          .then(res => {
            this.$store.commit('tipoEntidade/SET_TIPO_ENTIDADES', res?.data?.results)
            res?.data?.results.forEach(tipoEntidade => {
              this.getHostname(tipoEntidade)
            })
            this.spiner = false
          }).catch(err => {
            this.spiner = false
            console.log(err)
          })
      } catch (error) {
        console.log(error.message)
      }
    },

    async getEntidade () {
      try {
        await HTTPClient.get(url({ type: 'u', url: 'entidades/' + this.$route.params.entidade_id, params: {} }))
          .then(res => {
            this.$store.commit('entidade/SET_ENTIDADE', res?.data)
            setStorage('c', 'entidade', JSON.stringify(res?.data))
            this.Entidade = JSON.parse(getStorage('c', 'entidade'))
            this.entidadeLogo = res?.data?.logo?.url
            this.spiner = false
          }).catch(err => {
            this.spiner = false
            console.log(err)
          })
      } catch (error) {
        console.log(error.message)
      }
    }
  },

  mounted () {
    if (this.$route.params.entidade_id) {
      this.getEntidade(this.$route.params.entidade_id)
    } else {
      this.getTipoEntidades()
    }
  }
})

</script>