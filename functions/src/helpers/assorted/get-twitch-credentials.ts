import * as functions from "firebase-functions"
import assert from "assert"

export default function getTwitchCredentials() {
  const clientId: string = functions.config().twitch.client_id
  const clientSecret: string = functions.config().twitch.client_secret
  assert(typeof clientId === 'string')
  assert(typeof clientSecret === 'string')
  return {
    clientId,
    clientSecret
  }
}
