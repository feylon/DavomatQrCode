import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "src/User/entity/user";
import { Attendance } from "./Attendance/entity/Attendance";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "123456",
  database: "Attendence",
  synchronize: true,
  logging: false,
  entities: [User, Attendance],
  migrations: ["src/migrations/*.{ts,js}"],
});
