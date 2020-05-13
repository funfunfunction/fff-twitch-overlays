import * as functions from "firebase-functions"
import firebaseAdmin from "firebase-admin"
import {
  SubscriptionTMIRawEvent,
  eventCollectionFirebasePath as tmiRawPath
} from "../tmi-raw"
import OffendingPropError from "../../helpers/assorted/offending-prop-error"
import getCurrentStream from "../../helpers/assorted/get-current-stream"
import {
  streamDocPath,
  notificationsCollectionPath,
  SubscriberChatNotificationData
} from "./shared"

export default functions.firestore
  .document(tmiRawPath + "/{eventId}")
  .onCreate(async (snap, context) => {
    const currentStream = await getCurrentStream()
    if (!currentStream) {
      // This should not happen as subscribe notification should
      // be listened to when live
      console.warn("Could not find current stream")
      return
    }

    const data = snap.data()
    if (!data) throw new Error("no document data")
    if (data.type !== "subscription" && data.type !== "resub") return false
    const event: SubscriptionTMIRawEvent = snap.data() as SubscriptionTMIRawEvent

    // Even with types in place from tmi.js, the twitch API
    // responses are so dynamic and messy that we need some checks below
    // order to make sure that the event data actually contains
    // the properties we need in the format we need:

    // Docs for these events are here, we're logging them as
    // raw as possible from TMI.js (it does some processing though)
    // https://dev.twitch.tv/docs/irc/tags

    const cumulativeMonthsRaw = event.userstate["msg-param-cumulative-months"]

    let cumulativeMonths
    if (cumulativeMonthsRaw === true) {
      // Because of faulty twitch tag parsing logic,
      // TMI.js parses 1 as true and 0 as false.
      // See: https://github.com/tmijs/tmi.js/blob/v1.6.0/lib/client.js#L99
      cumulativeMonths = 1
    } else if (typeof cumulativeMonthsRaw === "string") {
      cumulativeMonths = parseInt(cumulativeMonthsRaw)
      if (isNaN(cumulativeMonths))
        throw OffendingPropError("cumulativeMonths", event)
    } else {
      throw OffendingPropError("cumulativeMonths", event)
    }

    if (typeof event.userstate["display-name"] !== "string")
      throw OffendingPropError("display-name", event)

    if (typeof event.userstate["user-id"] !== "string")
      throw OffendingPropError("user-id", event)

    const db = firebaseAdmin.firestore()

    // Store timestamp for last event, so that
    // we can prune these views later
    await db.doc(streamDocPath(currentStream.id)).set(
      {
        tsLastNotification: event.ts
      },
      { merge: true }
    )

    // re-use key from raw events - which is in turn using
    // the id from userstate
    const key = context.params.eventId
    const doc: SubscriberChatNotificationData = {
      id: context.params.eventId,
      ts: event.ts,
      userId: event.userstate["user-id"],
      displayName: event.userstate["display-name"],
      cumulativeMonths,
      message: event.message
    }

    return firebaseAdmin
      .firestore()
      .collection(notificationsCollectionPath(currentStream.id))
      .doc(key)
      .set(doc)
  })
