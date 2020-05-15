type SpotlightTopicData = { label: string }
type TopicUpdateHandler = (topicData: SpotlightTopicData) => void

function isSpotlightTopicData(data: any): data is SpotlightTopicData {
  return typeof data.label === "string"
}

export function subscribeToTopic(callback: TopicUpdateHandler) {
  window.firebase
    .firestore()
    .collection("spotlight")
    .doc("topic")
    .onSnapshot(async function(doc) {
      const data = doc.data()
      if (!isSpotlightTopicData(data)) {
        console.error("topic data did not conform", data)
        return
      }
      callback(data)
    })
}