import express from "express"
import { initializeRedisClient } from "../utils/client";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys";
import { SuccessResponse } from "../utils/responses";

const router = express.Router();

router.get("/",async (req,res,next)=>{
    try {
        const client = await initializeRedisClient()
        const cuisines = await client.sMembers(cuisinesKey)
        return SuccessResponse(res,cuisines)
    } catch (error) {
        next(error)
    }
})
router.get("/:cuisine", async(req,res,next)=>{
    const {cuisine} = req.params
    try {
        const client = await initializeRedisClient();
        const restaurantIds = await client.sMembers(cuisineKey(cuisine))
        const restaurants = await Promise.all(
            restaurantIds.map(id => client.hGet(restaurantKeyById(id),"name"))
        )
        return SuccessResponse(res,restaurants)
    } catch (error) {
        next(error)
    }
})



export default router;