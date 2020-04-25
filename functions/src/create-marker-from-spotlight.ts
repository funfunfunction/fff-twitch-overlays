import * as functions from 'firebase-functions'
import getChannelOwnerUserId from '../helpers/assorted/get-channel-owner-user-id'
import getOwnerAccessToken from '../helpers/assorted/get-owner-access-token'
import { getStreams, createMarker } from '../helpers/twitch'
import getTwitchCredentials from "../helpers/assorted/get-twitch-credentials"

const createMarkerFromSpotlight = 
  functions.firestore.document('spotlight/topic').onUpdate(async (change) => {
    const data = change.after.data()
    const credentials = getTwitchCredentials()
    
    const ownerAccessToken = await getOwnerAccessToken()
    const streams = await getStreams(credentials.clientId, ownerAccessToken, getChannelOwnerUserId())
    const isStreaming = streams.data.length > 0
    if (!isStreaming) {
      console.log('Ignoring Spotlight topic update (Fun Fun Function is not live)')
      return null
    }

    const description = data.message || data.label
    await createMarker(credentials.clientId, ownerAccessToken, getChannelOwnerUserId(), description)
    console.log('Created Twitch marker with description: ' + description)
    return null
  })


export default createMarkerFromSpotlight