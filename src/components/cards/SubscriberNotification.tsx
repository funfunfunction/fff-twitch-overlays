import React, { useEffect, useRef } from "react"
import { motion, useAnimation, AnimationControls } from "framer-motion"
import delay from "delay"
import CSS from "csstype"
import { FFF_YELLOW } from "../helpers"

const styleContainer = (scale: number) => ({
  display: "block",
  position: "relative",
  fontSize: `${1.5 * scale}rem`
})

const styleCardBack = (scale: number) =>
  ({
    display: "flex",
    flexDirection: "column",
    backgroundColor: "black",
    padding: `5% ${0.8 * scale}rem 5% ${0.8 * scale}rem`,
    justifyContent: "center",
    alignItems: "center",
    color: "white",
    width: "90%",
    position: "relative",
    opacity: 0
  } as CSS.Properties)

const styleDisplayName = (scale: number) =>
  ({
    color: FFF_YELLOW,
    fontSize: `${1.5 * scale}rem`,
    position: "relative",
    top: `${0.5 * scale}rem`
  } as CSS.Properties)

const styleStreakText = (scale: number) =>
  ({
    display: "inline-block",
    fontSize: `${1.8 * scale}rem`,
    lineHeight: `1rem`
  } as CSS.Properties)

const styleStreakTextSubscribed = (scale: number) =>
  ({
    ...styleStreakText(scale),
    marginRight: `${0.4 * scale}rem`
  } as CSS.Properties)

const styleStreakTextFor = styleStreakTextSubscribed

const styleStreakTextCounter = (scale: number) =>
  ({
    ...styleStreakText(scale),
    fontSize: `${2.2 * scale}rem`,
    color: "#FFF203",
    marginRight: `${0.4 * scale}rem`
  } as CSS.Properties)

const messageStyle = (scale: number) =>
  ({
    fontSize: `${1.1 * scale}rem`,
    marginTop: `${0.8 * scale}rem`,
    textAlign: "center"
  } as CSS.Properties)

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
  scale = 1,
  style,
  data: { displayName, months, message }
}: {
  scale: number
  style?: any
  data: SubscriberNotificationData
}) {
  const controlCardBack = useAnimation()
  const controlDisplayName = useAnimation()
  const controlStreakTextSubcribed = useAnimation()
  const controlStreakTextFor = useAnimation()
  const controlStreakTextCounter = useAnimation()
  const controlStreakTextMonths = useAnimation()
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
        scale: 5,
        top: `${2 * scale}rem`
      })
      ;[
        controlStreakTextMonths,
        controlStreakTextCounter,
        controlStreakTextSubcribed,
        controlStreakTextFor
      ].forEach(control => control.set({ opacity: 0, scale: 0.7 }))

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
  }, [
    message,
    displayName,
    months,
    controlStreakTextMonths,
    controlCardBack,
    controlMessage,
    controlStreakTextCounter,
    controlStreakTextSubcribed,
    scale,
    controlDisplayName,
    controlStreakTextFor
  ])

  return (
    <div
      className="sn-container"
      style={{
        ...styleContainer(scale),
        ...style
      }}
    >
      <motion.div
        className="card-back"
        style={styleCardBack(scale)}
        animate={controlCardBack}
      >
        <motion.div
          className="display-name"
          style={styleDisplayName(scale)}
          animate={controlDisplayName}
        >
          {displayName}
        </motion.div>

        <motion.div className="streak">
          <motion.div
            className="text-subscribed"
            style={styleStreakTextSubscribed(scale)}
            animate={controlStreakTextSubcribed}
          >
            subscribed
          </motion.div>
          <motion.div
            className="text-for"
            style={styleStreakTextFor(scale)}
            animate={controlStreakTextFor}
          >
            for
          </motion.div>
          <motion.div
            className="text-counter"
            style={styleStreakTextCounter(scale)}
            animate={controlStreakTextCounter}
            ref={refStreakTextCounter}
          >
            {months}
          </motion.div>
          <motion.div
            className="text-months"
            style={styleStreakText(scale)}
            animate={controlStreakTextMonths}
          >
            months!
          </motion.div>
        </motion.div>
        <motion.div
          className="message"
          style={messageStyle(scale)}
          animate={controlMessage}
        >
          {message.substring(0, 125)}
        </motion.div>
      </motion.div>
    </div>
  )
}

function isDiv(element: HTMLDivElement | null): element is HTMLDivElement {
  const isDiv = !!element && element.tagName === "DIV"
  return isDiv
}
