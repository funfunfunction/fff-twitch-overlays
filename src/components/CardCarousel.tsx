import React, { useEffect, useState } from "react"
import SubscriberNotification from "./cards/SubscriberNotification"
import { subscribeToSubscriberNotifications } from "./consumers/subcriber-notifications"
import { SubscriberChatNotificationData } from "../../functions/src/views/subscriber-chat-notification/shared";

export function CardCarousel() {
  const [subscriberNotificationQueue, setSubscriberNotificationQueue] = useState<SubscriberChatNotificationData[]>([]);
  

  useEffect(function queueSubscriberNotifications() {
    subscribeToSubscriberNotifications(1234, (notification) => {
      setSubscriberNotificationQueue(x => x.concat(notification))
    })
  }, [])

  return <SubscriberNotification
    style={{ display: "none" }}
    data={{
      displayName: "underscorefunk",
      months: 8,
      message: "omgsjdkh kjdj hjhd jasdhdjk hdajk ajks"
    }}
  ></SubscriberNotification>
}
