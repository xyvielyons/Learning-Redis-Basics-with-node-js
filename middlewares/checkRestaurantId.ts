import type {Request,Response,NextFunction} from "express"
import { initializeRedisClient } from "../utils/client"
import { restaurantKeyById } from "../utils/keys"
import { errorResponse } from "../utils/responses"


export const checkRestaurantExists = async (req:Request, res:Response,next:NextFunction) =>{
    const {restaurantId} = req.params
    if(!restaurantId){
        return errorResponse(res,400,"Restaurant Id not found")
    }

    const client = await initializeRedisClient();
    const resturantKey = restaurantKeyById(restaurantId)

    //checking  if the id exists in the redis database
    const exists = await client.exists(resturantKey)

    if(!exists){
        return errorResponse(res,404,"Restaurant Not Found")
    }
    next()

}
