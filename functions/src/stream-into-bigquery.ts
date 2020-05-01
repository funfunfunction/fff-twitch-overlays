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
  .document("events4/{eventId}")
  .onCreate(async snap => {
    const bigquery = new BigQuery()
    const bqDatasetId = "collections"
    const bqTableId = "events4"

    const data = snap.data() as any
    if (!data) throw new Error("event document did not contain any data")

    // Save userstate as key-value repeated records.
    const { message,
      ts,
      type,
      userstate,
      method,
      methods,
      recipient,
      numbOfSubs,
      months,
      streakMonths } = data
    const rows = [
      {
        date: new Date(parseInt(ts, 10)).toISOString().substr(0,10),
        ts: parseInt(ts, 10),
        display_name: userstate["display-name"],
        type: type,
        message: message,
        userstate: makeKeyValuePairs(userstate),
        method: makeKeyValuePairs(method),
        methods: makeKeyValuePairs(methods),
        recipient: recipient,
        numb_of_subs: parseInt(numbOfSubs, 10),
        months: parseInt(months, 10),
        streak_months: parseInt(streakMonths, 10)
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
