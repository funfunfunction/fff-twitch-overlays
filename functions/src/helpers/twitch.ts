const fetch = require("node-fetch")
const queryString = require("query-string")

export async function createMarker(clientId, accessToken, userId, description) {
  const response = await helixPost(
    clientId,
    accessToken,
    "createMarker",
    "/streams/markers",
    {
      user_id: userId,
      description
    }
  )
  return response
}

export function getStreams(clientId, accessToken, userId) {
  return helixGet(
    clientId,
    accessToken,
    "getStreams",
    "/streams?user_id=" + userId
  )
}

function helixPost(clientId, accessToken, functionLabel, endpoint, params) {
  return fetch(
    "https://api.twitch.tv/helix" +
      endpoint +
      "?" +
      queryString.stringify(params),
    {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/vnd.twitchtv.v5+json",
        "Client-ID": clientId,
        Authorization: "Bearer " + accessToken
      }
    }
  )
    .then(createAssertResponseOK(functionLabel))
    .then(parseResponseJSON)
}

function helixGet(clientId, accessToken, functionLabel, endpoint) {
  return fetch("https://api.twitch.tv/helix" + endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
      "Client-ID": clientId,
      Authorization: "Bearer " + accessToken
    }
  })
    .then(createAssertResponseOK(functionLabel))
    .then(parseResponseJSON)
}

export function getTokensWithRefreshToken(
  clientId,
  clientSecret,
  refreshToken
) {
  return fetch(
    "https://id.twitch.tv/oauth2/token?" +
      queryString.stringify({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken
      }),
    { method: "POST" }
  )
    .then(createAssertResponseOK("getTokensWithRefreshToken"))
    .then(parseResponseJSON)
    .then(tokenSetFromResponseBody)
}

export async function getEditors(clientId, accessToken, channelId) {
  // TODO: pagination!!
  const data = await krakenGet(
    clientId,
    accessToken,
    "getEditors",
    "/channels/" + channelId + "/editors"
  )
  const editors = data.users || []
  return editors.map(user => ({
    id: parseInt(user._id),
    displayName: user.display_name
  }))
}

export async function getUser(clientId, accessToken) {
  const data = await krakenGet(clientId, accessToken, "getUser", "/user")
  return {
    id: parseInt(data._id),
    displayName: data.display_name
  }
}

export async function getModerators(clientId, accessToken, broadcasterId) {
  // TODO: pagination!!
  const data = await helixGet(
    clientId,
    accessToken,
    "getModerators",
    "/moderation/moderators?broadcaster_id=" + broadcasterId
  )

  const moderators = data.data || []
  return moderators.map(mod => ({
    id: parseInt(mod.user_id),
    displayName: mod.user_name
  }))
}

// Not used generally, since we hardcode the FFF user id becuase it doesn't change
// but let this be for future reference
export async function getUserId (
  clientId,
  accessToken
) {
  const responseData = await krakenGet(clientId, accessToken, 'getUserId', '/channel', )
  return responseData._id
}

function krakenGet(clientId, accessToken, functionLabel, endpoint) {
  return fetch("https://api.twitch.tv/kraken" + endpoint, {
    credentials: "include",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
      "Client-ID": clientId,
      Authorization: "OAuth " + accessToken
    }
  })
    .then(createAssertResponseOK(functionLabel))
    .then(parseResponseJSON)
}

function tokenSetFromResponseBody(body) {
  if (
    !body.access_token ||
    !body.refresh_token ||
    !Number.isInteger(body.expires_in)
  ) {
    throw new Error("Response body cannot be parsed as token set")
  }
  return {
    expiresIn: body.expires_in,
    access: body.access_token as string,
    refresh: body.refresh_token as string
  }
}

function createAssertResponseOK(label) {
  return function assertResponseOK(response) {
    if (response.status !== 200) {
      return response.text().then(responseText => {
        throw new Error(
          label +
            ": Expected response status to have been 200 but was " +
            response.status +
            ": " +
            responseText
        )
      })
    }
    return response
  }
}

function parseResponseJSON(response) {
  return response.json()
}
