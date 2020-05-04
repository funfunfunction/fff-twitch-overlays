import { getStreams } from "../twitch"
import getChannelOwnerUserId from "./get-channel-owner-user-id"
import getTwitchCredentials from "./get-twitch-credentials"
import getOwnerAccessToken from "./get-owner-access-token"

export default async function getCurrentStream() : Promise<{
  id: number
}> {
  const streamsResponse = await getStreams(
    getTwitchCredentials().clientId,
    getOwnerAccessToken(),
    getChannelOwnerUserId()
  )
  if (!streamsResponse.data) return null
  const streams = streamsResponse.data
  if (streams.length === 0) return null
  const stream = streams[0]
  const id = parseInt(stream.id)
  if (isNaN(id))
    throw Error("Could not parse id as a number")
  return { id }
}