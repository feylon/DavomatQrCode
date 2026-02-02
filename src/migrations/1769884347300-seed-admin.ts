import { MigrationInterface, QueryRunner } from "typeorm";
import * as bcrypt from "bcrypt";

export class SeedAdmin1769884347300 implements MigrationInterface {
  name = "SeedAdmin1769884347300";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const username = "admin01";
    const email = "admin01@gmail.com";

    const exist = await queryRunner.query(
      `SELECT "id" FROM "users" WHERE "login" = $1 OR "email" = $2 LIMIT 1`,
      [username, email]
    );

    if (exist?.length) return;

    const hashed = await bcrypt.hash("admin01", 10);

    await queryRunner.query(
      `INSERT INTO "users" ("login","password","firstname","lastname","email","role","isBlock")
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [username, hashed, "Admin", "Admin", email, "ADMIN", false]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "login" = $1`, ["admin01"]);
  }
}
