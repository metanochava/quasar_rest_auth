
<template>

    <q-card>
        <q-bar :class="$q.dark.isActive ? 'bg-primary text-white' : 'bg-primary text-white'">
        &nbsp; {{tdc('')}} {{ modulo }}  | {{ modelo }} |  {{ mothod }}  | {{ permission }} | {{ details }}
        <q-space />
        <q-btn dense flat icon="close" v-close-popup>
            <q-tooltip>{{tdc('Fechar')}}</q-tooltip>
        </q-btn>
        </q-bar>

        <q-card-section >
            <q-input outlined
                v-model="text_text"
                class=""
                dense
                :placeholder="tdc('Tem algum feedback? Adoraríamos ouvir; mas não compartilhe informações confidenciais. Tem perguntas? Tente ajuda ou suporte.')"
                type="textarea"
                :rules="[ val => val && val.length > 0 || tdc('Este campo e obrigatório.')]"
                />
        </q-card-section>

        <q-card-section >
        {{tdc('Cria a Accao.')}}
        </q-card-section>
        <q-separator />

        <q-card-actions align="right">
        <q-btn  v-close-popup   :color="$q.dark.isActive ? '' : 'dark'" >{{tdc('Cancelar')}}</q-btn>
        <q-btn   :color="$q.dark.isActive ? 'primary' : 'primary'" type="submit" @click="save_text" > {{tdc('Enviar')}}</q-btn>
        </q-card-actions>
    </q-card>

</template>


<script>
import { defineComponent } from 'vue'
import { tdc } from '../../boot/base'

export default defineComponent({

  setup () {
    return {
      
    }
  },
  props: {
    modulo: {
      type: String,
      required: false,
      default: ''
    },
    modelo: {
      type: String,
      required: false,
      default: ''
    },
    accao: {
      type: Array,
      required: false,
      default: ''
    }
  },

  data () {
    return {
      tdc: tdc
    }
  },
  created () {
  },
  computed: {
  },
  mounted () {
    
  },

  methods: {
    save_text () {
      this.text = !this.text
    }
  }
})
</script>
