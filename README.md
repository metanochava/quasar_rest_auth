# quasar

# Fernando 847213584 cell julia
# Comandos de Compilacao e publicacao
### npm pack
##  

💎 Como usar no Wizard
🔥 simples demais
import { buildFormFromSchema } from '@metano/quasar_rest_auth'

const fields = ref([])
const formModel = ref({})

async function loadSchema() {
  fields.value = await buildFormFromSchema('rh', 'Funcionario')
}

template
<AutoForm
  :fields="fields"
  :model="formModel"
/>