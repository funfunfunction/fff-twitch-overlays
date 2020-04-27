import React, { useState, useEffect } from 'react';
import Countdown from './Countdown'
import PopNote from './PopNote'
import { Map, TileLayer, Marker } from 'react-leaflet'

const oneHourMS = 60 * 60 * 1000 

function StartingSoon() {
  const [ checkins, setCheckins ] = useState([])
  const [ shouldRefresh, setShouldRefresh ] = useState(false)
  const [ lastCheckin, setLastCheckin ] = useState({
    displayName: 'mpj',
    location: 'Gamla stan, Stockholm',
    coordinates: [ 59.325010, 18.070370 ],
    statusMessage: 'Starting the live stream!'
  })
  const [ instructionsState, setInstructionsState ] = useState({
    wasShown: Number(Date.now()),
    visible: true
  })
  const [ time, setTime ] = useState(Number(Date.now()))
  const [uniqueChatters, setUniqueChatters] = useState(0);
  const [streamId, setStreamId] = useState(null);
  
  
  
  useEffect(() => { setInterval(() => { setTime(Number(Date.now())) }, 1000) }, [ ])

  useEffect(() => { setInterval(() => { setShouldRefresh(true) }, 200) }, [ ])

  

  useEffect(() => { 
    if(!instructionsState.visible) {
      if (instructionsState.wasHidden <  time - 15000) {
        setInstructionsState({
          visible: true,
          wasShown: time
        })
      }
    } else {
      if(instructionsState.wasShown < time - 5000) {
        setInstructionsState({
          visible: false,
          wasHidden: time
        })
      }
    }
  }, [ time, instructionsState ])

  useEffect(() => {
    if (!shouldRefresh || checkins.length === 0) return
    setShouldRefresh(false)
    setLastCheckin(checkins.shift())
    setCheckins(checkins)
  }, [checkins, shouldRefresh])

  useEffect(() => {
    const db = window.firebase.firestore()
    db.doc('views/twitch-live-status').onSnapshot(async function(snap) {
      setStreamId(snap.data() && snap.data().streamId)
    })
  }, [])

  useEffect(() => {
    const db = window.firebase.firestore()
    db.doc('views/unique-chatters/chatter-counts/'+streamId).onSnapshot(async function(snap) {
      const data = snap.data()
      if (!data) 
        setUniqueChatters(0)
      else
        setUniqueChatters(data.unique)
    })
    
  }, [streamId])

  useEffect(() => {  
    const db = window.firebase.firestore()
    
    db
    .collection("checkins")
      .orderBy("ts", "asc")
      .where("ts", ">", Number(Date.now()) - oneHourMS * 30 )
      .onSnapshot(async function(querySnapshot) {

        querySnapshot.docChanges().forEach(async function(change) {

          if (change.type !== "added") return
          
          setCheckins(checkins => checkins.concat(change.doc.data()))
        })
      })
    
  }, [])

  const boxClassName = lastCheckin.subscriber 
    ? 'box subscriber'
    : 'box'

  let subscriberText = null
  if (lastCheckin.subscriber) {
    if(lastCheckin.subscriber === 1) {
      subscriberText = 'Subscribed this month' 
    } else {
      subscriberText = 'Subscriber for ' + lastCheckin.subscriber + ' months'
    }
  }

  
  return (
    <div className="scene scene-soon">
      <div className="area-counter">
        <div className="label">Stream starting in <Countdown minutes={10} seconds={16} /></div>
      </div>

      
      <PopNote className="unique-chatters">
        Chatting today: <span className="counter">{uniqueChatters}</span>
      </PopNote>

      <div className="area-map">
        <Map center={lastCheckin.coordinates} zoom={6}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={lastCheckin.coordinates}></Marker>
          
        </Map>
        <PopNote visible={instructionsState.visible} className="checkin-instructions">Check in by typing:<span className="command">!checkin LOCATION -- WHATYOUAREDOING</span></PopNote>


        
        <div className="checkin-info">
          <div className="aligner">
            <div className={boxClassName}>
              <div className="status">{lastCheckin.statusMessage}</div>
              <div className="profile">
                <div className="display-name">{lastCheckin.displayName}</div>
                {subscriberText && <div>{subscriberText}</div>}
                <div className="location">Located in <strong>{lastCheckin.location}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      
    </div>
  );
}

export default StartingSoon