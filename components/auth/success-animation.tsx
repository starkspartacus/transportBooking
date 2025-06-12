"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Sparkles, Heart, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Confetti } from "@/components/ui/confetti"

interface SuccessAnimationProps {
  isVisible: boolean
  title: string
  message: string
  onClose: () => void
  onContinue?: () => void
  type?: "client" | "company"
}

export function SuccessAnimation({
  isVisible,
  title,
  message,
  onClose,
  onContinue,
  type = "client",
}: SuccessAnimationProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (isVisible) {
      setShowConfetti(true)
      const timer = setTimeout(() => setShowConfetti(false), 4000)

      // Animation séquentielle
      const stepTimer = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % 4)
      }, 800)

      return () => {
        clearTimeout(timer)
        clearInterval(stepTimer)
      }
    }
  }, [isVisible])

  const floatingIcons = [
    { Icon: Sparkles, delay: 0, color: "text-yellow-500" },
    { Icon: Heart, delay: 0.2, color: "text-red-500" },
    { Icon: Star, delay: 0.4, color: "text-blue-500" },
    { Icon: CheckCircle, delay: 0.6, color: "text-green-500" },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {showConfetti && <Confetti />}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                duration: 0.6,
                bounce: 0.3,
              }}
              className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 text-center relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-green-500" />
              </div>

              {/* Floating Icons */}
              <div className="absolute inset-0 pointer-events-none">
                {floatingIcons.map(({ Icon, delay, color }, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    animate={{
                      opacity: currentStep >= index ? 1 : 0.3,
                      scale: currentStep >= index ? 1 : 0.5,
                      rotate: 0,
                      y: [0, -10, 0],
                    }}
                    transition={{
                      delay,
                      duration: 0.8,
                      y: {
                        repeat: Number.POSITIVE_INFINITY,
                        duration: 2,
                        ease: "easeInOut",
                      },
                    }}
                    className={`absolute ${color}`}
                    style={{
                      left: `${20 + index * 20}%`,
                      top: `${10 + (index % 2) * 15}%`,
                    }}
                  >
                    <Icon className="h-6 w-6" />
                  </motion.div>
                ))}
              </div>

              {/* Main Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.3,
                  type: "spring",
                  duration: 0.8,
                  bounce: 0.4,
                }}
                className="relative z-10"
              >
                <div
                  className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
                    type === "client"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600"
                      : "bg-gradient-to-r from-green-500 to-green-600"
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    <CheckCircle className="h-10 w-10 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="relative z-10 space-y-4"
              >
                <motion.h2
                  className={`text-2xl font-bold ${type === "client" ? "text-blue-600" : "text-green-600"}`}
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                >
                  {title}
                </motion.h2>

                <p className="text-gray-600 leading-relaxed">{message}</p>

                {/* Success Steps */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-center space-x-2 my-6"
                >
                  {[0, 1, 2].map((step) => (
                    <motion.div
                      key={step}
                      className={`w-2 h-2 rounded-full ${
                        currentStep >= step ? (type === "client" ? "bg-blue-500" : "bg-green-500") : "bg-gray-300"
                      }`}
                      animate={{
                        scale: currentStep === step ? [1, 1.5, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="space-y-3 pt-4"
                >
                  {onContinue && (
                    <Button
                      onClick={onContinue}
                      className={`w-full ${
                        type === "client"
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      } text-white transition-all duration-200 transform hover:scale-105`}
                    >
                      {type === "client" ? "Se connecter maintenant" : "Accéder au tableau de bord"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="w-full hover:bg-gray-50 transition-all duration-200"
                  >
                    Fermer
                  </Button>
                </motion.div>
              </motion.div>

              {/* Decorative Elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-400 rounded-full opacity-20"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />

              <motion.div
                className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-400 rounded-full opacity-20"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [360, 180, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
