import React, { useState, useEffect } from "react"

function Moderator() {
  const db = window.firebase.firestore()
  const auth = window.firebase.auth()
  const [topicInputValue, setTopicInputValue] = useState("")
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null)
  const [lastLabelUpdate, setLastLabelUpdate] = useState<number>(0)
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    setInterval(() => {
      setTime(Number(Date.now()))
    }, 500)
  }, [])
  
  const wasLabelUpdateRecent = 
    lastLabelUpdate > 0 && 
    ((lastLabelUpdate + 3000) > time) 
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
    authenticatedUser && (
      authenticatedUser.isEditor || 
      authenticatedUser.isModerator ||
      authenticatedUser.isOwner)

  async function saveLabel(){
    setLastLabelUpdate(Number(Date.now()))
    db.collection("spotlight")
      .doc("topic")
      .set(
        {
          label: topicInputValue
        },
        { merge: true }
      )
    
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
              onClick={(e) => {
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
              You lack editor or moderator permissions for the Fun Fun Function channel on
              Twitch, which are required for this view. Ask MPJ to give you if
              you think this is in error.
            </div>
          )}
        </div>
      )}
      {isAllowed && (
        <div className="gui">
          <div className="topic-label">
            <label htmlFor="topic-label">Topic label</label>
            <input
              name="topic-label"
              type="text"
              value={topicInputValue}
              onKeyUp={(evt) => {
                const isEnter = evt.keyCode === 13
                if(isEnter) saveLabel()
              }}
              onChange={evt => {
                setTopicInputValue(evt.target.value)
              }}
            ></input>
            <input
              type="button"
              value={wasLabelUpdateRecent ? 'UPDATED!' : 'Update'}
              onClick={saveLabel}
            ></input>
          </div>
        </div>
      )}
    </div>
  )
}

export default Moderator
