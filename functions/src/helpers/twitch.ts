const fetch = require("node-fetch")
const queryString = require("query-string")

export async function createMarker(
  clientId: string,
  accessToken: string,
  userId: any,
  description: string
) {
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

export function getStreams(
  clientId: string,
  accessToken: string,
  userId: any
): Promise<{
  data: { id: string }[]
}> {
  return helixGet(
    clientId,
    accessToken,
    "getStreams",
    "/streams?user_id=" + userId
  )
}

function helixPost(
  clientId: string,
  accessToken: string,
  functionLabel: string,
  endpoint: string,
  params: any
) {
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
    .then(
      createAssertResponseOK(functionLabel, {
        clientId,
        accessToken,
        endpoint,
        params
      })
    )
    .then(parseResponseJSON)
}

function helixGet(
  clientId: string,
  accessToken: string,
  functionLabel: string,
  endpoint: string
) {
  return fetch("https://api.twitch.tv/helix" + endpoint, {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
      "Client-ID": clientId,
      Authorization: "Bearer " + accessToken
    }
  })
    .then(
      createAssertResponseOK(functionLabel, { clientId, accessToken, endpoint })
    )
    .then(parseResponseJSON)
}

export function getTokensWithRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
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

export async function getEditors(
  clientId: string,
  accessToken: string,
  channelId: number
): Promise<SimpleUser[]> {
  // TODO: pagination!!
  const data = await krakenGet(
    clientId,
    accessToken,
    "getEditors",
    "/channels/" + channelId + "/editors"
  )
  const editors = data.users || []

  return editors.map(function parseSimpleUser(data: any): SimpleUser {
    if (!isEditorUserData(data)) {
      throw new Error("Failed isEditorUserData:" + JSON.stringify(data))
    }
    return {
      id: data.user_id,
      displayName: data.display_name
    }
  })
  function isEditorUserData(
    data: any
  ): data is { user_id: number; display_name: string } {
    return Number.isInteger(data._id) && typeof data.display_name === "string"
  }
}

export async function getUser(clientId: string, accessToken: string) {
  const data = await krakenGet(clientId, accessToken, "getUser", "/user")
  return {
    id: parseInt(data._id),
    displayName: data.display_name
  }
}

type SimpleUser = {
  id: number
  displayName: string
}

export async function getModerators(
  clientId: string,
  accessToken: string,
  broadcasterId: any
): Promise<SimpleUser[]> {
  // TODO: pagination!!

  function getPage(after: string | null) {
    return helixGet(
      clientId,
      accessToken,
      "getModerators",
      "/moderation/moderators?broadcaster_id=" +
        broadcasterId +
        (after ? "&after=" + after : "")
    )
  }

  let items: any = []
  let cursor = null
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const page: any = await getPage(cursor)
    cursor = null
    if (!page.data) break
    items = items.concat(page.data)
    cursor = page.pagination && page.pagination.cursor
    if (cursor) continue
    break
  }

  return items.map(function parseSimpleUser(data: any): SimpleUser {
    if (!isModeratorUserData(data)) {
      throw new Error("isModeratorUserData failed:" + JSON.stringify(data))
    }
    const moderators = {
      id: parseInt(data.user_id),
      displayName: data.user_name
    }
    console.log("getModerators returning", moderators)
    return moderators
  })

  function isModeratorUserData(
    data: any
  ): data is { user_id: string; user_name: string } {
    return (
      typeof data.user_id === "string" && typeof data.user_name === "string"
    )
  }
}

// Not used generally, since we hardcode the FFF user id becuase it doesn't change
// but let this be for future reference
export async function getUserId(clientId: string, accessToken: string) {
  const responseData = await krakenGet(
    clientId,
    accessToken,
    "getUserId",
    "/channel"
  )
  return responseData._id
}

function krakenGet(
  clientId: string,
  accessToken: string,
  functionLabel: string,
  endpoint: string
) {
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

function tokenSetFromResponseBody(body: any) {
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

function createAssertResponseOK(label: string, errorData?: any) {
  return function assertResponseOK(response: any) {
    if (response.status !== 200) {
      return response.text().then((responseText: string) => {
        throw new Error(
          label +
            ": Expected response status to have been 200 but was " +
            response.status +
            ": " +
            responseText +
            "errorData: " +
            JSON.stringify(errorData)
        )
      })
    }
    return response
  }
}

function parseResponseJSON(response: any) {
  return response.json()
}
