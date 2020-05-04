import * as functions from "firebase-functions"
import firebaseAdmin from "firebase-admin"
import {
  SubscriptionTMIRawEvent,
  eventCollectionFirebasePath as tmiRawPath
} from "../tmi-raw"
import OffendingPropError from "../../helpers/assorted/offending-prop-error"
import getCurrentStream from "../../helpers/assorted/get-current-stream"
import { streamDocPath, TMISubscriberNotificaton, notificationsCollectionPath } from "./shared"

const db = firebaseAdmin.firestore()

export default functions.firestore
  .document(tmiRawPath + "/{notificationId}")
  .onCreate(async (snap, context) => {

    const currentStream = await getCurrentStream()
    if (!currentStream) {
      // This should not happen as subscribe notification should 
      // be listened to when live
      console.warn('Could not find current stream')
      return
    }
    
    const data = snap.data()
    if (!data) throw new Error("no document data")
    if (data.type !== "subscription") return false
    const notification: SubscriptionTMIRawEvent = snap.data() as SubscriptionTMIRawEvent

    // Docs for these events are here, we're logging them as
    // raw as possible from TMI.js (it does some processing though)
    // https://dev.twitch.tv/docs/irc/tags

    const cumulativeMonths = parseInt(notification.userstate[
      "msg-param-cumulative-months"
    ] as any)

    if (isNaN(cumulativeMonths))
      throw OffendingPropError("cumulativeMonths", notification)

    if (typeof notification.userstate["display-name"] !== "string")
      throw OffendingPropError("display-name", notification)

    if (typeof notification.userstate["user-id"] !== "string")
      throw OffendingPropError("user-id", notification)

    // Store timestamp for last event, so that
    // we can prune these views later
    await db.doc(streamDocPath(currentStream.id))
      .set({
        tsLastNotification: notification.ts
      }, { merge: true })
    
    // re-use key from raw events - which is in turn using
    // the id from userstate
    const key = context.params.notificationId
    const doc: TMISubscriberNotificaton = {
      id: key,
      ts: notification.ts,
      userId: notification.userstate["user-id"],
      displayName: notification.userstate["display-name"],
      cumulativeMonths,
      message: notification.message
    }

    return db
      .collection(notificationsCollectionPath(currentStream.id))
      .doc(key)
      .set(doc)
  })





