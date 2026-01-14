import { LanguageStore } from '../stores/AuthStore' 


let result = false
export const localStorageSetItem = (key, value) => {
  Object.keys(localStorage).forEach(function (keyLocal) {
    if (key === decrypt(keyLocal)) {
      localStorage.removeItem(keyLocal)
    }
  })
  localStorage.setItem(encrypt(key), (value))
}



export const pegaDominio = function () {
  let pagelocalurl = location.href // pega endereço que esta no navegador
  pagelocalurl = pagelocalurl.split('/') // quebra o endeço de acordo com a / (barra)
  const dominiourl = pagelocalurl[0] + '//' + pagelocalurl[2]
  return dominiourl // retorna a parte www.endereco.com.brs@
}




export const traducao = (texto = '') => {
  const linguaStore = LanguageStore()
  const chave = texto.toLowerCase().trim()

  const traducaoDireta = linguaStore.TraducaoMap[chave]

  if (!traducaoDireta) {
    return texto
  }

  return replaceTraducao
    ? replaceTraducao(texto, traducaoDireta)
    : traducaoDireta
}

function captura (texto = '') {
  return texto.match(/\s*%-\s*[\w\s-]+\s*-%\s*/g) || []
}

function replaceTraducao (texto = '', textDeTraducao = '') {
  const valores = captura(texto)
  if (!valores.length) return textDeTraducao

  let i = 0

  return textDeTraducao.replace(
    /\s*%-\s*[\w\s-]+\s*-%\s*/g,
    () => {
      const v = valores[i++]
      return v
        ? ' ' + v.replace('%-', '').replace('-%', '').trim() + ' '
        : ''
    }
  )
}


export const MeIsTipoEntidade = function (entidade, permission) {
  let result = false
  // console.log(entidade.nome, permission)
  if (entidade.nome === permission) {
    result = true
  }

  return result
}

// Initialize the annoying-background directive.
export const IsTipoEntidade = {
  bind (el, binding, _vnode) {
    if (el) {
      const ite = decrypt(localStorage.getItem(('tipo_entidade_nome')) + '')

      if (!(binding.value === ite)) {
        el.style.display = 'none'
      }
    }
  }
}

export const isTipoEntidadeMe = function (x) {
  const ite = decrypt(localStorage.getItem(('tipo_entidade_nome')) + '')
  if (x === ite) { return true } else { return false }
}

export const urlBase = (url = '') => {
  if (url === '') {
    return process.env.API
  }

  if (url != null) {
    if (url[0] === '/') {
      return process.env.API + url
    }
    if (url[0] === 'h') {
      return url
    }
  }
}

function base64url (source) {
  const CryptoJS = require('crypto-js')
  // Encode in classical base64
  let encodedSource = CryptoJS.enc.Base64.stringify(source)

  // Remove padding equal characters
  encodedSource = encodedSource.replace(/=+$/, '')

  // Replace characters according to base64url specifications
  encodedSource = encodedSource.replace(/\+/g, '-')
  encodedSource = encodedSource.replace(/\//g, '_')

  return encodedSource
}

export const createToken = (data, secret = 'se') => {
  // const base64url = require('base64url');
  const CryptoJS = require('crypto-js')
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header))
  const encodedHeader = base64url(stringifiedHeader)

  const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data))
  const encodedData = base64url(stringifiedData)

  const token = encodedHeader + '.' + encodedData

  let signature = CryptoJS.HmacSHA256(token, secret)
  signature = base64url(signature)

  const signedToken = token + '.' + signature

  return signedToken
}

export const setCookie = (cname, cvalue, exdays) => {
  const d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  const expires = 'expires=' + d.toUTCString()
  document.cookie = cname + '=' + cvalue + ';' + expires + ';path=/'
}

export const setStorage = (_type, _cname, _cvalue, _exdays) => {
  if (_type === 'l') {
    localStorage.setItem(_cname, _cvalue)
  }

  if (_type === 'c') {
    setCookie(_cname, _cvalue, _exdays)
  }
}

export const getCookie = (cname, _help = 0) => {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  if (_help === 0) {
    return ''
  } else {
    return null
  }
}

export const getStorage = (_type, _cname, _help = 0) => {
  let result = null
  if (_type === 'l') {
    result = localStorage.getItem(_cname)
  }

  if (_type === 'c') {
    if (_help === 0) {
      result = getCookie(_cname)
    } else {
      result = getCookie(_cname, _help)
    }
  }
  return result
}

export const deleteStorage = (_type, _cname) => {
  let result = null
  if (_type === 'l') {
    result = localStorage.removeItem(_cname)
  }

  if (_type === 'c') {
    setCookie(_cname, null, 0)
  }
  return result
}


