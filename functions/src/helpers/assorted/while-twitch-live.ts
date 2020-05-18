import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import getOwnerAccessToken from "../assorted/get-owner-access-token"
import getChannelOwnerUserId from "../assorted/get-channel-owner-user-id"
import { getStreams } from "../twitch"
import getTwitchCredentials from "./get-twitch-credentials"
import { CloudFunction } from "firebase-functions"

const db = admin.firestore()

/**
 * Creates a firebase function that wraps and keeps running the given *callback* 
 * function approxmately every minute while the owner channel is live on 
 * Twitch. This is designed for long-running functions like the TMI.js
 * chat logger and will never spin up more than two at the same time.

 * @param id A unique string to identify the callback in the database.
 * @param callback Function that will be executed every minute while live.
 */
export default function whileTwitchLive(
  id: string,
  callback: () => Promise<any>
): CloudFunction<unknown> {
  const stateCollection = db.collection(`state/while-twitch-live/${id}`)
  return functions
    .runWith({
      memory: "128MB",
      timeoutSeconds: 9 * 60 // max allowed run time for cloud functions is 9 min
    })
    .pubsub.schedule("every 1 minutes")
    .onRun(async context => {
      // Only start logger if we're actually live on Twitch
      const ownerAccessToken = await getOwnerAccessToken()
      if (!(await isStreaming(ownerAccessToken))) {
        console.log("Owner channel is NOT live, no need to start up any logger")
        return null
      }

      // As we want reliable logging of chat, we'll use a firestore
      // document for each run of the whileTwitchLive callback to track run state
      // by sending pulses every few seconds. If we have not
      // received live signs from an whileTwitchLive wrapper for 25000 seconds,
      // it is assumed to have died and we'll start up some more
      // for redundancy
      const assumedDeadTime = Number(Date.now()) - 25000
      const snapshot = await stateCollection
        .where("pulse", ">", assumedDeadTime)
        .get()

      if (snapshot.size > 1) {
        console.log(
          "Got " +
            snapshot.size +
            " whileTwitchLive callbacks running already, won't start another"
        )
        return null
      } else {
        console.log(
          "Detected " +
            snapshot.size +
            " whileTwitchLive callbacks running, starting one more instance now."
        )
      }

      // Clean up any state of dead chatEventLoggers
      await stateCollection
        .where("pulse", "<", assumedDeadTime)
        .get()
        .then(querySnapshot => querySnapshot.forEach(doc => doc.ref.delete()))

      // Run the actual callback
      callback().catch(async error => {
        console.error(error)
        process.exit(1)
      })

      // pulse every five seconds
      const intervalId = setInterval(async function() {
        await stateCollection.doc(context.eventId).set({
          uid: context.eventId,
          pulse: Number(Date.now())
        })
      }, 5000)

      // automatically die gracefully after 8 min, cloud functions will time out after 9 otherwise
      return new Promise(resolve => {
        setTimeout(function() {
          console.log("Closing down whileTwitchLive (lifespan ended)")
          clearInterval(intervalId)
          resolve()
        }, 8 * 60 * 1000)
      })
    })
}

async function isStreaming(ownerAccessToken: string) {
  const streams = await getStreams(
    getTwitchCredentials().clientId,
    ownerAccessToken,
    getChannelOwnerUserId()
  )
  return streams.data.length > 0
}
