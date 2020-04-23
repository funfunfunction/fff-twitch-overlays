const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp(); 
const fetch = require('node-fetch')
const db = admin.firestore();

const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const FFF_USER_ID = 119879569
const TWITCH_CLIENT_ID = functions.config().twitch.client_id
const TWITCH_CLIENT_SECRET = functions.config().twitch.client_secret

const { createMarker, getUser, getEditors, getModerators, getStreams, getTokensWithRefreshToken } = require('./twitch')

const tmi = require("tmi.js")

const chat = new tmi.client()

const {BigQuery} = require('@google-cloud/bigquery');
const bigquery = new BigQuery();

module.exports.chatEventLogger = functions
  .runWith({ 
    memory: '128MB',
    timeoutSeconds: 9 * 60 // max allowed run time for cloud functions is 9 min
  }).pubsub.schedule('every 1 minutes')
  .onRun(async (context) => {

    // Only start logger if we're actually live on Twitch
    const ownerAccessToken = await getOwnerAccessToken()
    if (!(await isStreaming(ownerAccessToken))) {
      console.log('FFF is not live, no need to start up any logger')
      return null
    }

    // As we want reliable logging of chat, we'll use a firestore
    // document for each run of chatEventLogger to track run state
    // by sending pulses every few seconds. If we have not 
    // received live signs from an eventLogger for 25000 seconds,
    // it is assumed to have died and we'll start up some more
    // for redundancy
    const assumedDeadTime = Number(Date.now()) - 25000
    const snapshot = await db
      .collection("event-logger-state")
      .where('pulse', '>', assumedDeadTime)
      .get()

    if (snapshot.size > 1) {
      console.log(
        'Got ' + snapshot.size + 
        ' chatEventLoggers running already, wont start another')
      return null
    } else {
      console.log(
        'Detected ' + snapshot.size + 
        ' chatEventLoggers running, starting one instance now.')
    }

    // Clean up any state of dead chatEventLoggers
    db.collection("event-logger-state")
      .where('pulse', '<', assumedDeadTime)
      .get()
      .then(querySnapshot => querySnapshot.forEach(doc => doc.ref.delete()))

    // Start watching chat
    ;(async function() {
      await chat.connect()
      await chat.join('funfunfunction')
      console.log('chatEventLogger joined channel')
    
      chat.on('chat', (channel, userstate, message) => 
        logEvent('chat', userstate, { message }))
    
      chat.on("subscription", (channel, username, method, message, userstate) => 
        logEvent("subscription", userstate, { method, message }))
    
      chat.on("resub", (channel, username, months, message, userstate, methods) => 
        logEvent("resub", userstate, { months, message, methods }))
      
      chat.on("subgift", (channel, username, streakMonths, recipient, methods, userstate) => 
        logEvent("subgift", userstate, { methods, recipient, streakMonths }))
    
      chat.on("submysterygift", async (channel, username, numbOfSubs, methods, userstate) =>
        logEvent("submysterygift", userstate, { numbOfSubs, methods }))
    
      chat.on("cheer", async (channel, userstate, message) =>
        logEvent("cheer", userstate, { message }))
    
      chat.on("action", async (channel, userstate, message, self) => 
        logEvent("action", userstate, { message }))
    
    })().catch(async (error) => {
      console.error(error)
      process.exit(1)
    })

    // pulse every five seconds
    const intervalId = setInterval(function() {
      db.collection("event-logger-state").doc(context.eventId).set({
        uid: context.eventId,
        pulse: Number(Date.now())
      })
    }, 5000)
    
    // automatically die gracefully after 8 min, cloud functions will time out after 9 otherwise
    return new Promise((resolve => {
      setTimeout(function() {
        console.log('Closing down chatEventLogger (lifespan ended)')
        clearInterval(intervalId)
        resolve()
      }, 8 * 60 * 1000) 
    }))
  })

