import React, { useState, useEffect } from 'react';

function Moderator() {
  const db = window.firebase.firestore()
  const auth = window.firebase.auth()
  const [ messages, setMessages ] = useState([])
  const [ topic, setTopic ] = useState({})
  const [ topicInputValue, setTopicInputValue ] = useState('')
  const [ authenticatedUser, setAuthenticatedUser ] = useState(null)
  
  useEffect(() => {
    db
      .collection("spotlight")
      .doc("topic")
      .onSnapshot(function(doc) {
        if (doc.data()) {
          setTopic(doc.data())
          if (doc.data().label) {
            setTopicInputValue(doc.data().label)
          } else {
            setTopicInputValue('')
          }
        }
      })

    db
      .collection("events3")
      .where('type', '==', 'chat')
      .orderBy("ts", "desc")
      .limit(100)
      .onSnapshot(function(querySnapshot) {
        const newMessages = []
        querySnapshot.docs.forEach(doc => newMessages.push(doc.data()))
        setMessages(newMessages.map(message => ({
          ts: message.ts,
          message: message.message,
          displayName: message.userstate['display-name']
        })))
      })

      auth.onAuthStateChanged(async function(user) {
        if (!user) return
        const doc = await db.collection('twitch-users').doc(user.uid).get()
        setAuthenticatedUser({
          id: user.uid, // TODO can be removed later, added in firebasecreteuser
          ...doc.data()
        }) 
    });

  }, [db, auth])

  const isEditorOrAdmin = 
    authenticatedUser && (
      authenticatedUser.isEditor || 
      authenticatedUser.isOwner
    )

  return (<div className="scene-moderator">
    {!authenticatedUser && <div>
      You need to <a href="authenticate_popup.html" onClick={(e) => {
        window.open('authenticate_popup.html', 'name', 'height=585,width=400')
        e.preventDefault()
      }}>Log in</a> with Twitch in order to see this view.
    </div>}
    {authenticatedUser && <div>
        <div>Logged in as {authenticatedUser.displayName} 
          <a href="http://validdomainthatreactdoesnotcompainabout.com" onClick={(e) => { auth.signOut() }}>Sign out</a></div>
        {!isEditorOrAdmin && <div>You lack editor permissions for the Fun Fun Function channel on Twitch, 
          which are required for this view. Ask MPJ to give you if you think this is in error.</div>}
    </div>}
    {isEditorOrAdmin && <div className="gui">
      <div className="topic-label">
        <label for='topic-label'>Topic label</label>
        <input name="topic-label" type="text" value={topicInputValue} onChange={(evt) => {
          setTopicInputValue(evt.target.value)
        }}></input>
        <input type="button" value="Update" onClick={() => {
          db.collection('spotlight')
          .doc('topic')
          .update({
            label: topicInputValue
          })
        }}></input>
      </div>
      <div className="messages">
        {messages.map(message => <div 
          key={message.ts} 
          className={message.ts === (topic.message && topic.message.ts) ? 'message active' : 'message'} 
          onClick={() => {
            db.collection('spotlight')
              .doc('topic')
              .update({ message })
          }}>
          <strong>{message.displayName}</strong>: {message.message}
        </div>)}  
      </div>  
    </div>}
  </div>)
}

export default Moderator