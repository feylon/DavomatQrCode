import {TypeOrmModule} from "@nestjs/typeorm";
import { configDotenv } from "dotenv";

export const TypeOrmConfig = TypeOrmModule.forRoot({
    type : "postgres",
    database : "Attendence",
    port : 5432,
    synchronize :false,
    dropSchema : false,
    username : "postgres",
    password : "123456",
    host : "localhost",
    autoLoadEntities : true
    
});