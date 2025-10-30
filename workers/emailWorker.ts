import { Worker } from "bullmq";
import IoRedis from "ioredis";

/**
 * Create a Redis connection using ioredis.
 * BullMQ requires `maxRetriesPerRequest` to be `null`
 * to prevent retrying blocking commands (which BullMQ uses under the hood).
 */
const connection = new IoRedis({
  host: "127.0.0.1",   // Redis server host (local machine)
  port: 6379,          // Redis server port (default: 6379)
  maxRetriesPerRequest: null, // 🚨 Required by BullMQ to avoid request retry conflicts
});

/**
 * Create a new Worker that listens to the "emailQueue".
 * This worker will automatically pick up new jobs pushed to Redis
 * and process them using the function you provide.
 */
const worker = new Worker(
  "emailQueue", // Queue name to listen to
  async (job) => {
    // Job processing logic
    console.log(`📨 Sending email to ${job.data.to}...`);

    // Simulate some asynchronous work (like sending an email)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(`✅ Email sent: ${job.data.subject}`);
    // If this function resolves without throwing an error,
    // the job is marked as "completed".
  },
  { connection,
    useWorkerThreads:true,
    concurrency:2,
    limiter:{
        max:10, //process at most 10 jobs
        duration:1000, //per second
    }
   } // Redis connection used by this worker
);

//
// 🔔 EVENT LISTENERS — track everything that happens to your jobs
//

/**
 * Fired when a job completes successfully.
 */
worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed successfully`);
});

/**
 * Fired when a job fails during processing.
 * Common causes: thrown errors, network issues, or bad data.
 */
worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

/**
 * Fired when a job is moved to the 'active' state (i.e., it starts processing).
 */
worker.on("active", (job) => {
  console.log(`⚙️ Job ${job.id} is now active. Processing started...`);
});

/**
 * Fired when a job is stalled — this happens if the worker
 * did not mark the job as complete within a certain time.
 * BullMQ will automatically retry stalled jobs.
 */
worker.on("stalled", (jobId) => {
  console.warn(`⚠️ Job ${jobId} has stalled. Retrying automatically...`);
});

/**
 * Fired when the worker is paused (e.g., manually paused for maintenance).
 */
worker.on("paused", () => {
  console.log("⏸️ Worker paused. No new jobs will be processed.");
});

/**
 * Fired when the worker is resumed after being paused.
 */
worker.on("resumed", () => {
  console.log("▶️ Worker resumed. Job processing continues.");
});

/**
 * Fired when the worker disconnects from Redis.
 * Usually triggered by network issues or manual disconnect.
 */
worker.on("closed", () => {
  console.log("🔌 Worker connection closed. Shutting down...");
});

/**
 * Fired when the worker encounters an internal error.
 * For example, bad Redis connection or internal BullMQ issue.
 */
worker.on("error", (err) => {
  console.error("💥 Worker encountered an error:", err);
});

/**
 * Fired when the worker is ready to start processing jobs.
 * This means Redis connection is established and worker is healthy.
 */
worker.on("ready", () => {
  console.log("🚀 Worker is ready and waiting for jobs...");
});



