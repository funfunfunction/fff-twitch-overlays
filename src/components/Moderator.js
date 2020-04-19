import React, { useState, useEffect } from 'react';

function Moderator() {
  const db = window.firebase.firestore()
  const [ messages, setMessages ] = useState([])
  const [ topic, setTopic ] = useState({})
  const [ topicInputValue, setTopicInputValue ] = useState('')

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
      .limit(50)
      .onSnapshot(function(querySnapshot) {
        const newMessages = []
        querySnapshot.docs.forEach(doc => newMessages.push(doc.data()))
        setMessages(newMessages.map(message => ({
          ts: message.ts,
          message: message.message,
          displayName: message.userstate['display-name']
        })))
      })

  }, [db])

  return (<div className="scene-moderator">
    <input type="text" value={topicInputValue} onChange={(evt) => {
      setTopicInputValue(evt.target.value)
    }}></input>
    <input type="button" value="Update" onClick={() => {
      db.collection('spotlight')
      .doc('topic')
      .set({
        label: topicInputValue
      })
    }}></input>
    <div className="messages">
    {messages.map(message => <div 
      key={message.ts} 
      className={message.ts === topic.ts ? 'message active' : 'message'} 
      onClick={() => {
        console.log(message)
        db.collection('spotlight')
          .doc('topic')
          .set(message)
      }}>
      <strong>{message.displayName}</strong>: {message.message}
    </div>)}  
    </div>  
  </div>)
}

export default Moderator