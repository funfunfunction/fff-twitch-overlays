import * as functions from "firebase-functions"
import { BigQuery } from "@google-cloud/bigquery"

const makeKeyValuePairs = function(obj) {
  if (!obj) return null

  const pairs = [] as any[]

  for (const key in obj) {
    let value = obj[key]
    // Stringify if object
    if (!!value && value.constructor === Object) {
      value = JSON.stringify(value)
    }
    // Stringify if array
    if (Array.isArray(value)) {
      value = JSON.stringify(value)
    }
    // Stringify if boolean
    if (value === true || value === false) {
      value = value.toString()
    }
    pairs.push({ key, value })
  }
  return pairs
}

const streamIntoBigQuery = functions.firestore
  .document("events3/{eventId}")
  .onCreate(async snap => {
    const bigquery = new BigQuery()
    const bqDatasetId = "collections"
    const bqTableId = "events3"

    const data = snap.data() as any
    if (!data) throw new Error("event document did not contain any data")

    // Save userstate as key-value repeated records.
    const { message, ts, type, userstate } = data
    const userstates = makeKeyValuePairs(userstate)

    const rows = [
      {
        message: message,
        ts: parseInt(ts, 10),
        type: type,
        userstate: userstates
      }
    ]

    return await bigquery
      .dataset(bqDatasetId)
      .table(bqTableId)
      .insert(rows)
      .catch(function(error) {
        console.error(
          "Error streaming document to BigQuery: ",
          JSON.stringify(error)
        )
      })
  })

export default streamIntoBigQuery
