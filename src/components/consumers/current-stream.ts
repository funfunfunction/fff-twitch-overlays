import {
  twitchLiveStatusDocumentPath
} from "@functions/src/views/twitch-live-status/shared"

type UnsubscribeFunc = () => void

export function subscribeToCurrentStreamId(
  callback: (streamId: number) => void
): UnsubscribeFunc {
  const unsubscribe: UnsubscribeFunc = window.firebase
    .firestore()
    .doc(twitchLiveStatusDocumentPath)
    .onSnapshot(async function(snapshot) {
      const data = snapshot.data()
      if(!data) {
        console.log('No live data')
        return
      }
      if (typeof data.id === 'number') callback(data.id)
    })
  return unsubscribe
}