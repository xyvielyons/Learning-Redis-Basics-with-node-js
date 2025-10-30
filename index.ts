import express from "express"
import dotenv from "dotenv"
import restaurantsRouter from './routes/restaurants'
import cuisinesRouter from './routes/cuisines'
import { errorHandler } from "./middlewares/errorHandler"

dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use("/restaurants",restaurantsRouter)
app.use("/cuisines",cuisinesRouter)

app.use(errorHandler);
app.listen(PORT, ()=>{
    console.log(`Application running on port ${PORT}`)
}).on("error",(error)=>{
    throw new Error(error.message)
})
