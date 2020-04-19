import React, { useState, useEffect } from 'react';

function Spotlight() {
  const db = window.firebase.firestore()

  const [ topic, setTopic ] = useState()

  useEffect(() => {
    db
      .collection("spotlight")
      .doc("topic")
      .onSnapshot(function(doc) {
        setTopic(doc.data())
      })

  }, [db])

  let box
  if(topic && topic.displayName) {
    box = <div className="box">
      <div className="display-name">{topic.displayName} says:</div>
      <div className="message-body">{topic.message}</div>
    </div>
  } else if(topic && topic.label) {
    box = <div className="box">
      <div className="message-body">{topic.label}</div>
    </div>
  }
  return (
    <div className="scene-spotlight">
      {box}
    </div>
    
    
  )
}

export default Spotlight