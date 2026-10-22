import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import equipmentRoutes from './routes/equipmentRoutes'
import adminRoutes from './routes/adminRoutes'
import authRoutes from './routes/auth.routes'

const app = express()
const PORT = Number(process.env.PORT) || 3002

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AgriRent API is running' })
})

app.use('/auth', authRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/admin', adminRoutes)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

export default app
