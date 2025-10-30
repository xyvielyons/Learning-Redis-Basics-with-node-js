import express, {type Request} from "express"
import { Validate } from "../middlewares/validate";
import { RestaurantDetailsSchema, RestaurantSchema, type Restaurant,type RestaurantDetails } from "../schemas/restaurant";
import { initializeRedisClient } from "../utils/client";
import { nanoid } from "nanoid";
import { bloomKey, cuisineKey, cuisinesKey, indexKey, restaurantCuisinesKeyById, restaurantDetailsKeyById, restaurantKeyById, restaurantsByRatingKey, reviewDetailsKeyById, reviewKeyById, weatherKeyById } from "../utils/keys";
import { SuccessResponse, errorResponse } from "../utils/responses";
import { checkRestaurantExists } from "../middlewares/checkRestaurantId";
import { ReviewSchema, type Review } from "../schemas/review";
const router = express.Router();

//weather API
router.get("/:restaurantId/weather",checkRestaurantExists,async(req:Request <{restaurantId:string}>,res,next)=>{
    const {restaurantId} = req.params;
    try {
        const client = await initializeRedisClient()
        const weatherKey = weatherKeyById(restaurantId)
        const cachedWeather = await client.get(weatherKey)
        if(cachedWeather){
            console.log("Cache Hit")
            return SuccessResponse(res,JSON.parse(cachedWeather))
        }

        const restaurantKey = restaurantKeyById(restaurantId)

        const coords = await client.hGet(restaurantKey, "location")

        if(!coords){
            return errorResponse(res,404,"Coordinates have not been found")
        }

        const [lng,lat] = coords.split(",")
        const apiResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=imperial&lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`)
        if(apiResponse.status == 200){
            const json = await apiResponse.json()
            await client.set(weatherKey,JSON.stringify(json),{
                EX: 60 * 60
            })
            return SuccessResponse(res,json)
        }
        return errorResponse(res,500,"couldnt fetch weather info")
    } catch (error) {
        next(error)
    }
})


router.get("/search",async (req,res,next) => {
    const {q} = req.query //search?q=name
    try {
        const client = await initializeRedisClient()
        const results = await client.ft.search(indexKey, `@name:${q}`)
        return SuccessResponse(res,results)

    } catch (error) {
        next(error)
    }

})



router.post("/",Validate(RestaurantSchema),async(req,res,next)=>{
    const data = req.body as Restaurant
    try {
        const client = await initializeRedisClient();
        //creates a random id that are url safe
        const id = nanoid()

        const bloomString = `${data.name}:${data.location}`
        const seenBefore = await client.bf.exists(bloomKey,bloomString)
        if(seenBefore){
            return errorResponse(res,409,"Restaurant already exists")
        }

        const restaurantKey = restaurantKeyById(id)
        const hashData = {id,name:data.name, location:data.location}
        const addResult = await Promise.all([
            ...data.cuisines.map(cuisine => Promise.all([
                client.sAdd(cuisinesKey,cuisine),
                client.sAdd(cuisineKey(cuisine), id),
                client.sAdd(restaurantCuisinesKeyById(id),cuisine),
            ])),
            client.hSet(restaurantKey,hashData),
            client.zAdd(restaurantsByRatingKey,{
                score:0,
                value:id
            }),
            client.bf.add(bloomKey,bloomString)
        ])

        return SuccessResponse(res,hashData,"Added new restaurant")

    } catch (error) {
        next(error)
    }
})


router.post("/:restaurantId/details",checkRestaurantExists,Validate(RestaurantDetailsSchema),async(req:Request<{restaurantId:string}>,res,next)=>{
    const {restaurantId} = req.params
    const data = req.body as RestaurantDetails
    try {
        const client = await initializeRedisClient()
        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId)

        await client.json.set(restaurantDetailsKey,".",data)

        return SuccessResponse(res,{},"restaurant details added")
    } catch (error) {
        next(error)
    }


})
router.get("/:restaurantId/details",checkRestaurantExists,async(req:Request<{restaurantId:string}>,res,next)=>{
    const {restaurantId} = req.params
    const data = req.body as RestaurantDetails
    try {
        const client = await initializeRedisClient()
        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId)

        const details = await client.json.get(restaurantDetailsKey)

        return SuccessResponse(res,details)
    } catch (error) {
        next(error)
    }


})

router.post("/:restaurantId/reviews",checkRestaurantExists,Validate(ReviewSchema),async (req:Request<{restaurantId:string}>,res,next)=>{
    const {restaurantId} = req.params
    const data = req.body as Review
    try {
        const client = await initializeRedisClient()
        const reviewId = nanoid()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewDetailsKey = reviewDetailsKeyById(reviewId)
        const reviewData = {id:reviewId, ...data,timestamp:Date.now(),restaurantId}
        const [reviewCount,setResult] = await Promise.all([
            client.lPush(reviewKey,reviewId),
            client.hSet(reviewDetailsKey,reviewData),
        ]) 

        return SuccessResponse(res,reviewData,"Review Added")
    } catch (error) {
        next(error)
    }
})



router.get("/:restaurantId",checkRestaurantExists,async (req: Request<{restaurantId:string}>,res,next) =>{
    const {restaurantId} = req.params;
    try {
        const client = await initializeRedisClient()
        const restaurantKey = restaurantKeyById(restaurantId)
        const [viewCount, restaurant,cuisines] = await Promise.all([
            client.hIncrBy(restaurantKey,"viewCount",1),
            client.hGetAll(restaurantKey),
            client.sMembers(restaurantCuisinesKeyById(restaurantId))
        ])

        return SuccessResponse(res,{...restaurant,cuisines})
    } catch (error) {
        next(error)
    }
})

router.get("/:restaurantId/reviews",checkRestaurantExists,async (req: Request<{restaurantId:string}>, res, next)=>{
    const {restaurantId} = req.params;
    const {page = 1,limit = 10} = req.query

    const start = (Number(page)-1) * Number(limit)
    const end = start + Number(limit) - 1

    try {
        const client = await initializeRedisClient()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewIds = await client.lRange(reviewKey,start,end)
        const reviews = await Promise.all(reviewIds.map(id => client.hGetAll(reviewDetailsKeyById(id))))

        return SuccessResponse(res, reviews)
    } catch (error) {
        next(error)
    }
})

router.delete("/:restaurantId/reviews/:reviewId",checkRestaurantExists,async (req: Request<{restaurantId:string,reviewId:string}>, res, next)=>{
    const {restaurantId,reviewId} = req.params
    try {
        const client = await initializeRedisClient()
        const reviewKey = reviewKeyById(restaurantId)
        const reviewDetailsKey = reviewDetailsKeyById(reviewId)
        const [removeResult,deleteResult] = await Promise.all([
            client.lRem(reviewKey,0,reviewId),
            client.del(reviewDetailsKey)
        ])
        if(removeResult === 0 && deleteResult ===0){
            return errorResponse(res,404,"Review not found")
        }
        return SuccessResponse(res,reviewId,"Review deleted")
    } catch (error) {
        next(error)
    }
})


export default router;

