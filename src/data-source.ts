import "reflect-metadata";
import { join } from "path";
import { DataSource } from "typeorm";
import * as dotenv from "dotenv";
import { User } from "./User/entity/user";
import { Attendance } from "./Attendance/entity/Attendance";

// .env faylini o'qish
dotenv.config();

// CLI (ts-node) va kompilyatsiya qilingan (dist) holatda ham ishlaydi
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "Attendence",
  synchronize: false,
  extra: { options: `-c timezone=${process.env.TZ || "Asia/Tashkent"}` },
  logging: process.env.DB_LOGGING === "true",
  entities: [User, Attendance],
  migrations: [join(__dirname, "migrations", "*.{ts,js}")],
  subscribers: [],
});
