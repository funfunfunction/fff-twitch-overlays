import * as admin from "firebase-admin"

import getOwnerUsername from "./helpers/assorted/get-owner-username"
import getOwnerAccessToken from "./helpers/assorted/get-owner-access-token"

import tmi from "tmi.js"
import whileTwitchLive from "./helpers/assorted/while-twitch-live"

const db = admin.firestore()

// TODO can we get this to trigger on twitch-live-status updates by adding some lastupate,
// (but be beware of triggering tons of updates)
// not sure if we can combine with runWith as we need the timeoutSeconds

const chatEventLogger = whileTwitchLive('chat-event-logger', async function() {
  const accessToken = await getOwnerAccessToken()
  if (!accessToken) {
    console.error("Could not get owner access token, shutting down.")
    process.exit(1)
  }
  const chat = tmi.Client({
    connection: {
      reconnect: true,
      secure: true
    },
    identity: {
      username: getOwnerUsername(),
      password: "oauth:" + accessToken
    }
  })
  await chat.connect()
  await chat.join(getOwnerUsername())
  console.log("chatEventLogger joined channel of ", getOwnerUsername())

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

  chat.on("action", async (channel, userstate, message) =>
    logEvent("action", userstate, { message })
  )
})

async function logEvent(type, userstate, otherProps) {
  console.log("logEvent triggered:", type, userstate, otherProps)
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
