import React, { useEffect, useState } from "react"
import SubscriberNotification from "./cards/SubscriberNotification"
import { subscribeToSubscriberNotifications } from "./consumers/subcriber-notifications"
import { SubscriberChatNotificationData } from "../../functions/src/views/subscriber-chat-notification/shared"
import { subscribeToCurrentStreamId } from "./consumers/current-stream"
import { SpotlightLabel } from "./cards/SpotlightLabel"

export function CardCarousel() {
  const [
    subscriberNotificationQueue,
    setSubscriberNotificationQueue
  ] = useState<SubscriberChatNotificationData[]>([])
  const [currentStreamId, setCurrentStreamId] = useState<number | null>(null)
  const [time, setTime] = useState(Date.now())
  const [lastDisplay, setLastDisplay] = useState(0)
  const [
    subscriberNotificationIndex,
    setSubscriberNotificationIndex
  ] = useState(-1)

  useEffect(function tick() {
    setInterval(() => {
      setTime(Date.now())
    }, 100)
  }, [])

  useEffect(() => {
    subscribeToCurrentStreamId(setCurrentStreamId)
  }, [])

  useEffect(
    function queueSubscriberNotifications() {
      if (currentStreamId == null) return
      subscribeToSubscriberNotifications(currentStreamId, notification => {
        setSubscriberNotificationQueue(x => x.concat(notification))
      })
    },
    [currentStreamId]
  )

  useEffect(() => {
    const timeSinceLastDisplay = time - lastDisplay
    if (timeSinceLastDisplay > 6000) {
      const nextIndex = subscriberNotificationIndex + 1
      const nextItem = subscriberNotificationQueue[nextIndex]
      if (nextItem) {
        setSubscriberNotificationIndex(nextIndex)
        setLastDisplay(Date.now())
      }
    }
  }, [time, subscriberNotificationIndex, lastDisplay])

  const timeSinceLastDisplay = time - lastDisplay
  const nextIndex = subscriberNotificationIndex + 1
  const nextItem = subscriberNotificationQueue[nextIndex]

  const subNotification =
    subscriberNotificationQueue.length &&
    subscriberNotificationQueue[subscriberNotificationIndex]
  const isLastSubscriberNotificationStale =
    !nextItem && timeSinceLastDisplay > 10000

  return !subNotification || isLastSubscriberNotificationStale ? (
    <SpotlightLabel label="Good morning! Coding, chatting, chilling! Come join us in chat! asdjhasdjkhasd jhdasj asdhdjash asddas jhdaskh askj" />
  ) : (
    <SubscriberNotification
      data={{
        displayName: subNotification.displayName,
        months: subNotification.cumulativeMonths,
        message: subNotification.message || ""
      }}
    ></SubscriberNotification>
  )
}
