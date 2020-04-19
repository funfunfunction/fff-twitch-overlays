import React, { useState, useEffect } from 'react';
import moment from 'moment'
import setupDurationFormat from 'moment-duration-format'
setupDurationFormat(moment)

function Countdown(props) {
  const [ bootTime, setBootTime ] = useState(null)
  const [ currentTime, setCurrentTime ] = useState(null)
  const [ startTime, setStartTime ] = useState(null)
  
  useEffect(function startTicking() {
    setBootTime(new Date())
    setStartTime(moment(new Date()).add(props.minutes, 'minutes'))
    const handle = setInterval(function tick() {
      setCurrentTime(new Date())
    }, 500)
    return () => { clearInterval(handle) }
  }, [ props.minutes ])

  if (bootTime && currentTime) {
    var duration = moment.duration(moment(startTime).diff(currentTime));
    var minutes = duration.format("mm:ss")
  }
  return <div className="countdown">{ minutes }</div>
}
export default Countdown