import { Module } from "@nestjs/common";
import { User } from "./entity/user";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserControllerOwner } from "./user.controller[Owner]";
import { UserServiceOwner } from "./user.service[owner]";
import { Attendance } from "src/Attendance/entity/Attendance";

@Module({
    imports : [
        TypeOrmModule.forFeature([User, Attendance])
    ],
    controllers : [UserController, UserControllerOwner],
    providers : [UserService, UserServiceOwner]
})
export class userModule {}