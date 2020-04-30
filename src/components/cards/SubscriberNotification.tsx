import React, { useEffect, useRef } from "react"
import { motion, useAnimation, AnimationControls } from "framer-motion"
import delay from "delay"
import CSS from 'csstype'


const styleContainer: CSS.Properties = {
  display: "inline-block",
  position: "absolute",
  bottom: "1rem",
  left: "1.5rem"
}
const styleCardBack: CSS.Properties = {
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'black',
  padding: '0.8rem 0.8rem 0.8rem 0.8rem',
  justifyContent: 'center',
  alignItems: 'center',
  color: 'white',
  maxWidth: '18rem',
  position: 'relative',
  opacity: 0
} 

const styleDisplayName: CSS.Properties = {
  'color': '#FFF203',
  'fontSize': '1.5rem',
  'position': 'relative',
  'top': '0.5rem'
}

const styleStreakText: CSS.Properties = {
  display: 'inline-block',
  fontSize: '1.8rem',
  lineHeight: '2rem',
}
const styleStreakTextSubscribed: CSS.Properties = {
  ...styleStreakText,
  marginRight: '0.4rem'
}
const styleStreakTextFor: CSS.Properties = {
  ...styleStreakText,
  marginRight: '0.4rem'
}
const styleStreakTextCounter: CSS.Properties = {
  ...styleStreakText,
  fontSize: '2.2rem',
  color: '#FFF203',
  marginRight: '0.4rem'
}

const messageStyle: CSS.Properties = {
  fontSize: '1.1rem',
  marginTop: '0.8rem',
  textAlign: "center"
}

function showStreakText(control: AnimationControls) {
  return control.start({
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      velocity: 10,
      damping: 8
    }
  })
}

interface SubscriberNotificationData {
  displayName: string
  months: number
  message: string
}

export default function SubscriberNotification({
  data: {displayName, months, message} 
}: { data: SubscriberNotificationData }) {

  
  const controlCardBack = useAnimation()
  const controlDisplayName = useAnimation()
  const controlStreakTextSubcribed = useAnimation()
  const controlStreakTextFor= useAnimation()
  const controlStreakTextCounter= useAnimation()
  const controlStreakTextMonths= useAnimation()
  const controlMessage = useAnimation()

  const refStreakTextCounter = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function animateSubscriberBox() {
      
      // Set up the scene
      controlCardBack.set({
        opacity: 0,
        scale: 0,
        rotate: 50
      })
      
      controlDisplayName.set({
        scale: 1.3,
        top: "2rem"
      })

      ;[controlStreakTextMonths,
        controlStreakTextCounter,
        controlStreakTextSubcribed,
        controlStreakTextFor
      ].forEach(control =>
        control.set({ opacity: 0, scale: 0.7 }))

      controlMessage.set({
        opacity: 0
      })

      // Card back appearance
      controlCardBack.start({
        opacity: 1,
        scale: 1,
        rotate: 2,
        transition: {
          type: "spring",
          stiffness: 200,
          mass: 1.5,
          damping: 18
        }
      })
      // Display name appearance
      controlDisplayName.start({
        scale: 1.4,
        rotate: 0,
        transition: {
          delay: 0.1,
          type: "spring",
          stiffness: 75,
          damping: 16,
          mass: 1.5
        }
      })

      await delay(1500)

      // Display name re-positioning
      controlDisplayName.start({
        top: 0,
        scale: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 20,
          mass: 1.5,
          velocity: 1
        }
      })

      // Streak text appearance

      await delay(650)
      showStreakText(controlStreakTextSubcribed)
      await delay(250)

      showStreakText(controlStreakTextFor)
      await delay(300)
      
      const elem = refStreakTextCounter.current
      if (!isDiv(elem)) throw new Error("could not find months element")

      // Counter flashing, counting up
      const months = parseInt(elem.innerText, 10)
      ;(async function() {
        const startMonth = months - (months % 10)
        elem.innerText = "" + startMonth
        for (let i = startMonth; i <= months; i++) {
          if (i > 0) {
            await controlStreakTextCounter.start({
              scale: 0.8,
              opacity: 0.6,
              transition: { duration: 0.05 }
            })
          }
          elem.innerText = "" + i
          controlStreakTextCounter.start({
            scale: 1,
            opacity: 1,
            transition: {
              type: "spring",
              stiffness: 100,
              velocity: 10,
              damping: 4
            }
          })
          await delay(175)
        }
      })()

      // last part of streak text "... months!"
      await delay((months % 10) * (175 + 100))
      showStreakText(controlStreakTextMonths)

      // and finally fade in the message
      await delay(800)
      controlMessage.start({
        opacity: 1
      })
    }
    animateSubscriberBox()
  }, [ message, displayName, months])

  return (
    <div className="subscriber-notification" style={styleContainer}>
      <motion.div className='card-back' style={styleCardBack} animate={controlCardBack}>
        <motion.div className='display-name' style={styleDisplayName} animate={controlDisplayName} >
          {displayName}
        </motion.div>

        <motion.div className="streak">
          <motion.div className="text-subscribed" style={styleStreakTextSubscribed} animate={controlStreakTextSubcribed}>subscribed</motion.div>
          <motion.div className="text-for" style={styleStreakTextFor} animate={controlStreakTextFor} >for</motion.div>
          <motion.div className="text-counter" style={styleStreakTextCounter} animate={controlStreakTextCounter} ref={refStreakTextCounter}>
            {months}
          </motion.div>
          <motion.div
            className="text-months"
            style={styleStreakText}
            animate={controlStreakTextMonths}
          >
            months!
          </motion.div>
        </motion.div>
        <motion.div className="message" style={messageStyle} animate={controlMessage}>
          {message.substring(0, 125)}
        </motion.div>
      </motion.div>
    </div>
  )
}


function isDiv(element): element is HTMLDivElement {
  const isDiv = element && element.tagName === 'DIV'
  return isDiv
}