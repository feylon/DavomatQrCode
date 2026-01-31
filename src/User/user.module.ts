import { Module } from "@nestjs/common";
import { User } from "./entity/user";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { UserControllerOwner } from "./user.controller[Owner]";
import { UserServiceOwner } from "./user.service[owner]";
import { QrService } from "src/QR/qr.service";

@Module({
    imports : [
        TypeOrmModule.forFeature([User])
    ],
    controllers : [UserController, UserControllerOwner],
    providers : [UserService, UserServiceOwner, QrService]
})
export class userModule {}