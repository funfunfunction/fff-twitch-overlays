import React, { useState, useEffect } from "react"

function Moderator() {
  const db = window.firebase.firestore()
  const auth = window.firebase.auth()
  const [topicInputValue, setTopicInputValue] = useState("")
  const [guestNameInputValue, setGuestNameInputValue] = useState("")
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null)
  const [lastLabelUpdate, setLastLabelUpdate] = useState<number>(0)
  const [lastGuestNameUpdate, setLastGuestNameUpdate] = useState<number>(0)
  const [time, setTime] = useState<number>(0)

  useEffect(() => {
    setInterval(() => {
      setTime(Number(Date.now()))
    }, 500)
  }, [])

  const wasLabelUpdateRecent =
    lastLabelUpdate > 0 && lastLabelUpdate + 3000 > time
  const wasGuestNameUpdateRecent =
    lastGuestNameUpdate > 0 && lastGuestNameUpdate + 3000 > time

  useEffect(() => {
    db.collection("spotlight")
      .doc("topic")
      .onSnapshot(function(doc) {
        const topic: any = doc.data()
        if (topic && topic.label) {
          setTopicInputValue(topic.label)
        } else {
          setTopicInputValue("")
        }
      })

    subscribeToGuestConfiguration(guest => {
      setGuestNameInputValue(guest.name || '')
    })
  
    auth.onAuthStateChanged(async function(user) {
      if (!user) return
      const doc = await db
        .collection("twitch-users")
        .doc(user.uid)
        .get()
      setAuthenticatedUser({
        id: user.uid, // TODO can be removed later, added in firebasecreteuser
        ...doc.data()
      })
    })
  }, [db, auth])

  const isAllowed =
    authenticatedUser &&
    (authenticatedUser.isEditor ||
      authenticatedUser.isModerator ||
      authenticatedUser.isOwner)

  async function saveLabel() {
    setLastLabelUpdate(Date.now())
    db.collection("spotlight")
      .doc("topic")
      .set(
        {
          label: topicInputValue
        },
        { merge: true }
      )
  }

  async function saveGuestName() {
    setLastGuestNameUpdate(Date.now())
    const guest: GuestConfiguration = {
      name: (guestNameInputValue && guestNameInputValue.length > 0)
        ? guestNameInputValue
        : null
    } 
    db.collection("spotlight")
      .doc("guest")
      .set(guest, { merge: true })
  }


  return (
    <div className="scene-moderator">
      {!authenticatedUser && (
        <div>
          You need to{" "}
          <a
            href="authenticate_popup.html"
            onClick={e => {
              window.open(
                "authenticate_popup.html",
                "name",
                "height=585,width=400"
              )
              e.preventDefault()
            }}
          >
            Log in
          </a>{" "}
          with Twitch in order to see this view.
        </div>
      )}
      {authenticatedUser && (
        <div>
          <div>
            Logged in as {authenticatedUser.displayName}
            <a
              href="http://validdomainthatreactdoesnotcompainabout.com"
              onClick={e => {
                auth.signOut()
                e.preventDefault()
                window.location.reload()
              }}
            >
              Sign out
            </a>
          </div>
          {!isAllowed && (
            <div>
              You lack editor or moderator permissions for the Fun Fun Function
              channel on Twitch, which are required for this view. Ask MPJ to
              give you if you think this is in error.
            </div>
          )}
        </div>
      )}
      {isAllowed && (
        <div className="gui">
          
          <div className="topic-label field-container">
            <label htmlFor="topic-label">Topic label</label>
            <input
              name="topic-label"
              type="text"
              value={topicInputValue}
              onKeyUp={evt => {
                const isEnter = evt.keyCode === 13
                if (isEnter) saveLabel()
              }}
              onChange={evt => {
                setTopicInputValue(evt.target.value)
              }}
            ></input>
            <input
              type="button"
              value={wasLabelUpdateRecent ? "UPDATED!" : "Update"}
              onClick={saveLabel}
            ></input>
          </div>

          <div className="guest field-container">
            <label htmlFor="guest-name">Guest name</label>
            <input 
              name="guest-name"
              type="text"
              value={guestNameInputValue}
              onKeyUp={evt => {
                const isEnter = evt.keyCode === 13
                if (isEnter) saveGuestName()
              }}
              onChange={evt => {
                setGuestNameInputValue(evt.target.value)
              }}
            ></input>
            <input
              type="button"
              value={wasGuestNameUpdateRecent ? "UPDATED!" : "Update"}
              onClick={saveGuestName}
            ></input>
          </div>
        </div>
      )}
    </div>
  )
}

export interface GuestConfiguration {
  name: string | null
}

function isGuestConfiguration(obj: any): obj is GuestConfiguration {
  return obj && (
    typeof obj.name === 'string' 
    ||
    obj.name === null
  )
}

export function subscribeToGuestConfiguration(callback: (guest: GuestConfiguration) => void) {
  window
    .firebase
    .firestore()
    .collection("spotlight")
    .doc("guest")
    .onSnapshot(function(doc) {
      if (!doc.exists) {
        console.error('guest config does not exist yet')
        return
      }
      const guest: any = doc.data()
      if (!isGuestConfiguration(guest)) {
        console.error('Expected doc data to be guest configuration:', guest)
        return
      }
      callback(guest)
    })
}

export default Moderator
