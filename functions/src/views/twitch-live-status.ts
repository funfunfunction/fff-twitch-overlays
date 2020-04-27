import * as functions from "firebase-functions"
import firebaseAdmin from "firebase-admin"

import getOwnerAccessToken from "../helpers/assorted/get-owner-access-token"
import { getStreams } from "../helpers/twitch"
import getChannelOwnerUserId from "../helpers/assorted/get-channel-owner-user-id"

export default functions
  .runWith({
    memory: "128MB" // smallest
  })
  .pubsub.schedule("every 1 minutes")
  .onRun(async () => {
    const accessToken = await getOwnerAccessToken()
    const streamsResponse = await getStreams(
      functions.config().twitch.client_id,
      accessToken,
      getChannelOwnerUserId()
    )
    const streams = streamsResponse.data
    const isLive = streams.length > 0

    const docRef = firebaseAdmin.firestore().doc("views/twitch-live-status")

    if (!isLive) {
      // Since this runs very often, be a bit economical with the writes
      const doc = await docRef.get()
      if (doc.data()) await docRef.set({ live: false })
      return null
    }

    const currentStream = streams[0]
    const streamId = currentStream.id

    return docRef
      .set(
        {
          live: true,
          streamId
        },
        { merge: true }
      )
      .catch(error => {
        console.error("stream doc could not be set", error)
      })
  })
