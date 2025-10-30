import express from "express"
import dotenv from "dotenv"
import restaurantsRouter from './routes/restaurants'
import cuisinesRouter from './routes/cuisines'
import bullMqRouters from './routes/bullRoutes'
import { errorHandler } from "./middlewares/errorHandler"

import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import "./workers/emailWorker"


import { emailQueue } from "./queues/emailQueue"

dotenv.config()

const PORT = process.env.PORT || 3000
const app = express()

app.use(express.json())
app.use("/restaurants",restaurantsRouter)
app.use("/cuisines",cuisinesRouter)
app.use("/bullmq",bullMqRouters)

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());


app.use(errorHandler);
app.listen(PORT, ()=>{
    console.log(`Application running on port ${PORT}`)
    console.log("🧭 Bull Board on http://localhost:3000/admin/queues");
}).on("error",(error)=>{
    throw new Error(error.message)
})
