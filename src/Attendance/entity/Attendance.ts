import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AttendanceStatus } from "types/global.types";
import { User } from "src/User/entity/user";

@Entity("attendance")
export class Attendance {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamp" })
  date: Date;

  @Column({ type: "timestamp" })
  start_time: Date;

  @Column({ type: "timestamp", nullable: true })
  end_time: Date;

  @Column({ type: "float", default: 0 })
  worked_hours: number;

  @Column({
    type: "enum",
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({ type: "text", nullable: true })
  reason: string;

  @CreateDateColumn()
  created_At: Date;

  @UpdateDateColumn()
  updated_At: Date;

  // =====================
  // USER RELATION
  // =====================

  @ManyToOne(() => User, user => user.attendances, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
