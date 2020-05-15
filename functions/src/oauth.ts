import * as functions from "firebase-functions"
import getTwitchCredentials from "./helpers/assorted/get-twitch-credentials"
import cookieParser from "cookie-parser"
import crypto from "crypto"
import * as admin from "firebase-admin"
import simpleOAuth from "simple-oauth2"

import getChannelOwnerUserId from "./helpers/assorted/get-channel-owner-user-id"
import { getUser, getModerators, getEditors } from "./helpers/twitch"
import getOwnerAccessToken from "./helpers/assorted/get-owner-access-token"

const OAUTH_SCOPES =
  "user:edit:broadcast channel_read user_read moderation:read chat:read channel_subscriptions channel_check_subscription channel_editor"

function isLocalDev(req: functions.https.Request) {
  const referrer = req.get("Referrer")
  return (
    process.env.GCLOUD_PROJECT === "fff-twitch-chat-log-dev" &&
    referrer && 
    referrer.includes("http://localhost:3000/authenticate_popup.html")
  )
}

function makeRedirectFor(req: functions.https.Request) {
  const AUTHORITY_DEPLOYED = `https://${process.env.GCLOUD_PROJECT}.web.app`
  const AUTHORITY_LOCAL_DEV = "http://localhost:3000"
  const PATH_POPUP = "/authenticate_popup.html"
  return isLocalDev(req)
    ? AUTHORITY_LOCAL_DEV + PATH_POPUP
    : AUTHORITY_DEPLOYED + PATH_POPUP
}

export const redirect = functions.https.onRequest((req, res) => {
  const oauth2 = twitchOAuth2Client()

  cookieParser()(req, res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString("hex")
    res.cookie("state", state.toString(), {
      maxAge: 3600000,
      secure: true,
      httpOnly: true
    })
    const redirectUri = oauth2.authorizationCode.authorizeURL({
      redirect_uri: makeRedirectFor(req),
      scope: OAUTH_SCOPES,
      state: state
    })
    res.redirect(redirectUri)
  })
})

/**
 * Exchanges a given Twitch auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token, display name, photo URL and Twitch access token are sent back in a JSONP callback
 * function with function name defined by the 'callback' query parameter.
 */
export const token = functions.https.onRequest(async (req, res) => {
  const oauth2 = twitchOAuth2Client()

  try {
    return cookieParser()(req, res, async () => {
      if (!isLocalDev(req)) {
        // cant set cookies on localhost
        if (!req.cookies.state) {
          throw new Error(
            "State cookie not set or expired. Maybe you took too long to authorize. Please try again."
          )
        } else if (req.cookies.state !== req.query.state) {
          throw new Error("State validation failed")
        }
      }

      let results
      try {
        results = await oauth2.authorizationCode.getToken({
          code: req.query.code as string,
          redirect_uri: makeRedirectFor(req)
        })
      } catch (err) {
        console.error("Failed getting auth code", err)
        throw err
      }

      const accessToken = results.access_token
      const twitchUser = await getUser(
        getTwitchCredentials().clientId,
        accessToken
      )
      console.log("twitchUser", twitchUser)

      const isOwner = twitchUser.id === getChannelOwnerUserId()

      let ownerAccessToken
      try {
        ownerAccessToken = await getOwnerAccessToken()
      } catch (e) {
        if (!isOwner) {
          throw new Error(
            "Did not find ownerAccessToken and you are trying to sign in with non-owner"
          )
        } else {
          ownerAccessToken = accessToken
        }
      }

      // No owner access token in the db yet, skip
      // trying to get editor, this is probably the owner signing in

      const isEditor =
        ownerAccessToken &&
        (await (async function getIsEditor() {
          const twitchEditors = await getEditors(
            getTwitchCredentials().clientId,
            ownerAccessToken,
            getChannelOwnerUserId()
          )
          const editorIds = twitchEditors.map(x => x.id)
          return editorIds.includes(twitchUser.id)
        })())

      const isModerator = await (async function getIsModerator() {
        const data = await getModerators(
          getTwitchCredentials().clientId,
          ownerAccessToken,
          getChannelOwnerUserId()
        )
        const moderatorIds = data.map(x => x.id)
        return moderatorIds.includes(twitchUser.id)
      })()

      // Create a Firebase account and get the Custom Auth Token.
      const firebaseToken = await createFirebaseAccount(
        twitchUser.id,
        twitchUser.displayName,
        isOwner,
        isModerator,
        isEditor,
        results.refresh_token
      )
      // Serve an HTML page that signs the user in and updates the user profile.
      return res.jsonp({ token: firebaseToken })
    })
  } catch (error) {
    return res.jsonp({
      error: error.toString()
    })
  }
})

function twitchOAuth2Client() {
  return simpleOAuth.create({
    client: {
      id: getTwitchCredentials().clientId,
      secret: getTwitchCredentials().clientSecret
    },
    auth: {
      tokenHost: "https://id.twitch.tv",
      authorizeHost: "https://id.twitch.tv",
      tokenPath: "/oauth2/token",
      authorizePath: "/oauth2/authorize"
    },
    options: {
      authorizationMethod: "body"
    }
  })
}

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /twitchAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(
  twitchID: number,
  displayName: string,
  isOwner: boolean,
  isModerator: boolean,
  isEditor: boolean,
  refreshToken: string
) {
  const uid = `twitch:${twitchID}`

  const userCreationTask = admin
    .auth()
    .updateUser(uid, {
      displayName
    })
    .catch(error => {
      // If user does not exists we create it.
      if (error.code === "auth/user-not-found") {
        return admin.auth().createUser({
          uid: uid,
          displayName
        })
      }
      throw error
    })

  const databaseTask = admin
    .firestore()
    .collection("twitch-users")
    .doc(uid)
    .set({
      id: uid,
      displayName,
      refreshToken,
      isOwner,
      isModerator,
      isEditor
    })

  // Wait for all async task to complete then generate and return a custom auth token.
  await Promise.all([userCreationTask, databaseTask])
  // Create a Firebase custom auth token.

  const customToken = await admin.auth().createCustomToken(uid)
  console.log('Created Custom token for UID "', uid, '" Token:', customToken)
  return customToken
}
