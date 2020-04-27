import React, { useState, useEffect } from 'react';

function Spotlight() {
  const db = window.firebase.firestore()

  const [ topic, setTopic ] = useState<any>()

  useEffect(() => {
    db
      .collection("spotlight")
      .doc("topic")
      .onSnapshot(function(doc) {
        setTopic(doc.data())
      })
  }, [db])

  return (
    <div className="scene-spotlight">
      <div className="top-boxes">
        {topic && topic.label && <div className="box">
          <div className="box-header">Current topic:</div>
          <div className="box-body">{topic.label}</div>
        </div>}
        {topic && topic.message && <div className="box message">
          <div className="box-header">{topic.message.displayName} says:</div>
          <div className="box-body">{topic.message.message.substring(0, 380)}</div>
        </div>}
      </div>
    </div>
    
    
  )
}

export default Spotlight