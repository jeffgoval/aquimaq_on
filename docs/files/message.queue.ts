import { Queue } from "bullmq"
import { env } from "../config/env"

export const messageQueue = new Queue("messages", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
})
