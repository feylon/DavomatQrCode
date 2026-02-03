# API qo‘llanma

Barcha endpointlar `/api` prefiksi bilan. To‘liq interaktiv hujjat: **`/api-docs`** (Swagger).

Autentifikatsiya: `Authorization: Bearer <accessToken>` sarlavhasi.
Access token muddati tugasa (`401`), `POST /api/auth/refresh` orqali yangi juftlik oling.

## Tizim

| Metod | Yo‘l          | Ruxsat | Tavsif                         |
| ----- | ------------- | ------ | ------------------------------ |
| GET   | `/health`     | ochiq  | Server va baza holati          |

## Auth

| Metod | Yo‘l                   | Ruxsat | Tavsif |
| ----- | ---------------------- | ------ | ------ |
| POST  | `/auth/login`          | ochiq  | `{ username, password }` → `{ accessToken, refreshToken, role }` (daqiqasiga 10 ta so‘rov) |
| POST  | `/auth/refresh`        | ochiq  | `{ refreshToken }` → yangi tokenlar |
| GET   | `/auth/profile`        | barcha | Joriy foydalanuvchi ma’lumotlari va tashkilot nomi |
| POST  | `/auth/changePassword` | barcha | `{ oldPassword, newPassword }` |

## Admin (`ADMIN`)

| Metod | Yo‘l                             | Tavsif |
| ----- | -------------------------------- | ------ |
| GET   | `/admin/stats`                   | Umumiy statistika |
| GET   | `/admin/owners`                  | Tashkilotlar (`page`, `limit`, `search`), `employeesCount` bilan |
| POST  | `/admin/owners`                  | Tashkilot yaratish |
| GET   | `/admin/owners/:id`              | Bitta tashkilot |
| PATCH | `/admin/owners/:id`              | Tahrirlash / bloklash (`isBlock`) |
| GET   | `/admin/users`                   | Xodimlar (`page`, `limit`, `search`, `ownerId`) |
| POST  | `/admin/users`                   | Xodim yaratish (`ownerId` bilan) |
| GET   | `/admin/users/:id`               | Bitta xodim |
| PATCH | `/admin/users/:id`               | Tahrirlash / boshqa ownerga o‘tkazish / bloklash |
| PATCH | `/admin/accounts/:id/password`   | `{ newPassword }` — owner yoki xodim parolini tiklash |

## Owner — xodimlar (`OWNER`)

| Metod | Yo‘l                        | Tavsif |
| ----- | --------------------------- | ------ |
| GET   | `/owner/users`              | O‘z xodimlari (`page`, `limit`, `search`, `state=active|blocked`) |
| POST  | `/owner/users`              | Xodim qo‘shish |
| GET   | `/owner/users/:id`          | Bitta xodim |
| PATCH | `/owner/users/:id`          | Tahrirlash / bloklash |
| PATCH | `/owner/users/:id/password` | `{ newPassword }` — parolni tiklash |

## Owner — davomat (`OWNER`)

| Metod  | Yo‘l                                | Tavsif |
| ------ | ----------------------------------- | ------ |
| POST   | `/owner/attendance/scan`            | `{ token }` — kamera o‘qigan QR matni; kelish/ketish avtomatik |
| POST   | `/owner/attendance/scan-image`      | `multipart/form-data`, `file` — QR rasmi (≤5MB); avtomatik |
| POST   | `/owner/attendance/enter`           | QR rasm orqali faqat kelish (eski endpoint) |
| POST   | `/owner/attendance/leave`           | QR rasm orqali faqat ketish (eski endpoint) |
| GET    | `/owner/attendance/today`           | Bugungi xulosa va har bir xodim holati |
| GET    | `/owner/attendance/at-work`         | Hozir ishdagi xodimlar |
| POST   | `/owner/attendance/mark-absence`    | `{ user_id, status: ABSENT|EXCUSED|ON_LEAVE, reason? }` |
| DELETE | `/owner/attendance/absence/:id`     | Bugungi kelmaganlik yozuvini bekor qilish |
| GET    | `/owner/attendance/stats`           | Tarix: `page`, `limit`, `startDate`, `endDate`, `status`, `userId`, `search`; `meta.by_status` va jami soat bilan |
| GET    | `/owner/attendance/export`          | Yuqoridagi filtrlar bilan CSV fayl |

Skanerlash javobi:

```json
{
  "id": "…",
  "action": "GOING_TO_WORK",
  "start_time": "2026-02-03T04:01:12.000Z",
  "end_time": null,
  "worked_hours": 0,
  "status": "PRESENT",
  "user": { "id": "…", "firstname": "Ali", "lastname": "Valiyev", "login": "ali" }
}
```

## Xodim (`USER`)

| Metod | Yo‘l                                 | Tavsif |
| ----- | ------------------------------------ | ------ |
| POST  | `/user/attendance/enter/generated_qr`| Kelish QR kodi: `{ qr_code (base64 PNG), company, status, expires_in, expires_at }` |
| POST  | `/user/attendance/exit/generated_qr` | Ketish QR kodi |
| GET   | `/user/attendance/today`             | `{ state, today, month }` — bugungi holat va oy xulosasi |
| GET   | `/user/attendance/my-stats`          | Shaxsiy tarix (`page`, `limit`, `startDate`, `endDate`, `status`) |

## Holatlar

| Qiymat       | Ma’nosi |
| ------------ | ------- |
| `PRESENT`    | Ishga kelgan (QR orqali) |
| `ABSENT`     | Sababsiz kelmagan |
| `EXCUSED`    | Sababli kelmagan |
| `ON_LEAVE`   | Ta’tilda |

`today` endpointlaridagi qo‘shimcha `state` qiymatlari: `AT_WORK` (hozir ishda), `LEFT` (ketgan), `NOT_MARKED` (belgilanmagan).

## Xatolar

Xatolar NestJS formatida qaytadi:

```json
{ "statusCode": 409, "message": "Foydalanuvchi bugun allaqachon ishga kelgan!", "error": "Conflict" }
```
