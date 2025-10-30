import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisConnection = new IORedis();


export const emailQueue = new Queue("emailQueue",{
    connection:redisConnection,
    defaultJobOptions:{
        attempts:5, // retry 5 times before failing
        backoff:{type:"exponential",delay:2000},//increase delay beyween retries exponentially
        // removeOnComplete:true //automatically remove completed jobs from redis
        // Keep completed jobs for 1 hour or last 1000 jobs, then clean automatically
        removeOnComplete: { age: 3600, count: 1000 },
    }
})