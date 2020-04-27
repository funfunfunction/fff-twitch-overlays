import * as functions from "firebase-functions"
import firebaseAdmin from "firebase-admin"
// tslint:disable-next-line:no-implicit-dependencies
import { FieldValue, FieldPath } from "@google-cloud/firestore"

export default functions.firestore
  .document("events3/{eventId}")
  .onCreate(async snap => {

    const db = firebaseAdmin.firestore()

    const event = snap.data()
    if (!event) throw new Error("Event document did not have data")
    if (event.type !== "chat") return false

    const liveStatusDoc = await firebaseAdmin.firestore().doc("views/twitch-live-status").get()
    const liveStatus = liveStatusDoc.data()

    if (!liveStatus || !liveStatus.live) {
      // Don't log if we're not live
      return null
    }
    const streamId = liveStatus.streamId
    const userId = event.userstate["user-id"]
    const view = db.doc("views/unique-chatters")

    const chatterQueryResult = await view.collection("chatters")
      .where(FieldPath.documentId(), '==', streamId)
      .where(userId, '==', true)
      .get()
    
    const isChatterUnique = chatterQueryResult.size === 0

    if (!isChatterUnique) return null
    
    await Promise.all([
      view
        .collection("chatters")
        .doc(streamId)
        .set({ [userId]: true }, { merge: true})
        .catch(error => { console.error("failed saving chatter doc", error) }),
      view
        .collection("chatter-counts")
        .doc(streamId)
        .set({ unique: FieldValue.increment(1) }, { merge: true })
        .catch(error => {
          console.error("failed incrementing chatter-count", error)
        })
    ])
    return null
  })
