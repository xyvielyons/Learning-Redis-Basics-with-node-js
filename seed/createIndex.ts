import { SCHEMA_FIELD_TYPE } from "redis";
import { initializeRedisClient } from "../utils/client";
import { indexKey,getKeyName } from "../utils/keys";


async function createIndex(){
    const client = await initializeRedisClient()
    try {
        await client.ft.dropIndex(indexKey)
    } catch (error) {
        console.log("No existing index to delete")
    }

    await client.ft.create(indexKey,{
        id:{
            type:SCHEMA_FIELD_TYPE.TEXT,
            AS:"id"
        },
        name:{
            type:SCHEMA_FIELD_TYPE.TEXT,
            AS:"name"
        },
        avgStars:{
            type:SCHEMA_FIELD_TYPE.NUMERIC,
            AS:"avgStars",
            SORTABLE:true
        }
    },{ON:"HASH",PREFIX:getKeyName("restaurants")})

}
await createIndex();
process.exit()