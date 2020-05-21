import React, { useEffect, useState } from "react"
import SubscriberNotification from "./cards/SubscriberNotification"
import { subscribeToSubscriberNotifications, subscribeToMockSubscriberNotifications } from "./consumers/subcriber-notifications"
import { SubscriberChatNotificationData } from "../../functions/src/views/subscriber-chat-notification/shared"
import { subscribeToCurrentStreamId } from "./consumers/current-stream"
import { SpotlightLabel } from "./cards/SpotlightLabel"
import { subscribeToTopic } from "./consumers/topic"

export function CardCarousel({ displayTopic = true, scale = 1 }) {
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

  const [topicLabel, setTopicLabel] = useState<string | null>(null)

  useEffect(function startSubscribingToTopicLabel() {
    subscribeToTopic(topic => {
      setTopicLabel(topic.label)
    })
  }, [])

  useEffect(function tick() {
    setInterval(() => {
      setTime(Date.now())
    }, 100)
  }, [])

  useEffect(() => {
    setCurrentStreamId(123)
    //subscribeToCurrentStreamId(setCurrentStreamId)
  }, [])

  useEffect(
    function queueSubscriberNotifications() {
      if (currentStreamId == null) return
      subscribeToMockSubscriberNotifications(currentStreamId, notification => {
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
    subscriberNotificationQueue.length === 0
      ? null
      : subscriberNotificationQueue[subscriberNotificationIndex]
  const isLastSubscriberNotificationStale =
    !nextItem && timeSinceLastDisplay > 10000

  return displayTopic &&
    (!subNotification || isLastSubscriberNotificationStale) ? (
    topicLabel ? (
      <SpotlightLabel label={topicLabel} />
    ) : (
      <div>Nothing to display</div>
    )
  ) : !subNotification ? (
    <div></div>
  ) : (
    <SubscriberNotification
      scale={scale}
      data={{
        displayName: subNotification.displayName,
        months: subNotification.cumulativeMonths,
        message: subNotification.message || ""
      }}
    ></SubscriberNotification>
  )
}
