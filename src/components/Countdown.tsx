import React, { useState, useEffect } from "react"
import moment from "moment"
import setupDurationFormat from "moment-duration-format"
setupDurationFormat(moment)

function Countdown(props) {
  const [bootTime, setBootTime] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState<any>(null)
  const [startTime, setStartTime] = useState<any>(null)

  useEffect(
    function startTicking() {
      setBootTime(new Date())
      const t = moment(new Date())
      if (props.minutes) t.add(props.minutes, "minutes")
      if (props.seconds) t.add(props.seconds, "seconds")
      setStartTime(t)
      const handle = setInterval(function tick() {
        setCurrentTime(new Date())
      }, 500)
      return () => {
        clearInterval(handle)
      }
    },
    [props.minutes, props.seconds]
  )

  let minutes
  if (bootTime && currentTime) {
    const duration: any = moment.duration(moment(startTime).diff(currentTime))
    minutes = duration.format("mm:ss")
  }
  return <div className="countdown">{minutes}</div>
}
export default Countdown
