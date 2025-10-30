export function getKeyName(...args:string[]){
    return `redistraining:${args.join(":")}`
}

// getKeyName("restaurant",id)
//redistraining:restaurant:764784732748399


//lists
export const restaurantKeyById = (id:string) => getKeyName("restaurants",id)

//lists & hash
export const reviewKeyById = (id:string) => getKeyName("reviews",id)

export const reviewDetailsKeyById = (id:string) => getKeyName("reviews_retails",id)

//sets
export const cuisinesKey = getKeyName("cuisines")
export const cuisineKey = (name:string) => getKeyName("cuisine",name)
export const restaurantCuisinesKeyById = (id:string) => getKeyName("restaurant_cuisines",id)

//sorted sets
export const restaurantsByRatingKey = getKeyName("restaurants_by_rating")


export const weatherKeyById = (id:string)=>getKeyName("weather",id)


export const restaurantDetailsKeyById = (id:string) => getKeyName("restaurant_details",id)


export const indexKey = getKeyName("idx","restaurants")



export const bloomKey = getKeyName("bloom_restaurants")