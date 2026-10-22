import express from 'express'
import cors from 'cors'
import equipmentRoutes from './routes/equipmentRoutes'

const app = express()
const PORT = process.env.PORT ?? 3002

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'AgriRent API is running' })
})

app.use('/api/equipment', equipmentRoutes)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
