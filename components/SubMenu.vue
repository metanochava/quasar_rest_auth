<template>
  <div >

        <q-item
          v-for="sm in Dados"
          :key="sm"
          dense
          clickable
          v-ripple
          :to="{ name: sm?.rota }"
        >
          <q-item-section avatar>
            <q-icon :name="sm.icon" />
          </q-item-section>
          <q-item-section>{{ tdc(sm.menu) }}</q-item-section>
          <q-item-section side>
            <q-item dense style="margin-right: -20px" clickable v-ripple v-if="sm?.submenu">
              <q-icon name="chevron_right" size="sm" :color="$q.dark.isActive ? '' : 'primary'">
                <q-menu anchor="top right" self="top left">
                  <q-list style="min-width: 150px">
                    <q-item
                      v-for="sm1 in sm.submenu"
                      :key="sm1"
                      dense
                      clickable
                      v-ripple
                      :to="{ name: sm1?.rota }"
                    >
                      <q-item-section avatar>
                        <q-icon :name="sm.icon" />
                      </q-item-section>
                      <q-item-section>{{ tdc(sm1.menu) }}</q-item-section>
                      <q-item-section side>
                        <q-item
                          dense
                          style="margin-right: -20px"
                          clickable
                          v-ripple
                          v-if="sm1?.submenu"
                        >
                          <q-icon
                            name="chevron_right"
                            size="sm"
                            :color="$q.dark.isActive ? '' : 'primary'"
                          >
                            <q-menu anchor="top right" self="top left">
                              <q-list style="min-width: 150px">
                                <q-item
                                  v-for="sm2 in sm.submenu"
                                  :key="sm2"
                                  dense
                                  clickable
                                  v-ripple
                                  :to="{ name: sm2?.rota }"
                                >
                                  <q-item-section avatar>
                                    <q-icon :name="sm.icon" />
                                  </q-item-section>
                                  <q-item-section>{{ tdc(sm2.menu) }}</q-item-section>
                                  <q-item-section side>
                                    <q-item
                                      dense
                                      style="margin-right: -20px"
                                      clickable
                                      v-ripple
                                      :to="{ name: sm2?.add_rota }"
                                    >
                                      <q-icon
                                        name="add"
                                        size="sm"
                                        :color="$q.dark.isActive ? '' : 'primary'"
                                      >
                                        <q-tooltip
                                          :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'"
                                        >
                                          {{ tdc('Adicionar ') }} {{ tdc(sm2.menu) }}
                                        </q-tooltip>
                                      </q-icon>
                                    </q-item>
                                  </q-item-section>
                                </q-item>
                              </q-list>
                            </q-menu>
                            <q-tooltip :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
                              {{ tdc('Expandir Menu ') }}
                            </q-tooltip>
                          </q-icon>
                        </q-item>
                        <q-item
                          dense
                          style="margin-right: -20px"
                          clickable
                          v-ripple
                          :to="{ name: sm1.add_rota }"
                          v-else
                        >
                          <q-icon name="add" size="sm" :color="$q.dark.isActive ? '' : 'primary'">
                            <q-tooltip :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
                              {{ tdc('Adicionar ') }} {{ tdc(sm1.menu) }}
                            </q-tooltip>
                          </q-icon>
                        </q-item>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
                <q-tooltip :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
                  {{ tdc('Expandir Menu') }}
                </q-tooltip>
              </q-icon>
            </q-item>
            <q-item
              dense
              style="margin-right: -20px"
              clickable
              v-ripple
              :to="{ name: sm.add_rota }"
              v-else
            >
              <q-icon name="add" size="sm" :color="$q.dark.isActive ? '' : 'primary'">
                <q-tooltip :class="$q.dark.isActive ? 'bg-dark' : 'bg-primary'">
                  {{ tdc('Adicionar ') }} {{ tdc(sm.menu) }}
                </q-tooltip>
              </q-icon>
            </q-item>
          </q-item-section>
        </q-item>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { tdc } from '../boot/app'

export default defineComponent({
  name: 'SubMenu',
  props: {
    Dados: {
      type: Array,
      required: true,
      default: () => []
    }
  },

  setup (props) {
    return {
      tdc,
      props
    }
  }
})
</script>
