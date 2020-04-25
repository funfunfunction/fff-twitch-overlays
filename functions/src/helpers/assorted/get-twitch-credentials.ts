import * as functions from "firebase-functions"
import isString from "is-string"
import assert from "assert"

export default function getTwitchCredentials() {
  const clientId: string = functions.config().twitch.client_id
  const clientSecret: string = functions.config().twitch.client_secret
  assert(isString(clientId))
  assert(isString(clientSecret))
  return {
    clientId,
    clientSecret
  }
}
