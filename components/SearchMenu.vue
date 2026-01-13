<template>
    <div >
      <input
        v-model="Auth.search"
        class=" input-28 "
        @input="filterMenus"
        :placeholder="tdc('Procurar')"
      />
    </div>
</template>

<style scoped>
  .input-28 {
    height: 30px;
    line-height: 30px;   /* centraliza o texto verticalmente */
    width: 300px;        /* ajuste o comprimento aqui */
    padding: 0 8px;      /* espaço interno lateral */
  }
</style>

<script >

import { defineComponent } from 'vue'
import { tdc } from '../boot/app'
import { UserStore, AuthStore } from '../stores/AuthStore'



export default defineComponent({
  name: 'SearchMenu',

  components: {

  },
  setup () {

    const User = UserStore()
    const Auth = AuthStore()

    return {
      User,
      Auth,
      tdc
    }
  },
  data () {
    return {
      search: ''
    }
  },
  computed: {

  },
  watch: {
    'User.Permicoes' () {
      this.filterMenus(this.Auth.search)
    },

    'User.Entidade'() {
      this.Auth.setTipoEntidadeMenus()
      this.User.setEntidadeModelos()
      this.User.setEntidadeModulos()
    },

  },
  mounted () {
    this.filterMenus(this.Auth.search)
    this.Auth.setTipoEntidadeMenus()
    this.User.setEntidadeModelos()
    this.User.setEntidadeModulos()
  },
  methods: {
      
    filterMenus (val) {
      console.log(val)
      if (val === '') {
        this.Auth.TipoEntidadeMenus = this.Auth.TipoEntidadeAllMenus
      } else {
        const needle = val.toLowerCase()
        this.Auth.TipoEntidadeMenus  = this.Auth.TipoEntidadeAllMenus.map(v => ({
          ...v,
          submenu: v.submenu.filter(sub =>
            sub.menu && sub.menu.toLowerCase().includes(needle.toLowerCase())
          )
        })).filter(v => v.submenu.length > 0)
      }
    }
  }
})
</script>
