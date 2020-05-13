//import credentials from "../../firebase-credentials.json"
import * as admin from "firebase-admin"

admin.initializeApp({
  //credential: admin.credential.cert(credentials as any),
  databaseURL: "https://fff-twitch-chat-log.firebaseio.com"
})
;(async function() {
  const db = admin.firestore()
  db.collection("views/tmi-raw/events")
    .where("type", "==", "resub")
    .onSnapshot(snapshot => {
      for (const doc of snapshot.docs) {
        console.log(doc.data())
      }
    })
})()
