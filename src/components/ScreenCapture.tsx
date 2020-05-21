import React, { useEffect, useState } from "react"
import CSS from "csstype"
import { FFF_YELLOW } from "./helpers"
import { CardCarousel } from "./CardCarousel"
import SubscriberNotification from "./cards/SubscriberNotification"

const hdWidth = 1920
const hdHeight = 1080
const cameraScale = 0.20

const styleContainer: CSS.Properties = {
  position: 'relative',
  backgroundColor: '#2D2A40',
  width: `${hdWidth}px`,
  height: `${hdHeight}px`,
}

const styleScreenCaptureSample: CSS.Properties = {
  width: "1400px",
  position: 'absolute',
  top: "1rem",
  left: "1.5rem"
}

const styleCamerasList: CSS.Properties = {
  display: 'grid',
  gap: '2rem',
  position: "absolute",
  right: '1.5rem',
  top: '1.1rem',
}

const styleCarouselRow: CSS.Properties = {
  width: `${hdWidth * cameraScale}px`,
  height: `${hdHeight * cameraScale}px`
}

const styleCamera: CSS.Properties = {
  display: 'inline-block',
  position: 'relative',
  width: '100%',
  height: '100%'
}

const styleCameraSample: CSS.Properties = {
  position: 'absolute',
  width: "100%",
  height: "100%",
  boxShadow: '7px 7px 6px rgba(0, 0, 0, 0.2)',
  zIndex: 2
}

const styleCameraBackground: CSS.Properties = {
  width: "104%",
  height: "104%",
  backgroundColor: 'black',
  position: "absolute",
  display: 'inline-block',
  left: '-1%',
  top: '0',
  transform: 'rotate(3deg)', 
  zIndex: 1,
  boxShadow: '7px 7px 6px rgba(0, 0, 0, 0.1)',
}

const styleNameTag: CSS.Properties = {
  position: 'absolute',
  right: '-0.4em',
  bottom: '-0.6rem',
  backgroundColor: FFF_YELLOW,
  zIndex: 3,
  padding: '0.0rem 0.3rem 0.2rem 0.3rem',
  fontSize: '0.7rem'
}

const styleLeanLeft: CSS.Properties = {
  transform: 'rotate(-4deg)', 
}
const styleLeanRight: CSS.Properties = {
  transform: 'rotate(2deg)', 
}

export default function ScreenCapture() {
  return <div className='sc-container' style={styleContainer}>
    <img
      style={styleScreenCaptureSample}
      src="/screen-sample.png"></img>
    
    <div 
      className="sc-cameras-list"
      style={styleCamerasList}
    >
      <div 
        className="carousel-row"
        style={styleCarouselRow}
      ><Camera nameTagText="Oskar Henrikson" index={0}></Camera></div>
      <div 
        className="carousel-row"
        style={styleCarouselRow}
      ><Camera nameTagText="Mattias Petter Johansson" index={1}></Camera></div>
  
      <div 
        className="carousel-row"
        style={{
          ...styleCarouselRow,
          marginTop: '0.2rem'
        }}
      >
        <CardCarousel scale={.6}></CardCarousel>
      </div>
      
    </div>
  
  </div>
}


function Camera({nameTagText, index}: {nameTagText: string; index: number}) {
 const isIndexEven = !!(index % 2)
 return <div style={styleCamera}>
    <img 
      style={styleCameraSample}
      src="/camera-sample.jpg" />

    <div 
      style={styleCameraBackground}>
    </div>

    <div style={{
      ...styleNameTag,
      ...(isIndexEven ? styleLeanLeft : styleLeanRight)
    }}>{nameTagText}</div>
  </div>
}