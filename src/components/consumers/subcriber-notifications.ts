import {
  SubscriberChatNotificationData,
  isTMISubscriberNotification,
  notificationsCollectionPath
} from "@functions/src/views/subscriber-chat-notification/shared"

type UnsubscribeFunc = () => void

export function subscribeToSubscriberNotifications(
  streamId: number,
  callback: (notification: SubscriberChatNotificationData) => void
): UnsubscribeFunc {
  console.log("path", notificationsCollectionPath(streamId))
  const unsubscribe: UnsubscribeFunc = window.firebase
    .firestore()
    .collection(notificationsCollectionPath(streamId))
    .orderBy("ts")
    .onSnapshot(async function(querySnapshot) {
      for (const change of querySnapshot.docChanges()) {
        if (change.type !== "added") {
          console.error(
            'Got unexpected change type, I only support "added":',
            change,
            change.doc.data()
          )
          return
        }
        const data = change.doc.data()
        if (!isTMISubscriberNotification(data))
          throw Error("Data was not in expected format:" + JSON.stringify(data))
        callback(data)
      }
    })
  return unsubscribe
}