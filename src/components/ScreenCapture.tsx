import React, { useEffect, useState } from "react"
import CSS from "csstype"
import { FFF_YELLOW, GREEN_SCREEN_COLOR } from "./helpers"

import { CardCarousel } from "./CardCarousel"
import { subscribeToGuestConfiguration, GuestConfiguration } from "./Moderator"

const hdWidth = 1920
const hdHeight = 1080
const cameraScale = 0.2

const styleContainer: CSS.Properties = {
  position: "relative",
  backgroundColor: "#2D2A40",
  width: `${hdWidth}px`,
  height: `${hdHeight}px`
}

const styleScreenCaptureGreenScreen: CSS.Properties = {
  width: "1425px",
  height: "1025px",
  position: "absolute",
  top: "0.75rem",
  left: "1rem",
  backgroundColor: GREEN_SCREEN_COLOR,
  boxShadow: "7px 7px 6px rgba(0, 0, 0, 0.35)",
}

const styleCamerasList: CSS.Properties = {
  display: "grid",
  gap: "2rem",
  position: "absolute",
  right: "1.25rem",
  top: "0.75rem"
}

const styleCarouselRow: CSS.Properties = {
  width: `${hdWidth * cameraScale}px`,
  height: `${hdHeight * cameraScale}px`
}

const styleCamera: CSS.Properties = {
  display: "inline-block",
  position: "relative",
  width: "100%",
  height: "100%"
}

const styleCameraGreenScreen: CSS.Properties = {
  position: "absolute",
  width: "100%",
  height: "100%",
  boxShadow: "7px 7px 6px rgba(0, 0, 0, 0.2)",
  backgroundColor: GREEN_SCREEN_COLOR,
  zIndex: 2
}

const styleCameraBackground: CSS.Properties = {
  width: "104%",
  height: "104%",
  backgroundColor: "black",
  position: "absolute",
  display: "inline-block",
  left: "-1%",
  top: "0",
  transform: "rotate(3deg)",
  zIndex: 1,
  boxShadow: "7px 7px 6px rgba(0, 0, 0, 0.1)"
}

const styleNameTag: CSS.Properties = {
  position: "absolute",
  right: "-0.4em",
  bottom: "-0.6rem",
  backgroundColor: FFF_YELLOW,
  zIndex: 3,
  padding: "0.0rem 0.3rem 0.2rem 0.3rem",
  fontSize: "0.7rem"
}

const styleLeanLeft: CSS.Properties = {
  transform: "rotate(-4deg)"
}
const styleLeanRight: CSS.Properties = {
  transform: "rotate(2deg)"
}

export default function ScreenCapture() {
  const [guestConfig, setGuestConfig] = useState<GuestConfiguration>({
    name: null
  })

  useEffect(function() {
    subscribeToGuestConfiguration(setGuestConfig)
  }, [])

  return (
    <div className="sc-container" style={styleContainer}>
      <div
        className="sc-green-screen"
        style={styleScreenCaptureGreenScreen}
      ></div>

      <div className="sc-cameras-list" style={styleCamerasList}>
        <div className="carousel-row" style={styleCarouselRow}>
          <Camera nameTagText="Mattias Petter Johansson" index={1}></Camera>
        </div>

        {typeof guestConfig.name === "string" && (
          <div className="carousel-row" style={styleCarouselRow}>
            <Camera nameTagText={guestConfig.name} index={0}></Camera>
          </div>
        )}

        <div
          className="carousel-row"
          style={{
            ...styleCarouselRow,
            marginTop: "0.2rem"
          }}
        >
          <CardCarousel scale={0.6}></CardCarousel>
        </div>
      </div>
    </div>
  )
}

function Camera({
  nameTagText,
  index
}: {
  nameTagText: string
  index: number
}) {
  const isIndexEven = !!(index % 2)
  return (
    <div style={styleCamera}>
      <div className="cam-green-screen" style={styleCameraGreenScreen}></div>

      <div style={styleCameraBackground}></div>

      <div
        style={{
          ...styleNameTag,
          ...(isIndexEven ? styleLeanLeft : styleLeanRight)
        }}
      >
        {nameTagText}
      </div>
    </div>
  )
}
