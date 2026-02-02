import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "src/User/entity/user";
import { Repository } from "typeorm";
import { JwtPayload } from "types/global.types";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: String(config.get<string>("ACCESS_TOKEN_SECRET")),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.id) {
      throw new UnauthorizedException();
    }

    // Token berilgandan keyin bloklangan yoki o'chirilgan foydalanuvchilarni to'xtatish
    const user = await this.userRepository.findOne({
      where: { id: payload.id },
      select: ["id", "role", "isBlock"],
    });
    if (!user || user.isBlock) {
      throw new UnauthorizedException("Foydalanuvchi bloklangan yoki mavjud emas");
    }

    return {
      id: user.id,
      role: user.role,
    };
  }
}
