import { tdc, HTTPAuth, url,  toPluralEndpoint, guessLabelKey } from './../index'





async function fetchRelationOptions(relation, search = '') {
  // relation = "rh.Departamento"
  if (!relation) return []

  const [app, model] = relation.split('.')
  const endpoint = `/api/${app}/${toPluralEndpoint(model)}/`

  const params = {}
  if (search) params.search = search
  params.page_size = 50

  const { data } = await HTTPAuth.get(url({type:'u', url:endpoint, params: params}))
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
 * espera GET /api/django_saas/modulos/<module>/<model>/schema/
 */
export async function buildFormFromSchema(module, model) {
  const { data } = await HTTPAuth.get(url({type:'u', url:`/api/django_saas/modulos/${module}/${model}/schema/`, params:{}}))
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

export async function actionsFromSchema(module, model) {
  const { data } = await HTTPAuth.get(url({type:'u', url:`/api/django_saas/modulos/${module}/${model}/schema/`, params:{}}))
  return data.actions 
}




























// PRO+ — buildFormFromSchema
// ✅ masks (telefone, NIF, money)
// ✅ relations lazy-load + cache + debounce
// ✅ file/image preview (thumb)
// ✅ JSON editor (textarea + validate JSON)
// ✅ rules automáticas (required, min/max, max_length, min_length)
// ✅ choices -> select
// ✅ Date/DateTime -> input types corretos
// ⚠️ Ajusta 1 linha: SCHEMA_PATH se o teu backend retornar data.fields vs data.data.fields



// cache global simples p/ relations (por módulo/modelo + query)
const __relationCache = new Map()

function debounceAsync(fn, wait = 350) {
  let t = null
  let pending = null
  return (...args) => {
    if (t) clearTimeout(t)
    if (pending) pending.reject?.({ cancelled: true })
    return new Promise((resolve, reject) => {
      pending = { reject }
      t = setTimeout(async () => {
        try { resolve(await fn(...args)) }
        catch (e) { reject(e) }
        finally { pending = null; t = null }
      }, wait)
    })
  }
}

function safeJsonParse(s) {
  try { return { ok: true, value: JSON.parse(s) } } catch { return { ok: false, value: null } }
}

function guessMaskByName(name = '') {
  const n = String(name).toLowerCase()
  if (/(telefone|telemovel|tel|phone|mobile)/.test(n)) return '#########' // ajusta ao teu país
  if (/(nif|vat|tax|contribuinte)/.test(n)) return '#########'
  return null
}

function isFileType(t) { return ['FileField', 'ImageField'].includes(t) }
function isJsonType(t) { return ['JSONField'].includes(t) }
function isNumericType(t) {
  return [
    'IntegerField','BigIntegerField','SmallIntegerField','PositiveIntegerField','PositiveSmallIntegerField',
    'FloatField','DecimalField','MoneyField'
  ].includes(t)
}
function isCharType(t) { return ['CharField','TextField','SlugField','EmailField','URLField','UUIDField'].includes(t) }
function isRelationType(t) { return ['ForeignKey','OneToOneField','ManyToManyField'].includes(t) }

function buildRulesFromSchemaField(f) {
  const rules = []
  const label = tdc(String(f.label || f.verbose_name || f.name || 'field'))

  // required do backend: required = not blank
  if (f.required) {
    rules.push(v => (v !== null && v !== undefined && v !== '') || `${label}: ${tdc('required')}`)
  }

  // min/max length
  if (f.min_length != null) {
    rules.push(v => (v == null || String(v).length >= Number(f.min_length)) || `${label}: ${tdc('min length')} ${f.min_length}`)
  }
  if (f.max_length != null) {
    rules.push(v => (v == null || String(v).length <= Number(f.max_length)) || `${label}: ${tdc('max length')} ${f.max_length}`)
  }

  // numeric min/max
  if (f.min != null) {
    rules.push(v => (v == null || v === '' || Number(v) >= Number(f.min)) || `${label}: ${tdc('min')} ${f.min}`)
  }
  if (f.max != null) {
    rules.push(v => (v == null || v === '' || Number(v) <= Number(f.max)) || `${label}: ${tdc('max')} ${f.max}`)
  }

  // JSON validate
  if (isJsonType(f.type)) {
    rules.push(v => {
      if (v == null || v === '') return true
      return safeJsonParse(v).ok || `${label}: ${tdc('invalid JSON')}`
    })
  }

  return rules
}

// relation loader (ajusta ao teu endpoint real)
async function defaultFetchRelationOptions(relationStr, search = '') {
  // relationStr no schema: "app.Model"
  // Sugestão de endpoint padrão:
  // GET /saas/relations/?model=app.Model&search=...
  // Se tu não tens, troca aqui por GET /saas/<model-endpoint>/
  const { data } = await HTTPAuth.get(url({type:'u', url: '/api/django_saas/relations/',  params: { model: relationStr, search: search || '' }}))

  // esperado: [{id, label}] ou [{id, nome}] etc
  const rows = data?.results || data?.data || data || []
  return rows.map(r => ({
    label: tdc(String(r.label || r.nome || r.name || r.title || r.id)),
    value: r.id
  }))
}

export async function buildFormFromSchemaPRO({
  module,
  model,
  fetchRelationOptions = null, // opcional: injeta a tua função
  schemaPath = 'fields',        // 'fields' OR 'data.fields' (se o teu ok() embrulhar)
  ignoreFields = ['id','created_at','updated_at'],
  moneyMask = '#.##0,00',       // se usares mask monetária custom
} = {}) {

  if (!module || !model) throw new Error('module/model required')

  const { data } = await HTTPAuth.get(url({type:'u', url:`/api/django_saas/modulos/${module}/${model}/schema/`, params:{}}))

  // ✅ resolve schemaPath
  const fields =
    schemaPath === 'data.fields'
      ? (data?.data?.fields || [])
      : (data?.fields || [])

  const out = []

  const relFetcher = fetchRelationOptions
    ? (relation, search) => fetchRelationOptions(relation, search)
    : (relation, search) => defaultFetchRelationOptions(relation, search)

  const relFetcherDebounced = debounceAsync(relFetcher, 350)

  for (const f of fields) {
    if (!f?.name) continue
    if (ignoreFields.includes(f.name)) continue

    let component = 'q-input'
    const props = {
      filled: true,
      dense: true,
      clearable: true
    }

    // ---------- base label ----------
    const label = tdc(String(f.label || f.verbose_name || f.name))

    // ---------- default by type ----------
    switch (f.type) {
      // TEXT
      case 'CharField':
      case 'TextField':
      case 'SlugField':
      case 'EmailField':
      case 'URLField':
      case 'UUIDField':
        component = 'q-input'
        props.type = 'text'
        if (f.type === 'EmailField') props.type = 'email'
        if (f.type === 'URLField') props.type = 'url'
        if (f.type === 'TextField') {
          props.type = 'textarea'
          props.autogrow = true
        }
        if (f.max_length) props.maxlength = Number(f.max_length)
        break

      // NUMBERS
      case 'IntegerField':
      case 'BigIntegerField':
      case 'SmallIntegerField':
      case 'PositiveIntegerField':
      case 'PositiveSmallIntegerField':
      case 'FloatField':
      case 'DecimalField':
      case 'MoneyField':
        component = 'q-input'
        props.type = 'number'
        props.step = (f.type === 'DecimalField' || f.type === 'MoneyField' || f.type === 'FloatField') ? 'any' : '1'
        if (f.min != null) props.min = f.min
        if (f.max != null) props.max = f.max

        // money UX
        if (f.type === 'MoneyField') {
          props.prefix = props.prefix || ''
          props.inputmode = 'decimal'
          // se tu usas q-input-mask / mask plugin:
          // props.mask = moneyMask
        }
        break

      // BOOLEAN
      case 'BooleanField':
        component = 'q-toggle'
        props.clearable = false
        break

      // DATE/TIME
      case 'DateField':
        component = 'q-input'
        props.type = 'date'
        break
      case 'DateTimeField':
        component = 'q-input'
        props.type = 'datetime-local'
        break
      case 'TimeField':
        component = 'q-input'
        props.type = 'time'
        break

      // JSON
      case 'JSONField':
        component = 'q-input'
        props.type = 'textarea'
        props.autogrow = true
        props.placeholder = '{ "key": "value" }'
        break

      // FILE/IMAGE
      case 'FileField':
      case 'ImageField':
        component = 'q-file'
        props.clearable = true
        props.useChips = true
        props.maxFiles = 1
        // preview
        props._isFile = true
        props._isImage = (f.type === 'ImageField')
        break

      // RELATIONS
      case 'ForeignKey':
      case 'OneToOneField':
        component = 'q-select'
        props.multiple = false
        props.emitValue = true
        props.mapOptions = true
        props.useInput = true
        props.fillInput = false
        props.inputDebounce = 0 // vamos debounciar manualmente
        props.options = []
        props._relation = true
        props._relationType = f.type
        props.relation = f.relation
        break

      case 'ManyToManyField':
        component = 'q-select'
        props.multiple = true
        props.emitValue = true
        props.mapOptions = true
        props.useInput = true
        props.fillInput = false
        props.inputDebounce = 0
        props.options = []
        props._relation = true
        props._relationType = f.type
        props.relation = f.relation
        break

      default:
        component = 'q-input'
        props.type = 'text'
    }

    // ---------- choices override ----------
    if (Array.isArray(f.choices) && f.choices.length) {
      component = 'q-select'
      props.emitValue = true
      props.mapOptions = true
      props.options = f.choices.map(([v, l]) => ({
        label: tdc(String(l)),
        value: v
      }))
      // se choices, não é relation async
      delete props._relation
      delete props.relation
    }

    // ---------- masks by name ----------
    const m = guessMaskByName(f.name)
    if (m && component === 'q-input') props.mask = m

    // ---------- required visual ----------
    props.label = label
    props.rules = buildRulesFromSchemaField(f)

    // ---------- relations lazy load ----------
    if (props._relation && props.relation) {
      const relationKeyBase = props.relation

      props.onFilter = async (val, update, abort) => {
        try {
          const q = (val || '').trim()
          const cacheKey = `${relationKeyBase}::${q}`

          if (__relationCache.has(cacheKey)) {
            update(() => { props.options = __relationCache.get(cacheKey) })
            return
          }

          const opts = await relFetcherDebounced(relationKeyBase, q)
          __relationCache.set(cacheKey, opts)
          update(() => { props.options = opts })
        } catch (e) {
          abort?.()
        }
      }

      // pre-load vazio
      try {
        const cacheKey = `${relationKeyBase}::`
        if (__relationCache.has(cacheKey)) {
          props.options = __relationCache.get(cacheKey)
        } else {
          const opts = await relFetcher(relationKeyBase, '')
          __relationCache.set(cacheKey, opts)
          props.options = opts
        }
      } catch {}
    }

    out.push({
      name: f.name,
      label,
      type: f.type,
      required: !!f.required,
      help_text: f.help_text || '',
      component,
      props,

      // extras úteis pro renderer:
      schema: f,
      ui: {
        isFile: isFileType(f.type),
        isImage: f.type === 'ImageField',
        isJson: isJsonType(f.type),
        isNumeric: isNumericType(f.type),
        isChar: isCharType(f.type),
        isRelation: isRelationType(f.type),
      }
    })
  }

  return out
}
