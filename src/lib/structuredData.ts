export const getRequiredMapValue = <T>(value: Map<string, unknown>, key: string) => {
  if (!value.has(key)) {
    throw new Error(`Missing required key ${JSON.stringify(key)} in structured data.`)
  }
  return value.get(key) as T
}

export const toPlainObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(entry => toPlainObject(entry))
  }
  if (value instanceof Map) {
    const object = Object.create(null) as Record<string, unknown>
    for (const [key, entryValue] of value.entries()) {
      if (typeof key !== 'string') {
        throw new TypeError(`Expected string structured-data key, got ${typeof key}.`)
      }
      object[key] = toPlainObject(entryValue)
    }
    return object
  }
  return value
}
