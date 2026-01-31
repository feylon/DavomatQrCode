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