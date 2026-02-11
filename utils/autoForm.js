import { tdc, HTTPAuth } from './../index'



function toPluralEndpoint(modelName) {
  // "Funcionario" -> "funcionarios"
  // ajuste simples: lower + "s". Se tua API usa outro plural, substitui aqui.
  return `${modelName.toLowerCase()}s`
}

function guessLabelKey(obj) {
  // tenta achar um campo “humano” pra label
  const candidates = ['nome', 'name', 'titulo', 'title', 'descricao', 'description', 'username', 'email']
  for (const k of candidates) if (obj && obj[k]) return k
  return 'id'
}

async function fetchRelationOptions(relation, search = '') {
  // relation = "rh.Departamento"
  if (!relation) return []

  const [app, model] = relation.split('.')
  const endpoint = `/${app}/${toPluralEndpoint(model)}/`

  const params = {}
  if (search) params.search = search
  params.page_size = 50

  const { data } = await HTTPAuth.get(endpoint, { params })
  const items = data?.results || data || []

  const labelKey = guessLabelKey(items[0])

  return items.map(x => ({
    label: String(x[labelKey] ?? x.id),
    value: x.id,
    raw: x
  }))
}

/**
 * buildFormFromSchema(module, model) -> fields config
 * espera GET /api/django_saas/modulo/<module>/<model>/schema/
 */
export async function buildFormFromSchema(module, model) {
  const { data } = await HTTPAuth.get(`/django_saas/modulos/${module}/${model}/schema/`)
  const out = []

  for (const f of (data.fields || [])) {
    // ignora id/auto se quiser (podes comentar)
    if (['id', 'created_at', 'updated_at'].includes(f.name)) continue

    let component = 'q-input'
    const props = {}

    // TYPE MAPPING
    switch (f.type) {
      case 'CharField':
      case 'TextField':
        component = 'q-input'
        props.type = 'text'
        break

      case 'IntegerField':
      case 'DecimalField':
      case 'MoneyField':
        component = 'q-input'
        props.type = 'number'
        break

      case 'BooleanField':
        component = 'q-toggle'
        break

      case 'DateField':
      case 'DateTimeField':
        component = 'q-input'
        props.type = 'date'
        break

      case 'JSONField':
        component = 'q-input'
        props.type = 'textarea'
        props.autogrow = true
        break

      case 'ImageField':
      case 'FileField':
        component = 'q-file'
        break

      case 'ForeignKey':
        component = 'q-select'
        props.multiple = false
        props.relation = f.relation
        props._relation = true
        break

      case 'ManyToManyField':
        component = 'q-select'
        props.multiple = true
        props.relation = f.relation
        props._relation = true
        break

      default:
        component = 'q-input'
    }

    // CHOICES
    if (f.choices && Array.isArray(f.choices) && f.choices.length) {
      component = 'q-select'
      props.options = f.choices.map(([v, l]) => ({ label: tdc(String(l)), value: v }))
      props.emitValue = true
      props.mapOptions = true
    }

    // RELATIONS: options async
    if (props._relation) {
      props.emitValue = true
      props.mapOptions = true
      props.useInput = true
      props.fillInput = false
      props.options = [] // vai carregar depois
      props.loadOptions = (search) => fetchRelationOptions(props.relation, search)
    }

    out.push({
      name: f.name,
      label: tdc(f.label || f.name),
      type: f.type,
      required: !!f.required,
      component,
      props
    })
  }

  return out
}
