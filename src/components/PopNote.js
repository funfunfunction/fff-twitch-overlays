import { motion } from "framer-motion"
import React, { useState, useEffect } from 'react';

const animationVariants = {
  show: {
    scale: [0, 1.20, 1, 1.1, 1],
    rotate: [0, 25, 0, -2, 1.3],
    opacity: 1,
    transition: { type: "spring", duration: 0.4 }
  },  
  hide: {
    scale: [1, 0.2 ],
    rotate: [0, -10 ],
    opacity: 0,
    transition: { ease: "easeIn", duration: 0.2 }
  }
}

export default function PopNote({ visible, className, children }) {
  if (visible === undefined)
    visible = true
  return (
    <motion.div 
      animate={visible 
        ? animationVariants.show 
        : animationVariants.hide
      } 
      className={'pop-note ' + className }
    >
      {children}
    </motion.div>
  )
}



