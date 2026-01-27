<template>
    <div >
      <input
        v-model="User.search"
        class="in"
        @input="filterMenus"
        :placeholder="tdc('Procurar')"
      />
    </div>
</template>

<style scoped>
  .in {
    height: 30px;
    line-height: 30px;   /* centraliza o texto verticalmente */
    width: 200px;        /* ajuste o comprimento aqui */
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
      this.filterMenus(this.User.search)
    },

    'User.Entidade'() {
      this.User.setEntidadeModelos()
      this.User.setEntidadeModulos()
    },

  },
  mounted () {
    this.filterMenus(this.User.search)
    this.User.setEntidadeModelos()
    this.User.setEntidadeModulos()
  },
  methods: {
      
    filterMenus (val) {
      if (val === '') {
        this.User.Menus = this.User.AllMenus
      } else {
        const needle = val.toLowerCase()
        this.User.Menus  = this.User.AllMenus.map(v => ({
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
