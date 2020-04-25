const functions = require('firebase-functions')
const firebaseAdmin = require('firebase-admin')
const { FieldValue } = require('@google-cloud/firestore')

const { getOwnerAccessToken } = require('../helpers/assorted')
const { getStreams } = require('../helpers/twitch')

module.exports = functions.firestore
  .document('events3/{eventId}')
  .onCreate(async (snap) => {

    const event = snap.data();
    if (event.type !== 'chat') return false  

    const accessToken = await getOwnerAccessToken()
    const streamsResponse = await getStreams(functions.config().twitch.client_id, accessToken)
    const streams = streamsResponse.data
    if (streams.length === 0) {
      // not live, we don't care a about this chat message
      return
    }
    const currentStream = streams[0]
    const streamId = currentStream.id
    const userId = event.userstate['user-id']

    const viewRef = firebaseAdmin.firestore().collection('views').doc('unique-chatters')
    viewRef.collection('properties').doc('current-stream-id').set({
      value: streamId
    })

    const streamRef = viewRef.collection('streams').doc(streamId)
    
    const userRef = streamRef.collection('chatters').doc(userId)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      userRef.set({
        appeared: Number(Date.now())
      })
      streamRef.collection('properties').doc('num-chatters').set({
        value: FieldValue.increment(1)
      }, { merge: true })
    }

  }) 