import React from "react"
import CSS from "csstype"
import { motion } from "framer-motion"

const styleContainer: CSS.Properties = {
  display: "inline-block",
  position: "absolute",
  bottom: "1rem",
  left: "1.5rem"
}

const styleHeading: CSS.Properties = {
  display: "inline-block",
  backgroundColor: "black",
  color: "white",
  padding: "0.2rem 0.5rem 0.3rem 0.5rem",
  fontSize: "1.2rem",
  position: "absolute",
  top: "-1rem",
  left: "-0.2rem",
  zIndex: 200,
  transform: "rotate(-4deg)"
}

const styleCardBack: CSS.Properties = {
  display: "flex",
  flexDirection: "column",
  backgroundColor: "yellow",
  padding: "1rem 0.9rem 0.5rem 1rem",
  justifyContent: "center",
  alignItems: "center",
  color: "black",
  maxWidth: "12rem",
  minWidth: "12rem",
  position: "relative",
  transform: "rotate(2deg)",
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
    <motion.div
      className="sl-container"
      initial={initialCard}
      animate={animateCard}
      style={styleContainer}
    >
      <motion.div
        className="sl-card"
        initial={initialCard}
        animate={{
          ...animateCard,
          ...{
            ...animateCard.transition,
            delay: 0.5
          }
        }}
        style={styleHeading}
      >
        Current topic
      </motion.div>
      <div className="sl-card-back" style={styleCardBack}>
        <div className="label" style={styleLabel}>
          {props.label}
        </div>
      </div>
    </motion.div>
  )
}
