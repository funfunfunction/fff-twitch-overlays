import * as admin from "firebase-admin"

import getOwnerUsername from "../helpers/assorted/get-owner-username"
import getOwnerAccessToken from "../helpers/assorted/get-owner-access-token"

import tmi from "tmi.js"
import whileTwitchLive from "../helpers/assorted/while-twitch-live"

import { isString } from "util"

const db = admin.firestore()

const chatEventLogger = whileTwitchLive("chat-event-logger", async function() {
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
    logRawChatEvent("chat", userstate, message)
  )

  chat.on("subscription", (channel, username, method, message, userstate) =>
    logRawChatEvent("subscription", userstate)
  )

  chat.on("resub", (channel, username, months, message, userstate) =>
    logRawChatEvent("resub", userstate)
  )

  chat.on(
    "subgift",
    (channel, username, streakMonths, recipient, methods, userstate) =>
      logRawChatEvent("subgift", userstate)
  )

  chat.on(
    "submysterygift",
    (channel, username, numbOfSubs, methods, userstate) =>
      logRawChatEvent("submysterygift", userstate)
  )

  chat.on("cheer", (channel, userstate, message) =>
    logRawChatEvent("cheer", userstate, message)
  )

  chat.on("action", (channel, userstate, message) =>
    logRawChatEvent("action", userstate, message)
  )
})

async function logRawChatEvent(
  type,
  userstate: tmi.CommonUserstate,
  message?: string
) {
  console.log("logRawChatEvent:", { type, userstate, message })
  try {
    if (!isLoggableUserState(userstate))
      throw new Error(
        `Userstate of event ${type} failed isLoggableChatUserState: ${JSON.stringify(
          userstate
        )}`
      )

    const ts: number = parseInt(userstate["tmi-sent-ts"])
    if (isNaN(ts))
      throw new Error(
        "Userstate had value that parsed as NaN:" +
          JSON.stringify({ userstate })
      )

    // Use Twitch message id as key so that we can do
    // idempotent updates, running multiple cloud functions
    const key: string = userstate.id
    const data: TMIRawEvent = {
      type,
      ts,
      userstate,
      message
    }
    await db
      .collection("views/twitch-tmi-raw/events")
      .doc(key)
      .set(data)
  } catch (e) {
    throw new Error(
      `Failed writing ${type} event to database:` +
        JSON.stringify({ userstate, message })
    )
  }
}

function isLoggableUserState(x: any): x is LoggableUserstate {
  return isString(x.id) && x["tmi-sent-ts"]
}

interface LoggableUserstate {
  id: string
  "tmi-sent-ts": string
}

interface TMIRawEvent {
  type:
    | "chat"
    | "subscription"
    | "resub"
    | "subgift"
    | "submysterygift"
    | "cheer"
    | "action"
  ts: number
  userstate: tmi.CommonUserstate & LoggableUserstate
  message: string | undefined
}

export default chatEventLogger
