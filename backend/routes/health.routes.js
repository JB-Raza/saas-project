import express from 'express'
import mongoose from 'mongoose'

const router = express.Router()

router.get("/", (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1
    const memory = process.memoryUsage()

    const health = {
        status: isDbConnected ? "healthy" : "degraded",
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        database: {
            status: isDbConnected ? "connected" : "disconnected",
            readyState: mongoose.connection.readyState
        },
        system: {
            nodeVersion: process.version,
            memoryUsageMB: {
                rss: (memory.rss / (1024 * 1024)).toFixed(2),
                heapTotal: (memory.heapTotal / (1024 * 1024)).toFixed(2),
                heapUsed: (memory.heapUsed / (1024 * 1024)).toFixed(2)
            }
        }
    }

    return res.status(isDbConnected ? 200 : 503).json(health)
})

export default router
