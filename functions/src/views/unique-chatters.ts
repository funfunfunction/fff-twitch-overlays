import * as functions from "firebase-functions"
import firebaseAdmin from "firebase-admin"
// tslint:disable-next-line:no-implicit-dependencies
import { FieldValue } from "@google-cloud/firestore"

const {
  getOwnerAccessToken
} = require("../helpers/assorted/get-owner-access-token")
const { getStreams } = require("../helpers/twitch")

export default functions.firestore
  .document("events3/{eventId}")
  .onCreate(async snap => {
    const event = snap.data()
    if (!event) throw new Error('Event document did not have data')
    if (event.type !== "chat") return false

    const accessToken = await getOwnerAccessToken()
    const streamsResponse = await getStreams(
      functions.config().twitch.client_id,
      accessToken
    )
    const streams = streamsResponse.data
    if (streams.length === 0) {
      // not live, we don't care a about this chat message
      return null
    }
    const currentStream = streams[0]
    const streamId = currentStream.id
    const userId = event.userstate["user-id"]

    const viewRef = firebaseAdmin
      .firestore()
      .collection("views")
      .doc("unique-chatters")
    
      viewRef
      .collection("properties")
      .doc("current-stream-id")
      .set({
        value: streamId
      })
      .catch(error => {
        console.error('failed setting current-stream-id', error)
      })

    const streamRef = viewRef.collection("streams").doc(streamId)

    const userRef = streamRef.collection("chatters").doc(userId)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      userRef.set({
        appeared: Number(Date.now())
      }).catch(error => {
        console.error('failed inserting chatter doc', error)
      })
      streamRef
        .collection("properties")
        .doc("num-chatters")
        .set(
          {
            value: FieldValue.increment(1)
          },
          { merge: true }
        ).catch(error => {
          console.error('failed updating num-chatters', error)
        })
    }
    return null
  })
