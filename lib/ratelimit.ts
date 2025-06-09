import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Créer une instance Redis (vous pouvez utiliser une alternative locale si nécessaire)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "redis://localhost:6379",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
})

// Configuration du rate limiting
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"), // 5 tentatives par 10 minutes
  analytics: true,
})

// Rate limiting spécifique pour les connexions
export const loginRatelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(3, "5 m"), // 3 tentatives par 5 minutes
  analytics: true,
})
