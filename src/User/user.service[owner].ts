import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AddOwnerAdminDto, CreateUserByAdminDto, GetOwnersQueryDto, GetUsersQueryDto, UpdateOwnerAdminDto, UpdateUserAdminDto } from "./entity/user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user";
import { Brackets, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";
import { GetOwnerUsersQueryDto } from "./entity/user.dto[owner]";

@Injectable()
export class UserServiceOwner {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }


      async getUsersByOwner(ownerId: string, query: GetOwnerUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();

    if (limit > 100) {
      throw new BadRequestException("limit 100 dan katta bo'lmasin");
    }

    const qb = this.userRepository
      .createQueryBuilder("u")
      .leftJoin("u.owner", "o")
      .select([
        "u.id",
        "u.login",
        "u.firstname",
        "u.lastname",
        "u.middlname",
        "u.email",
        "u.role",
        "u.isBlock",
        "u.created_At",
        "u.updated_At",
      ])
      .where("u.role = :role", { role: ROLE.USER })
      .andWhere("o.id = :ownerId", { ownerId });

    if (search && search.length > 0) {
      const like = `%${search}%`;
      qb.andWhere(
        new Brackets((q) => {
          q.where("u.firstname ILIKE :like", { like })
            .orWhere("u.lastname ILIKE :like", { like })
            .orWhere("u.middlname ILIKE :like", { like });
        }),
      );
    }

    qb.orderBy("u.created_At", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}