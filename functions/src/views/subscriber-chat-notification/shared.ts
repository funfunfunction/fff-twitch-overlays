// Types, helpers and constants that is shared with
// consumers of the view. Is free from firebase references so
// that it can be easily used by the web client

export const streamDocPath = (streamId: number) =>
  `views/subscriber-chat-notification/streams/${streamId}`
export const notificationsCollectionPath = (streamId: number) =>
  `${streamDocPath(streamId)}/notifications`

export interface SubscriberChatNotificationData {
  id: string
  ts: number
  userId: string
  displayName: string
  cumulativeMonths: number
  message: string | null
}

export function isTMISubscriberNotification(
  x: any
): x is SubscriberChatNotificationData {
  return (
    x &&
    typeof x.id &&
    typeof x.ts === "number" &&
    typeof x.userId === "string" &&
    typeof x.displayName === "string" &&
    typeof x.cumulativeMonths === "number" &&
    (x.message === null || typeof x.message === "string")
  )
}
