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

export function subscribeToMockSubscriberNotifications(
  streamId: number,
  callback: (notification: SubscriberChatNotificationData) => void
): UnsubscribeFunc {
  setTimeout(function() {
    callback({
      cumulativeMonths: 4,
      displayName: "underscorefunk",
      id: "575b6eaf-a646-4d2e-8c1f-90081687548a",
      ts: 1588776346532,
      userId: "25347823",
      message: "this is a message"
    })
  }, 1000)

  setTimeout(function() {
    callback({
      cumulativeMonths: 4,
      displayName: "Thrennenne",
      id: "bd652a65-8d93-4b29-9b2e-0759e7157d1b",
      ts: 1588776335709,
      userId: "59888285",
      message: null
    })
  }, 3000)

  return () => {
    // im emptty
  }
}
