import React, { useState, useEffect } from "react"
import { motion, useAnimation } from "framer-motion"
import delay from "delay"
import { CardCarousel } from "./CardCarousel"

// This is the clipping box keyframes that causes the
// tape-like reveal of the box
// Made with: https://bennettfeely.com/clippy/
const polygonFrames = [
  "polygon(0 0, -15% 0, -20% 150%, 0% 150%)",
  "polygon(0 0, 135% 0, 120% 150%, 0% 150%)"
]
const boxShadowFrames = [
  "0 1px 1px -1px rgba(0, 0, 0, 0.0)",
  "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
]

type SpotlightTopicData = { label: string }
type TopicUpdateHandler = (topicData: SpotlightTopicData) => void

function isSpotlightTopicData(data: any): data is SpotlightTopicData  {
  return typeof data.label === 'string'
}

function subscribeToTopic(callback: TopicUpdateHandler) {
  window.firebase
    .firestore()
    .collection("spotlight")
    .doc("topic")
    .onSnapshot(async function(doc) {
      const data = doc.data()
      if (!isSpotlightTopicData(data)) {
        console.error('topic data did not conform', data)
        return
      } 
      callback(data)
    })
}

function Spotlight() {
  const [waitingLabel, setWaitingLabel] = useState<string | null>(null)
  const [bigLabelText, setBigLabelText] = useState<string | null>(null)
  const [isRevealPending, setIsRevealPending] = useState(false)
  const controls = useAnimation()

  useEffect(() => {
    async function handleIsRevealPending() {
      if (!isRevealPending) return

      setIsRevealPending(false)

      // Don't reveal immideately, to
      // prevent a too jarring effect
      await delay(150)

      // Start rotating (initial position is 90 so it's quite a distance) ..
      controls.start({
        rotate: -2,
        transition: { type: "spring", damping: 10 }
      })
      // ... and a while into the rotation, start the reveal
      await delay(400)
      await controls.start({
        clipPath: polygonFrames,
        transition: {
          duration: 0.4
        }
      })
      // and once the reveal is complete,
      // slowly fade in the box shadow
      await controls.start({
        boxShadow: boxShadowFrames,
        transition: { duration: 2 }
      })
    }
    handleIsRevealPending()
  }, [isRevealPending, controls])

  useEffect(() => {
    async function handleWaitingLabel() {
      if (!waitingLabel) return

      setWaitingLabel(null)

      if (bigLabelText !== null) {
        await controls.start({
          boxShadow: boxShadowFrames.slice().reverse(),
          transition: { duration: 1, ease: "easeIn" }
        })
        await controls.start({
          rotate: 1,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 10,
            restSpeed: 2
          }
        })
        await controls.start({
          clipPath: polygonFrames.slice().reverse(),
          transition: { duration: 0.5, ease: "easeOut" }
        })
      }

      setBigLabelText(waitingLabel)
      setIsRevealPending(true)
    }
    handleWaitingLabel()
  }, [waitingLabel, controls, bigLabelText])

  useEffect(() => {
    subscribeToTopic(topic => {
      setWaitingLabel(topic.label)
    })
  }, [])

  return (
    <div className="scene-spotlight">
      <motion.div animate={controls} className="big-topic">
        {bigLabelText}
      </motion.div>

      <CardCarousel></CardCarousel>
    </div>
  )
}

export default Spotlight
