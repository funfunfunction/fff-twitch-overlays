import * as functions from 'firebase-functions'
const {BigQuery} = require('@google-cloud/bigquery')


const streamIntoBigQuery = functions.firestore
  .document('events3/{eventId}')
  .onCreate(async (snap) => {
    const bigquery = new BigQuery();
    const bqDatasetId = 'collections';
    const bqTableId = 'events3';

    // Save userstate as key-value repeated records.
    const {message, ts, type, userstate} = snap.data();
    const userstates = [];
    for (const key in userstate) {
      let value = userstate[key];
      // Stringify if object
      if ((!!value) && (value.constructor === Object)) {
        value = JSON.stringify(value);
      }
      // Stringify if array
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      userstates.push({key: key, value: value});
    }
    const rows = [
      {
        message: message,
        ts: parseInt(ts, 10),
        type: type,
        userstate: userstates
      }
    ];
    
    return await bigquery
      .dataset(bqDatasetId)
      .table(bqTableId)
      .insert(rows)
      .catch(function(error) {
        console.error("Error streaming document to BigQuery: ", error);
      });
    })

export default streamIntoBigQuery