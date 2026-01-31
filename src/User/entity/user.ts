import { Attendance } from "src/Attendance/entity/Attendance";
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, } from "typeorm";
import { ROLE } from "types/global.types";

@Entity("users")
export class User {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 100, unique: true })
    login: string;

    @Column({ type: "varchar", length: 255, select: false })
    password: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    middlname: string;

    @Column({ type: "varchar", length: 100 })
    firstname: string;

    @Column({ type: "varchar", length: 100 })
    lastname: string;

    @Column({ type: "varchar", length: 150, unique: true })
    email: string;

    @Column({ type: "varchar", length: 150, nullable: true })
    company: string;

    @Column({
        type: "enum",
        enum: ROLE,
        default: ROLE.USER,
    })
    role: ROLE;

    @CreateDateColumn()
    created_At: Date;

    @UpdateDateColumn()
    updated_At: Date;

    @Column({ type: "boolean", default: false })
    isBlock: boolean;

    // OWNERga bog'lash

    @ManyToOne(() => User, user => user.users, { nullable: true })
    @JoinColumn({ name: "owner_id" })
    owner: User;

    @OneToMany(() => User, user => user.owner)
    users: User[];


    @OneToMany(() => Attendance, attendance => attendance.user)
    attendances: Attendance[];
}

