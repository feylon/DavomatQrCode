import "reflect-metadata";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./User/entity/user"; // Yo'lni tekshirib oling
import { Attendance } from "./Attendance/entity/Attendance";

// .env faylini o'qish
dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "Attendence",
  synchronize: false, // Migration ishlatsangiz, buni false qilish tavsiya etiladi
  logging: true,
  entities: [User, Attendance],
  migrations: ["src/migrations/*.{ts,js}"],
  subscribers: [],
});