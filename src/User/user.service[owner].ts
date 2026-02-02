import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entity/user";
import { Brackets, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { ROLE } from "types/global.types";
import { CreateEmployeeByOwnerDto, GetOwnerUsersQueryDto, ResetPasswordDto, UpdateEmployeeByOwnerDto } from "./entity/user.dto[owner]";

const EMPLOYEE_FIELDS: (keyof User)[] = [
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
];

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
      .select(EMPLOYEE_FIELDS.map((f) => `u.${f}`))
      .where("u.role = :role", { role: ROLE.USER })
      .andWhere("o.id = :ownerId", { ownerId });

    if (query.state) {
      qb.andWhere("u.isBlock = :isBlock", { isBlock: query.state === "blocked" });
    }

    if (search && search.length > 0) {
      const like = `%${search}%`;
      qb.andWhere(
        new Brackets((q) => {
          q.where("u.firstname ILIKE :like", { like })
            .orWhere("u.lastname ILIKE :like", { like })
            .orWhere("u.middlname ILIKE :like", { like })
            .orWhere("u.login ILIKE :like", { like });
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


  async getEmployeeById(ownerId: string, id: string) {
    const user = await this.userRepository.findOne({
      where: { id, role: ROLE.USER, owner: { id: ownerId } },
      select: EMPLOYEE_FIELDS,
    });
    if (!user) throw new NotFoundException("Xodim topilmadi");
    return user;
  }


  async createEmployee(ownerId: string, body: CreateEmployeeByOwnerDto) {
    await this.ensureUnique(body.login, body.email);

    const hashedPassword = await bcrypt.hash(body.password, 10);
    const user = this.userRepository.create({
      login: body.login,
      password: hashedPassword,
      firstname: body.firstname,
      lastname: body.lastname,
      middlname: body.middlname ?? "",
      email: body.email,
      role: ROLE.USER,
      owner: { id: ownerId } as User,
    });

    const saved = await this.userRepository.save(user);
    return this.getEmployeeById(ownerId, saved.id);
  }


  async updateEmployee(ownerId: string, id: string, body: UpdateEmployeeByOwnerDto) {
    const user = await this.getEmployeeById(ownerId, id);

    if (body.login && body.login !== user.login) {
      await this.ensureUnique(body.login, undefined, id);
      user.login = body.login;
    }
    if (body.email && body.email !== user.email) {
      await this.ensureUnique(undefined, body.email, id);
      user.email = body.email;
    }
    if (typeof body.firstname === "string") user.firstname = body.firstname;
    if (typeof body.lastname === "string") user.lastname = body.lastname;
    if (typeof body.middlname === "string") user.middlname = body.middlname;
    if (typeof body.isBlock === "boolean") user.isBlock = body.isBlock;

    await this.userRepository.save(user);
    return this.getEmployeeById(ownerId, id);
  }


  async resetEmployeePassword(ownerId: string, id: string, body: ResetPasswordDto) {
    await this.getEmployeeById(ownerId, id);
    const hashed = await bcrypt.hash(body.newPassword, 10);
    await this.userRepository.update({ id }, { password: hashed });
    return { message: "Xodim paroli yangilandi" };
  }


  private async ensureUnique(login?: string, email?: string, excludeId?: string) {
    const where: Partial<User>[] = [];
    if (login) where.push({ login });
    if (email) where.push({ email });
    if (!where.length) return;

    const exists = await this.userRepository.findOne({ where, select: ["id", "login", "email"] });
    if (exists && exists.id !== excludeId) {
      throw new BadRequestException(
        exists.login === login ? "Bunday login mavjud" : "Bunday email mavjud",
      );
    }
  }
}
