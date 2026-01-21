let pinia = null

export function setPinia(piniaInstance) {
  pinia = piniaInstance
}

export function getPinia() {
  if (!pinia) {
    throw new Error(
      '[quasar_saas] Pinia não inicializado. Chame setPinia(pinia) no boot.'
    )
  }
  return pinia
}
