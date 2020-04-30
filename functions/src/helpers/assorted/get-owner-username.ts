import * as functions from "firebase-functions"
import isString from "is-string"

export default function getOwnerUsername() {
  if (!isString(functions.config().twitch.owner_username)) {
    throw new Error("twitch.owner_username not configured")
  }
  return functions.config().twitch.owner_username as string
}
