import express from "express"
import { emailQueue } from "../queues/emailQueue";


const router = express.Router();

router.get("/send",async (req,res,next)=>{
    try {
        const {to,subject} = req.body.data
        await emailQueue.add("sendEmail",{to,subject},{
            priority:1 // very high priority
            //priority:10 // very low priority

        })
        console.log(await emailQueue.getJobCounts())
        res.status(200).json({
            message:"Email job added to the queue"
        })
    } catch (error) {
        next(error)
    }
})




export default router;