import * as functions from "firebase-functions"

export default function getOwnerUsername() {
  const ownerUsername = functions.config().twitch.owner_username
  if (typeof ownerUsername !== 'string') {
    throw new Error("twitch.owner_username not configured")
  }
  return ownerUsername
}