async function logEvent(type, userstate, otherProps) {
  try {
    // Use Twitch message id as key so that we can do idempotent updates, running multiple cloud functions
    const key = userstate["id"]
    if (!key) {
      throw new Error('No id on userstate')
    }
    await db.collection("events3").doc(key).set({
      type,
      ts: parseInt(userstate["tmi-sent-ts"]),
      userstate,
      ...otherProps
    })
  } catch(e) {
    console.warn(`Failed writing ${type} event to database`, userstate, otherProps)
  }
}
exports.createCheckin = functions.firestore
  .document('events3/{eventId}')
  .onCreate(async (snap) => {

    const event = snap.data();
    if (event.type !== 'chat') return false  

    const parsedMessage = 
      event.message.match(/^!checkin\s*(.+)\s*--\s*(.+)$/)
      
    if (!parsedMessage) return false

    const location = parsedMessage[1]
    const statusMessage = parsedMessage[2]
    
    const coordinates = await getLatLonFromLocationString(location)
    if (!coordinates) return

    return await db.collection("checkins").add({
      ts: Number(Date.now()),
      displayName: event.userstate['display-name'],
      location,
      coordinates,
      statusMessage,
      subscriber: 
        event.userstate['badge-info'] &&
        event.userstate['badge-info'].subscriber
      }).catch(function(error) {
        console.error("Error adding document: ", error);
      });
    
    })
exports.streamIntoBigQuery = functions.firestore
  .document('events3/{eventId}')
  .onCreate(async (snap) => {
    const bqDatasetId = 'collections';
    const bqTableId = 'events3';

    // Save userstate as key-value repeated records.
    const {message, ts, type, userstate} = snap.data();
    let userstates = [];
    for (let key in userstate) {
      let value = userstate[key];
      // Stringify if object
      if ((!!value) && (value.constructor === Object)) {
        value = JSON.stringify(value);
      }
      // Stringify if array
      if (Array.isArray(value)) {
        value = JSON.stringify(value);
      }
      userstates.push({key: key, value: value});
    }
    const rows = [
      {
        message: message,
        ts: parseInt(ts, 10),
        type: type,
        userstate: userstates
      }
    ];
    
    return await bigquery
      .dataset(bqDatasetId)
      .table(bqTableId)
      .insert(rows)
      .catch(function(error) {
        console.error("Error streaming document to BigQuery: ", error);
      });
    })
  
async function getLatLonFromLocationString(locationString) {
  const response = await 
    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + locationString)
  if (!response.ok) return
  const responseData = await response.json()
  const likelyPlace = responseData[0]
  if (!likelyPlace) return null;
  return [ likelyPlace.lat, likelyPlace.lon ]
}

async function getOwnerAccessToken() {
  const ownerDocument = await admin.firestore()
  .collection('twitch-users')
  .doc('twitch:' + FFF_USER_ID)
  .get()
  const ownerData = ownerDocument.data()
  const refreshToken = ownerData.refreshToken
  const tokens = await getTokensWithRefreshToken(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, refreshToken)
  return tokens.access
}

async function isStreaming(ownerAccessToken) {
  const streams = await getStreams(TWITCH_CLIENT_ID, ownerAccessToken, FFF_USER_ID)
  return streams.data.length > 0
}

exports.createMarkerFromSpotlight = 
  functions.firestore
    .document('spotlight/topic')
      .onUpdate(async (change) => {
        const data = change.after.data()

        const ownerAccessToken = await getOwnerAccessToken()
        if (!(await isStreaming(ownerAccessToken))) {
          console.log('Ignoring Spotlight topic update (Fun Fun Function is not live)')
          return null
        }

        const description = data.message || data.label
        await createMarker(TWITCH_CLIENT_ID, ownerAccessToken, FFF_USER_ID, description)
        console.log('Created Twitch marker with description: ' + description)
        return null
      })

const OAUTH_REDIRECT_URI = 
  `https://${process.env.GCLOUD_PROJECT}.web.app/authenticate_popup.html`;
const OAUTH_SCOPES = 'user:edit:broadcast channel_read user_read moderation:read';

/**
 * Creates a configured simple-oauth2 client for Twitch.
 */
function twitchOAuth2Client() {
  // Twitch OAuth 2 setup
  // TODO: Configure the `twitch.client_id` and `twitch.client_secret` Google Cloud environment variables.
  
  return require('simple-oauth2').create({
    client: {
      id: functions.config().twitch.client_id,
      secret: functions.config().twitch.client_secret,
    },
    auth: {
      tokenHost: 'https://id.twitch.tv',
      authorizeHost: 'https://id.twitch.tv',
      tokenPath: '/oauth2/token',
      authorizePath: '/oauth2/authorize',
    },
    options: {
      authorizationMethod: 'body',
    },
  });
}

