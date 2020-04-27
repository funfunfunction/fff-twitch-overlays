import * as functions from "firebase-functions"
export default function getChannelOwnerUserId(): number {
  if (!functions.config().twitch.owner_id) {
    throw new Error("twitch.owner_id not configured")
  }
  return parseInt(functions.config().twitch.owner_id)
}
