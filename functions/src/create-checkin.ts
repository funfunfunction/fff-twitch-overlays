import * as functions from "firebase-functions"
import * as admin from "firebase-admin"
import fetch from "node-fetch"

const db = admin.firestore()

const createCheckin = functions.firestore
  .document("events3/{eventId}")
  .onCreate(async snap => {
    const event = snap.data()
    if (!event) throw new Error("data did not exist on event")
    if (event.type !== "chat") return false

    const parsedMessage = event.message.match(/^!checkin\s*(.+)\s*--\s*(.+)$/)

    if (!parsedMessage) return false

    const location = parsedMessage[1]
    const statusMessage = parsedMessage[2]

    const coordinates = await getLatLonFromLocationString(location)
    if (!coordinates) return

    return await db
      .collection("checkins")
      .add({
        ts: Number(Date.now()),
        displayName: event.userstate["display-name"],
        location,
        coordinates,
        statusMessage,
        subscriber:
          event.userstate["badge-info"] &&
          event.userstate["badge-info"].subscriber
      })
      .catch(function(error) {
        console.error("Error adding document: ", error)
      })
  })

async function getLatLonFromLocationString(locationString) {
  const response = await fetch(
    "https://nominatim.openstreetmap.org/search?format=json&q=" + locationString
  )
  if (!response.ok) return null
  const responseData = await response.json()
  const likelyPlace = responseData[0]
  if (!likelyPlace) return null
  return [likelyPlace.lat, likelyPlace.lon]
}

export default createCheckin
