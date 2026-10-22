import express from 'express'
import cors from 'cors'
import equipmentRoutes from './routes/equipmentRoutes'
import adminRoutes from './routes/adminRoutes'

const app = express()
const PORT = process.env.PORT ?? 3002

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AgriRent API is running' })
})

app.use('/api/equipment', equipmentRoutes)
app.use('/api/admin', adminRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
