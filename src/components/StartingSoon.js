import React, { useState, useEffect } from 'react';
import Countdown from './Countdown'
import { Map, TileLayer, Marker } from 'react-leaflet'
import { motion } from "framer-motion"

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

  const checkinAnimationVisibleVariant = {
    scale: [0, 1.20, 1, 1.1, 1],
    rotate: [0, 25, 0, -2, 1.3],
    opacity: 1,
    transition: { type: "spring", duration: 0.4 }
  }

  const checkinAnimationHiddenVariant = {
    scale: [1, 0.2 ],
    rotate: [0, -10 ],
    opacity: 0,
    transition: { ease: "easeIn", duration: 0.2 }
  }

  return (
    <div className="scene scene-soon">
      <div className="area-counter">
        <div className="label">Stream starting in <Countdown minutes={10} seconds={16} /></div>
      </div>

      <div className="area-map">
        <Map center={lastCheckin.coordinates} zoom={6}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={lastCheckin.coordinates}></Marker>
          
        </Map>
        <motion.div 
          animate={instructionsState.visible ? checkinAnimationVisibleVariant : checkinAnimationHiddenVariant} 
          className="checkin-instructions">Check in by typing <span className="command">!checkin LOCATION -- WHATYOUAREDOING</span></motion.div>
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