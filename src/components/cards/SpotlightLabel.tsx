import React from "react"
import CSS from "csstype"
import { motion } from "framer-motion"

const styleContainer: CSS.Properties = {
  display: "block",
  position: "relative"
}

const styleHeading: CSS.Properties = {
  display: "inline-block",
  backgroundColor: "black",
  color: "white",
  padding: "0.2rem 0.5rem 0.3rem 0.5rem",
  fontSize: "1rem",
  position: "absolute",
  top: "-20%",
  left: "-3%",
  zIndex: 200,
  transform: "rotate(-4deg)"
}

const styleCardBack: CSS.Properties = {
  display: "flex",
  flexDirection: "column",
  backgroundColor: "yellow",
  padding: "5% 0.9rem 0.5rem 5%",
  justifyContent: "center",
  alignItems: "center",
  color: "black",
  width: "90%",
  height: "5.5rem",
  position: "relative",
  transform: "rotate(0deg)",
  zIndex: 100
}

type SpotlightLabelProps = {
  label: string
}

const styleLabel = {
  overflow: "hidden",
  maxHeight: "7rem"
}
const animateCard = {
  opacity: 1,
  scale: 1,
  rotate: 2,
  transition: {
    type: "spring",
    stiffness: 200,
    mass: 1.5,
    damping: 8
  }
}
const initialCard = {
  opacity: 0,
  scale: 0,
  rotate: -20
}
export function SpotlightLabel(props: SpotlightLabelProps) {
  return (
    <motion.div className="sl-container" style={styleContainer}>
      <motion.div
        className="sl-card"
        style={styleHeading}
        initial={initialCard}
        animate={{
          ...animateCard,
          ...{
            ...animateCard.transition,
            delay: 0.5
          }
        }}
      >
        Current topic
      </motion.div>
      <motion.div
        className="sl-card-back"
        style={styleCardBack}
        initial={initialCard}
        animate={animateCard}
      >
        <div className="label" style={styleLabel}>
          {props.label}
        </div>
      </motion.div>
    </motion.div>
  )
}
