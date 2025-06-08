"use client"

import { useEffect, useState } from "react"
import ReactConfetti from "react-confetti"

export function Confetti() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [pieces, setPieces] = useState(200)

  useEffect(() => {
    const { innerWidth, innerHeight } = window
    setDimensions({
      width: innerWidth,
      height: innerHeight,
    })

    const timeout = setTimeout(() => {
      setPieces(0)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={pieces}
      recycle={false}
      colors={["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"]}
    />
  )
}
