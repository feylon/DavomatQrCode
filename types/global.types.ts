export enum ROLE {
  ADMIN = "ADMIN",
  USER = "USER",
  OWNER  = "OWNER"
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',// Ishda / Kelib-ketgan
  ABSENT = 'ABSENT',// Kelmagan (Sababsiz)
  EXCUSED = 'EXCUSED',// Sababli (Kasal,Ruxsat so'ragan)
  ON_LEAVE = 'ON_LEAVE',// Mehnat ta'tilida (Otpusk)
}

export interface JwtPayload {
  id: string;
  role: ROLE;
}

export interface Payload_QR_CODE {
  user_id: string;
  owner_id : string;
  status : GO_WORK_STATUS;
}

export  enum GO_WORK_STATUS {
  GOING_TO_WORK = "GOING_TO_WORK",
  LEFT_FROM_WORK = "LEFT_FROM_WORK"
}