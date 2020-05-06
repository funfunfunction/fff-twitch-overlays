import {
  twitchLiveStatusDocumentPath
} from "@functions/src/views/twitch-live-status/shared"

type UnsubscribeFunc = () => void

export function subscribeToCurrentStreamId(
  callback: (streamId: number | null) => void
): UnsubscribeFunc {
  const unsubscribe: UnsubscribeFunc = window.firebase
    .firestore()
    .doc(twitchLiveStatusDocumentPath)
    .onSnapshot(async function(snapshot) {
      const data = snapshot.data()
      if(!data) {
        console.log('No live data')
        callback(null)
        return
      }

      if (data.live === false) {
        callback(null)
        return
      }

      // streamId should really be a number in the database,
      // but not going to fix this now as more stuff relies 
      // this view
      if (typeof data.streamId === 'string') {
        callback(parseInt(data.streamId))
      } else {
        console.error('data was wrong', data)
      }
    })
  return unsubscribe
}