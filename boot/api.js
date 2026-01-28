import axios from 'axios'
import { getStorage, setStorage } from './storage'
import { AuthStore, UserStore } from '../stores/AuthStore'
import { LoadStore } from '../stores/AuthStore'

import { Alert } from './alerts'

const apiBaseUrl = process.env.API
axios.defaults.baseURL = apiBaseUrl
axios.defaults.withCredentials = false


function safeParse (value) {
  try {
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

export const url = (payload = {type: 'u', url: '', params: {} }) => {
  let tipoEntidadeNome = AuthStore?.TipoEntidate?.nome

  let urlFinal = ''

  if (payload.type === 'u') {
    urlFinal = apiBaseUrl + '/' + payload.url
  }

  if (payload.type === 'nu') {
    urlFinal = apiBaseUrl + '/' + tipoEntidadeNome.toLowerCase() + '/' + payload.url
  }
  
  urlFinal = urlFinal + '?format=json'
  for (const [key, value] of Object.entries(payload?.params)) {
    urlFinal = urlFinal + `&${key}=${value}`
  }
  return urlFinal
}

axios.defaults.headers = {
  Accept: 'application/json',
  fek:process.env.FRONT_END_KEY,
  fep:process.env.FRONT_END_PASSWORD
}

export const wsApi = (process.env.API + '/' + apiBaseUrl).replace('http', 'ws')


export const HTTPClient = axios.create({
  baseURL: process.env.API,
  headers: {
  }
})

export const HTTPClientBlob = axios.create({
  baseURL: process.env.API,
  headers: {
  }
})

export const HTTPAuth = axios.create({
  baseURL: process.env.API,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
}) 

export const HTTPAuthBlob = axios.create({
  baseURL: process.env.API,
  headers: {
    Accept: 'application/json'
  },
  responseType: 'blob'
})

HTTPAuthBlob.interceptors.request.use(async config => {
  store.commit('load/SET_LOAD', 1)
  const user = JSON.parse(getStorage('c', 'user'))
  setStorage('c', 'user', JSON.stringify(user), 365)
  config.headers.Authorization = 'Bearer ' + user?.tokens?.access

  const Load = LoadStore()
  Load.inc()
  return config
})



HTTPAuth.interceptors.request.use(async config => {
  const User = UserStore()
  config.withCredentials = false
  if (config.headers.Cookie) {
    delete config.headers.Cookie
  }
  
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data'
  }
  const headersMap = {
    E: 'userEntidade',
    S: 'userSucursal',
    G: 'userGrupo',
    ET: 'tipoEntidade',
    L: 'userLang'
  }

  config.headers.Authorization = `Bearer ${User.access || ''}`

  Object.entries(headersMap).forEach(([key, storage]) => {
    const data = safeParse(getStorage('c', storage))
    if (data?.id) config.headers[key] = data.id
  })
  
  const Load = LoadStore()
  Load.inc()

  return config
})

HTTPAuth.interceptors.response.use(
  (response) => {
    const Load = LoadStore()
    Load.dec()
    Alert(response)
    return response
  },
  (error) => {
    const User = UserStore()
    const Load = LoadStore()
    Load.dec()
    
    Alert(error.response)
    const status = error.response.status

    if (status === 401 || status === 403) {
      User.logout('N')
    }
  
    return Promise.reject(error)
  }
)



HTTPClient.interceptors.request.use(async config => {
  const User = UserStore()
  config.withCredentials = false
  if (config.headers.Cookie) {
    delete config.headers.Cookie
  }
  
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data'
  }
  const headersMap = {
    // L: 'userLang'
  }

  Object.entries(headersMap).forEach(([key, storage]) => {
    const data = safeParse(getStorage('c', storage))
    if (data?.id) config.headers[key] = data.id
  })

  const Load = LoadStore()
  Load.inc()

  return config
})

HTTPClient.interceptors.response.use(
  (response) => {
    const Load = LoadStore()
    Load.dec()
    Alert(response)
    return response
  },
  (error) => {
    const User = UserStore()
    const Load = LoadStore()
    Load.dec()
    
    Alert(error.response)
    const status = error.response.status

    if (status === 401 || status === 403) {
      User.logout('N')
    }
  
    return Promise.reject(error)
  }
)
