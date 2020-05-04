export const streamDocPath = (streamId: number) =>
  `views/tmi-subscribers/streams/${streamId}`
export const notificationsCollectionPath = (streamId: number) =>
  `${streamDocPath(streamId)}/notifications`

export interface TMISubscriberNotificaton {
  id: string
  ts: number
  userId: string
  displayName: string
  cumulativeMonths: number
  message?: string
}

export function isTMISubscriberNotification(
  x: any
): x is TMISubscriberNotificaton {
  return (
    x &&
    typeof x.id &&
    typeof x.ts === "number" &&
    typeof x.userId === "string" &&
    typeof x.displayName === "string" &&
    typeof x.cumulativeMonths === "number"
  )
}
