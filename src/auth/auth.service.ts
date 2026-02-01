import { ForbiddenException, HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/User/entity/user';
import { Repository } from 'typeorm';
import { ChangePasswordBody, LoginBody } from './dto/auth';
import * as bcrypt from 'bcrypt';
import { JwtPayload, ROLE } from 'types/global.types';

@Injectable()
export class AuthService {
AccessToken : string;
RefreshToken : string;
accessTokenExpiry : string;
refreshTokenExpiry : string;

    constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly config : ConfigService
){
    this.AccessToken = String(this.config.get<string>('ACCESS_TOKEN_SECRET'));
    this.RefreshToken = String(this.config.get<string>('REFRESH_TOKEN_SECRET'));

    this.accessTokenExpiry = String(this.config.get<string>('accessTokenExpiry'));
    this.refreshTokenExpiry = String(this.config.get<string>('refreshTokenExpiry'));
}


async loginFunction(body : LoginBody){
    const {username, password} = body;
    try {
        const user = await this.userRepository.findOne({where : {login : username}, select :["id", "role", "password", "isBlock"]});
        if(!user){
            throw new HttpException("Login yoki parol xato", 401);
        }
        if(user.isBlock){
            throw new HttpException("Foydalanuvchi bloklangan", 403);
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if(!isPasswordValid){
            throw new HttpException("Login yoki parol xato", 401);
        }
        const payload : JwtPayload= {
          id : user.id,
          role : user.role  
        }

        const accessToken = this.jwtService.sign(payload, {
            secret : this.AccessToken,
            expiresIn : '600m'})
        
        const refreshToken = this.jwtService.sign(payload, {
            secret : this.RefreshToken,
            expiresIn : '7d'});
        return {accessToken, refreshToken};

    } catch (error) {
        if(error instanceof HttpException){
            throw  error;
        }
        console.log(error.message);
    }
}


async changePassword(userId: string, body: ChangePasswordBody) {
    const { oldPassword, newPassword } = body;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ["id", "password"],
    });

    if (!user) throw new HttpException("User topilmadi", 404);

    const isOldValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldValid) throw new HttpException("Eski parol xato", 401);

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) throw new HttpException("Yangi parol eski parol bilan bir xil emas", 400);

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.userRepository.update({ id: userId }, { password: hashed });

    return { message: "Parol muvaffaqiyatli o'zgartirildi" };
  }


   async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    //   select: [
    //     "id",
    //     "login",
    //     "firstname",
    //     "lastname",
    //     "middlname",
    //     "email",
    //     "company",
    //     "role",
    //     "isBlock",
    //     "created_At",
    //     "updated_At",
    //   ],
    select : {
        id : true,
        login : true,
        firstname : true,
        lastname : true,
        middlname : true,
        email : true,
        // company : true,
        role : true,
        isBlock : true,
        created_At : true,
        updated_At : true,
        owner : {
            company : true
        }
    },
    relations : {
        owner : true}
    });

    if (!user) throw new HttpException("User topilmadi", 404);

    if (user.isBlock) {
      throw new ForbiddenException("User bloklangan");
    }

    let companyName = "";
    if(user.role === ROLE.ADMIN) companyName = "Admin No Company";
    else if(user.role == ROLE.OWNER) companyName = user.company;
    else if(user.owner){
        companyName = user.owner.company;
    } 
    return {
        id : user.id,
        login : user.login,
        firstname : user.firstname,
        lastname : user.lastname,
        middlname : user.middlname,
        email : user.email,
        company : companyName,
        role : user.role,
        isBlock : user.isBlock,
        created_At : user.created_At,
        updated_At : user.updated_At
    };
  }
}