/**
 * Redirects the User to the Twitch authentication consent screen. Also the 'state' cookie is set for later state
 * verification.
 */
exports.redirect = functions.https.onRequest((req, res) => {
  const oauth2 = twitchOAuth2Client();

  cookieParser()(req, res, () => {
    const state = req.cookies.state || crypto.randomBytes(20).toString('hex');
    console.log('Setting verification state:', state);
    res.cookie('state', state.toString(), {
      maxAge: 3600000,
      secure: true,
      httpOnly: true,
    });
    const redirectUri = oauth2.authorizationCode.authorizeURL({
      redirect_uri: OAUTH_REDIRECT_URI,
      scope: OAUTH_SCOPES,
      state: state,
    });
    console.log('Redirecting to:', redirectUri);
    res.redirect(redirectUri);
  });
});

/**
 * Exchanges a given Twitch auth code passed in the 'code' URL query parameter for a Firebase auth token.
 * The request also needs to specify a 'state' query parameter which will be checked against the 'state' cookie.
 * The Firebase custom auth token, display name, photo URL and Twitch access token are sent back in a JSONP callback
 * function with function name defined by the 'callback' query parameter.
 */
exports.token = functions.https.onRequest(async (req, res) => {
  const oauth2 = twitchOAuth2Client();

  try {
    return cookieParser()(req, res, async () => {
      
      if (!req.cookies.state) {
        throw new Error('State cookie not set or expired. Maybe you took too long to authorize. Please try again.');
      } else if (req.cookies.state !== req.query.state) {
        throw new Error('State validation failed');
      }

      const results = await oauth2.authorizationCode.getToken({
        code: req.query.code,
        redirect_uri: OAUTH_REDIRECT_URI,
      });

      const accessToken = results.access_token;
      const twitchUser = await getUser(
        functions.config().twitch.client_id, 
        accessToken)

      const isOwner = twitchUser.id === FFF_USER_ID

      
      const isEditor = await (async function getIsEditor() {
        const twitchEditors = await getEditors(
          TWITCH_CLIENT_ID, 
          accessToken,
          FFF_USER_ID
        )
        const editorIds = twitchEditors.map(x => x.id)
        return editorIds.includes(twitchUser.id)
      })()

      const isModerator = await (async function getIsModerator() {
        const data = await getModerators(
          TWITCH_CLIENT_ID,
          accessToken,
          FFF_USER_ID
        )
        const moderatorIds = data.map(x => x.user_id)
        return moderatorIds.includes(twitchUser.id)
      })()
      
      // Create a Firebase account and get the Custom Auth Token.
      const firebaseToken = await 
        createFirebaseAccount(
          twitchUser.id, 
          twitchUser.displayName, 
          isOwner,
          isModerator, 
          isEditor, 
          results.refresh_token);
      // Serve an HTML page that signs the user in and updates the user profile.
      return res.jsonp({ token: firebaseToken});

    });
  } catch(error) {
    return res.jsonp({
      error: error.toString(),
    });
  }
});

/**
 * Creates a Firebase account with the given user profile and returns a custom auth token allowing
 * signing-in this account.
 * Also saves the accessToken to the datastore at /twitchAccessToken/$uid
 *
 * @returns {Promise<string>} The Firebase custom auth token in a promise.
 */
async function createFirebaseAccount(twitchID, displayName, isOwner, isModerator, isEditor, refreshToken) {

  const uid = `twitch:${twitchID}`;

  const userCreationTask = admin.auth().updateUser(uid,{
    displayName
  }).catch((error) => {
    // If user does not exists we create it.
    if (error.code === 'auth/user-not-found') {
      return admin.auth().createUser({
        uid: uid, 
        displayName
      })
    }
    throw error;
  });

  const databaseTask = admin.firestore()
    .collection('twitch-users')
    .doc(uid).set({
      id: uid,
      displayName,
      refreshToken,
      isOwner,
      isModerator,
      isEditor
    });

  // Wait for all async task to complete then generate and return a custom auth token.
  await Promise.all([userCreationTask, databaseTask]);
  // Create a Firebase custom auth token.
  const token = await admin.auth().createCustomToken(uid);
  console.log('Created Custom token for UID "', uid, '" Token:', token);
  return token;
}
