const admin = require('firebase-admin')
const functions = require('firebase-functions')

const { getTokensWithRefreshToken } = require('./twitch')

function getChannelOwnerUserId() {
  return 119879569 // user id for funfunfunction twitch user
} 

async function getOwnerAccessToken() {
  const ownerDocument = await admin.firestore()
  .collection('twitch-users')
  .doc('twitch:' + getChannelOwnerUserId())
  .get()
  const ownerData = ownerDocument.data()
  const refreshToken = ownerData.refreshToken
  const tokens = await getTokensWithRefreshToken(
    functions.config().twitch.client_id, 
    functions.config().twitch.client_secret, 
    refreshToken)
  return tokens.access
}

module.exports.getOwnerAccessToken = getOwnerAccessToken
module.exports.getChannelOwnerUserId = getChannelOwnerUserId