import admin from "firebase-admin"
import * as functions from "firebase-functions"

import { getTokensWithRefreshToken } from "../twitch"
import getChannelOwnerUserId from "./get-channel-owner-user-id"

export default async function getOwnerAccessToken(): Promise<string> {
  const key = "twitch:" + getChannelOwnerUserId()
  const ownerDocument = await admin
    .firestore()
    .collection("twitch-users")
    .doc(key)
    .get()
  const ownerData = ownerDocument.data()
  if (!ownerData)
    throw new Error("Data was not found in owner document: " + key)
  const refreshToken = ownerData.refreshToken
  const tokens = await getTokensWithRefreshToken(
    functions.config().twitch.client_id,
    functions.config().twitch.client_secret,
    refreshToken
  )
  return tokens.access
}
