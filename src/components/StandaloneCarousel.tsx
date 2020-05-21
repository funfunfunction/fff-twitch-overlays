import { CardCarousel } from "./CardCarousel";
import React from "react";
import CSS from "csstype"

const styleContainer = {
  position: 'absolute',
  left: '10rem',
  top: '10rem',
  width: '18rem'
} as CSS.Properties

export default function StandaloneCarousel() {
  return <div
    className='soc-container'
    style={styleContainer}
  >
    <CardCarousel></CardCarousel>
  </div>
}