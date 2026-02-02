import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AddOwnerAdminDto, CreateUserByAdminDto, GetOwnersQueryDto, GetUsersQueryDto, UpdateOwnerAdminDto, UpdateUserAdminDto } from "./entity/user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user";
import { Brackets, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { Roles } from "src/auth/roles.decorator";
import { ROLE } from "types/global.types";

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) { }
    async createOwner(body: AddOwnerAdminDto) {

        const { login, password, firstname, lastname, middlname, email, company } = body;

        const hasUser = await this.userRepository.findOne({ where: [{ login }, { email }] });
        if (hasUser) {
            throw new BadRequestException("Bunday login yoki email mavjud");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            login,
            password: hashedPassword,
            firstname,
            lastname,
            middlname: middlname,
            email,
            company,
            role: ROLE.OWNER,
        });
        const savedUser = await this.userRepository.save(user);
        return {
            ...savedUser,
            password: undefined,
        }
    }



    async getOwners(query: GetOwnersQueryDto) {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const search = query.search?.trim();

        const qb = this.userRepository
            .createQueryBuilder("u")
            .select([
                "u.id",
                "u.login",
                "u.firstname",
                "u.lastname",
                "u.middlname",
                "u.email",
                "u.company",
                "u.role",
                "u.created_At",
                "u.updated_At",
                "u.isBlock",
            ])
            .where("u.role = :role", { role: ROLE.OWNER });

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



    async updateOwner(id: string, body: UpdateOwnerAdminDto) {
        const owner = await this.userRepository.findOne({
            where: { id, role: ROLE.OWNER },
            select: ["id", "login", "email", "password", "role", "firstname", "lastname", "middlname", "company", "isBlock", "created_At", "updated_At"],
        });

        if (!owner) throw new NotFoundException("Owner topilmadi");

        if (body.login) {
            const existsLogin = await this.userRepository.findOne({ where: { login: body.login } });
            if (existsLogin && existsLogin.id !== id) {
                throw new BadRequestException("Bunday login mavjud");
            }
            owner.login = body.login;
        }

        if (body.email) {
            const existsEmail = await this.userRepository.findOne({ where: { email: body.email } });
            if (existsEmail && existsEmail.id !== id) {
                throw new BadRequestException("Bunday email mavjud");
            }
            owner.email = body.email;
        }

        if (typeof body.firstname === "string") owner.firstname = body.firstname;
        if (typeof body.lastname === "string") owner.lastname = body.lastname;
        if (typeof body.middlname === "string") owner.middlname = body.middlname;
        if (typeof body.company === "string") owner.company = body.company;
        if (typeof body.isBlock === "boolean") {
            owner.isBlock = body.isBlock;
        }

        // if (body.password) {
        //     owner.password = await bcrypt.hash(body.password, 10);
        // }

        const saved = await this.userRepository.save(owner);

        return {
            ...saved,
            password: undefined,
        };
    }

    async getOwnerById(id: string) {
        const owner = await this.userRepository.findOne({
            where: {
                id,
                role: ROLE.OWNER,
            },
            select: [
                "id",
                "login",
                "firstname",
                "lastname",
                "middlname",
                "email",
                "company",
                "role",
                "created_At",
                "updated_At",
                "isBlock",
            ],
        });

        if (!owner) {
            throw new NotFoundException("Owner topilmadi");
        }

        return owner;
    }



    async createUserByAdmin(body: CreateUserByAdminDto) {
    const owner = await this.userRepository.findOne({
      where: { id: body.ownerId, role: ROLE.OWNER },
      select: ["id", "role", "isBlock"],
    });

    if (!owner) throw new NotFoundException("Owner topilmadi");
    if (owner.isBlock) throw new BadRequestException("Owner bloklangan");

    const hasUser = await this.userRepository.findOne({
      where: [{ login: body.login }, { email: body.email }],
      select: ["id"],
    });

    if (hasUser) throw new BadRequestException("Bunday login yoki email mavjud");

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const user = this.userRepository.create({
      login: body.login,
      password: hashedPassword,
      firstname: body.firstname,
      lastname: body.lastname,
      middlname: body.middlname ? body.middlname: "",
      email: body.email,
      role: ROLE.USER,
      owner: { id: owner.id } as any,
    });

    const saved = await this.userRepository.save(user);

    return {
      ...saved,
      password: undefined,
    };
  }




//   Userni update qilish
async updateUserAdmin(id: string, body: UpdateUserAdminDto) {
    const user = await this.userRepository.findOne({
      where: { id, role: ROLE.USER },
      select: [
        "id",
        "login",
        "firstname",
        "lastname",
        "middlname",
        "email",
        "role",
        "isBlock",
        "created_At",
        "updated_At",
        
      ],
      relations: ["owner"],
    });

    if (!user) throw new NotFoundException("User topilmadi");

    if (body.login) {
      const existsLogin = await this.userRepository.findOne({
        where: { login: body.login },
        select: ["id"],
      });
      if (existsLogin && existsLogin.id !== id) {
        throw new BadRequestException("Bunday login mavjud");
      }
      user.login = body.login;
    }

    if (body.email) {
      const existsEmail = await this.userRepository.findOne({
        where: { email: body.email },
        select: ["id"],
      });
      if (existsEmail && existsEmail.id !== id) {
        throw new BadRequestException("Bunday email mavjud");
      }
      user.email = body.email;
    }

    if (typeof body.firstname === "string") user.firstname = body.firstname;
    if (typeof body.lastname === "string") user.lastname = body.lastname;
    if (typeof body.middlname === "string") user.middlname = body.middlname;
    if (typeof body.isBlock === "boolean") user.isBlock = body.isBlock;

    if (body.ownerId) {
      const owner = await this.userRepository.findOne({
        where: { id: body.ownerId, role: ROLE.OWNER },
        select: ["id", "isBlock"],
      });

      if (!owner) throw new NotFoundException("Owner topilmadi");
      if (owner.isBlock) throw new BadRequestException("Owner bloklangan");

      user.owner = { id: owner.id } as any;
    }

    const saved = await this.userRepository.save(user);

    return saved; }



async getUsers(query: GetUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const search = query.search?.trim();
    const ownerId = query.ownerId;

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
        "o.id",
      ])
      .where("u.role = :role", { role: ROLE.USER });

    if (ownerId) {
      qb.andWhere("o.id = :ownerId", { ownerId });
    }

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



  async getUserById(id: string) {
  const user = await this.userRepository.findOne({
    where: {
      id,
      role: ROLE.USER,
    },
    relations: ["owner"],
    select: [
      "id",
      "login",
      "firstname",
      "lastname",
      "middlname",
      "email",
      "role",
      "isBlock",
      "created_At",
      "updated_At",
    ],
  });

  if (!user) {
    throw new NotFoundException("User topilmadi");
  }

  return user;
}


}