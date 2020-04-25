import * as functions from "firebase-functions"
import * as admin from "firebase-admin"

import getOwnerAccessToken from "./helpers/assorted/get-owner-access-token"
import getChannelOwnerUserId from "./helpers/assorted/get-channel-owner-user-id"

import { getStreams } from "./helpers/twitch"

import tmi from "tmi.js"

const db = admin.firestore()

const TWITCH_CLIENT_ID = functions.config().twitch.client_id

const chatEventLogger = functions
  .runWith({
    memory: "128MB",
    timeoutSeconds: 9 * 60 // max allowed run time for cloud functions is 9 min
  })
  .pubsub.schedule("every 1 minutes")
  .onRun(async context => {
    // Only start logger if we're actually live on Twitch
    const ownerAccessToken = await getOwnerAccessToken()
    if (!(await isStreaming(ownerAccessToken))) {
      console.log("FFF is not live, no need to start up any logger")
      return null
    }

    // As we want reliable logging of chat, we'll use a firestore
    // document for each run of chatEventLogger to track run state
    // by sending pulses every few seconds. If we have not
    // received live signs from an eventLogger for 25000 seconds,
    // it is assumed to have died and we'll start up some more
    // for redundancy
    const assumedDeadTime = Number(Date.now()) - 25000
    const snapshot = await db
      .collection("event-logger-state")
      .where("pulse", ">", assumedDeadTime)
      .get()

    if (snapshot.size > 1) {
      console.log(
        "Got " +
          snapshot.size +
          " chatEventLoggers running already, wont start another"
      )
      return null
    } else {
      console.log(
        "Detected " +
          snapshot.size +
          " chatEventLoggers running, starting one instance now."
      )
    }

    // Clean up any state of dead chatEventLoggers
    await db
      .collection("event-logger-state")
      .where("pulse", "<", assumedDeadTime)
      .get()
      .then(querySnapshot => querySnapshot.forEach(doc => doc.ref.delete()))

    // Start watching chat
    ;(async function() {
      const chat = tmi.Client({})
      await chat.connect()
      await chat.join("funfunfunction")
      console.log("chatEventLogger joined channel")

      chat.on("chat", (channel, userstate, message) =>
        logEvent("chat", userstate, { message })
      )

      chat.on("subscription", (channel, username, method, message, userstate) =>
        logEvent("subscription", userstate, { method, message })
      )

      chat.on(
        "resub",
        (channel, username, months, message, userstate, methods) =>
          logEvent("resub", userstate, { months, message, methods })
      )

      chat.on(
        "subgift",
        (channel, username, streakMonths, recipient, methods, userstate) =>
          logEvent("subgift", userstate, { methods, recipient, streakMonths })
      )

      chat.on(
        "submysterygift",
        async (channel, username, numbOfSubs, methods, userstate) =>
          logEvent("submysterygift", userstate, { numbOfSubs, methods })
      )

      chat.on("cheer", async (channel, userstate, message) =>
        logEvent("cheer", userstate, { message })
      )

      chat.on("action", async (channel, userstate, message, self) =>
        logEvent("action", userstate, { message })
      )
    })().catch(async error => {
      console.error(error)
      process.exit(1)
    })

    // pulse every five seconds
    const intervalId = setInterval(async function() {
      await db
        .collection("event-logger-state")
        .doc(context.eventId)
        .set({
          uid: context.eventId,
          pulse: Number(Date.now())
        })
    }, 5000)

    // automatically die gracefully after 8 min, cloud functions will time out after 9 otherwise
    return new Promise(resolve => {
      setTimeout(function() {
        console.log("Closing down chatEventLogger (lifespan ended)")
        clearInterval(intervalId)
        resolve()
      }, 8 * 60 * 1000)
    })
  })

async function isStreaming(ownerAccessToken) {
  const streams = await getStreams(
    TWITCH_CLIENT_ID,
    ownerAccessToken,
    getChannelOwnerUserId()
  )
  return streams.data.length > 0
}

async function logEvent(type, userstate, otherProps) {
  try {
    // Use Twitch message id as key so that we can do idempotent updates, running multiple cloud functions
    const key = userstate["id"]
    if (!key) {
      throw new Error("No id on userstate")
    }
    await db
      .collection("events3")
      .doc(key)
      .set({
        type,
        ts: parseInt(userstate["tmi-sent-ts"]),
        userstate,
        ...otherProps
      })
  } catch (e) {
    console.warn(
      `Failed writing ${type} event to database`,
      userstate,
      otherProps
    )
  }
}

export default chatEventLogger
