/**
 * Handy error for throwing errors related to
 * a single property that prints out an offending
 * object as prettier JSON
 * @param propertyName
 * @param obj
 */
export default function OffedingPropError(propertyName: string, obj: any) {
  const json = JSON.stringify(obj, null, 2)
  const message = `Unexpected value of property '${propertyName}' on object`
  return Error(`${message}: ${json}`)
}
