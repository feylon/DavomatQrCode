# Davomat — QR kod orqali xodimlar davomati

Xodimlarning ishga kelish va ketish vaqtini **QR kod** orqali qayd etadigan tizim.
Xodim telefonida vaqtinchalik QR kod hosil qiladi, tashkilot rahbari uni kamera
(yoki rasm) orqali skanerlaydi. Tizim kelish/ketishni avtomatik aniqlaydi, ishlangan
vaqtni hisoblaydi va statistikani yuritadi.

| Qism      | Texnologiya                                                          |
| --------- | -------------------------------------------------------------------- |
| Backend   | NestJS 11, TypeORM, PostgreSQL, JWT (access + refresh), Swagger      |
| Frontend  | Vue 3, Vite, Vue Router, Pinia, Axios, qr-scanner                    |
| Infratuzilma | Docker, Docker Compose, Nginx                                     |

---

## Imkoniyatlar

**Administrator (ADMIN)**
- Tizim bo‘yicha umumiy statistika (tashkilotlar, xodimlar, bugungi davomat)
- Tashkilot (owner) qo‘shish, tahrirlash, bloklash, parolini tiklash
- Istalgan tashkilotga xodim qo‘shish, boshqa tashkilotga o‘tkazish, bloklash

**Tashkilot rahbari (OWNER)**
- **Bugungi davomat** — har bir xodimning holati (ishda / ketgan / kelmagan / belgilanmagan), avtomatik yangilanadi
- **QR skaner** — kamera, rasm yuklash yoki matn (tashqi skaner) orqali; kelish/ketish avtomatik aniqlanadi
- Xodimni sababli / sababsiz / ta’tilda deb belgilash va buni bekor qilish
- Xodimlarni qo‘shish, tahrirlash, bloklash, parolini tiklash
- Davomat tarixi: sana oralig‘i, xodim, holat bo‘yicha filtr; jami ishlangan vaqt; **CSV (Excel) eksport**

**Xodim (USER)**
- Ishga kelish / ketish uchun QR kod hosil qilish (amal qilish muddati taymer bilan)
- Bugungi holat va joriy oy xulosasi
- Shaxsiy davomat tarixi

**Umumiy**
- Access token muddati tugaganda refresh token orqali avtomatik yangilanadi
- Bloklangan foydalanuvchi tokeni darhol ishlamay qoladi
- Parolni o‘zgartirish, profil sahifasi
- Login uchun so‘rovlar cheklovi (rate limit), Helmet, CORS sozlamasi
- `GET /api/health` — server va baza holati

---

## Tezkor ishga tushirish (Docker) — tavsiya etiladi

Talablar: **Docker 24+** va **Docker Compose v2**.

```bash
git clone <repo-url> DavomatQrCode
cd DavomatQrCode

docker compose up -d --build
```

Birinchi ishga tushirishda image’lar yig‘iladi (bir necha daqiqa). Backend ishga
tushganda **migratsiyalar avtomatik bajariladi** va standart admin yaratiladi.

| Xizmat        | Manzil                                  |
| ------------- | --------------------------------------- |
| Frontend      | http://localhost:8080                   |
| Backend API   | http://localhost:3001/api               |
| Swagger (API hujjati) | http://localhost:3001/api-docs  (yoki http://localhost:8080/api-docs) |
| PostgreSQL    | `localhost:5433` (konteyner ichida 5432) |

**Standart administrator:** login `admin01`, parol `admin01`
> Birinchi kirishdan so‘ng parolni **Profil** sahifasida albatta o‘zgartiring.

Foydali buyruqlar:

```bash
docker compose ps                 # konteynerlar holati
docker compose logs -f backend    # backend loglari
docker compose restart backend    # backendni qayta ishga tushirish
docker compose down               # to‘xtatish (ma’lumotlar saqlanadi)
docker compose down -v            # to‘xtatish va bazani butunlay o‘chirish
docker compose up -d --build      # kod o‘zgargandan so‘ng qayta yig‘ish
```

### Portlar va sozlamalar

`docker compose` loyiha ildizidagi `.env` faylidan quyidagi o‘zgaruvchilarni oladi
(berilmasa standart qiymat ishlatiladi):

| O‘zgaruvchi            | Standart                     | Izoh                                     |
| ---------------------- | ---------------------------- | ---------------------------------------- |
| `FRONTEND_PORT`        | `8080`                       | Frontend tashqi porti                    |
| `BACKEND_PORT`         | `3001`                       | Backend tashqi porti                     |
| `DB_PUBLIC_PORT`       | `5433`                       | PostgreSQL tashqi porti                  |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `postgres` / `123456` / `Attendence` | Baza                 |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `QR_CODE_SECRET` | — | JWT sirlari (**production’da albatta o‘zgartiring**) |
| `ACCESS_TOKEN_EXPIRY`  | `15m`                        | Access token muddati                     |
| `REFRESH_TOKEN_EXPIRY` | `7d`                         | Refresh token muddati                    |
| `QR_CODE_TTL`          | `300`                        | QR kod amal qilish muddati (soniya)      |
| `CORS_ORIGINS`         | `http://localhost:8080`      | Ruxsat etilgan frontend manzillari       |

Masalan, frontendni 80-portda ochish: `FRONTEND_PORT=80 docker compose up -d`.

> **Eslatma:** sirlarda `$` belgisini ishlatmang — Docker Compose uni o‘zgaruvchi deb tushunadi.

---

## Lokal ishlab chiqish (Docker’siz)

Talablar: **Node.js 20+** (22 tavsiya), **PostgreSQL 14+**.

### 1. Backend

```bash
# loyiha ildizida
cp .env.example .env        # kerak bo‘lsa DB_* qiymatlarini o‘zgartiring
npm install

# bazani yaratish (bir marta)
createdb -U postgres Attendence

npm run dev                 # http://localhost:3001/api, Swagger: /api-docs
```

`DB_MIGRATIONS_RUN=true` bo‘lsa migratsiyalar ilova ishga tushganda o‘zi bajariladi.
Qo‘lda boshqarish uchun:

```bash
npm run migration:run       # migratsiyalarni bajarish
npm run migration:revert    # oxirgi migratsiyani bekor qilish
npm run migration:generate  # entity o‘zgarganda yangi migratsiya yaratish
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

Vite dev server `/api` so‘rovlarini `http://localhost:3001` ga yo‘naltiradi.
Boshqa manzil kerak bo‘lsa `frontend/.env` faylida `VITE_PROXY_TARGET` ni o‘zgartiring.

Production build: `npm run build` → `frontend/dist`.

### Testlar

```bash
npm test          # backend unit testlari
npm run build     # TypeScript kompilyatsiyasi
```

---

## Ish jarayoni

1. **Admin** tizimga kiradi va **Tashkilotlar** bo‘limida tashkilot (owner) yaratadi.
2. **Owner** o‘z login-paroli bilan kiradi, **Xodimlar** bo‘limida xodimlarni qo‘shadi
   (yoki admin qo‘shadi).
3. **Xodim** ishga kelganda telefonidan kiradi va **“Ishga keldim”** tugmasini bosadi —
   ekranda QR kod chiqadi (standart: 5 daqiqa amal qiladi).
4. **Owner** **QR skaner** sahifasida kodni skanerlaydi — kelish vaqti qayd etiladi.
   Xodim ekranidagi QR avtomatik yopiladi va holat “Ishda”ga o‘zgaradi.
5. Ish tugagach xodim **“Ishdan ketyapman”** QR kodini ko‘rsatadi — ketish vaqti va
   ishlangan soat hisoblanadi.
6. Kelmagan xodimlarni owner **Bugungi davomat** sahifasida *sababli / sababsiz / ta’tilda*
   deb belgilaydi. Hisobotlar **Davomat tarixi** bo‘limida, CSV eksport bilan.

### Kamera haqida muhim eslatma

Brauzerlar kameraga faqat **xavfsiz kontekstda** ruxsat beradi: `https://...` yoki
`http://localhost`. Tizim lokal tarmoqda IP orqali (`http://192.168.x.x:8080`) ochilsa,
kamera ishlamaydi — bunday holda **Rasm** yoki **Matn** rejimidan foydalaning yoki
serverni HTTPS (masalan, Nginx + Let’s Encrypt, Caddy) orqali ishga tushiring.

---

## Loyiha tuzilmasi

```
.
├── config/                 # Swagger, ENV, QR dekoder
├── src/
│   ├── auth/               # login, refresh, profil, guardlar
│   ├── User/               # admin va owner uchun foydalanuvchi boshqaruvi
│   ├── Attendance/
│   │   ├── Owner/          # skanerlash, bugungi holat, statistika, eksport
│   │   └── User/           # QR yaratish, shaxsiy statistika
│   ├── QR/                 # QR rasm generatsiyasi
│   ├── common/             # dekoratorlar, yordamchi funksiyalar
│   └── migrations/         # TypeORM migratsiyalari (admin seed bilan)
├── types/                  # umumiy enum va tiplar
├── frontend/               # Vue 3 ilova
│   ├── src/views/admin     # admin sahifalari
│   ├── src/views/owner     # owner sahifalari
│   ├── src/views/user      # xodim sahifalari
│   ├── Dockerfile
│   └── nginx.conf
├── docs/API.md             # API qisqacha qo‘llanma
├── Dockerfile              # backend image
└── docker-compose.yml
```

API endpointlari ro‘yxati: [docs/API.md](docs/API.md) yoki Swagger (`/api-docs`).

---

## Muammolarni hal qilish

| Muammo | Yechim |
| ------ | ------ |
| `port is already allocated` | Portni o‘zgartiring: `FRONTEND_PORT=8081 BACKEND_PORT=3002 docker compose up -d` |
| Backend `unhealthy` | `docker compose logs backend` — odatda baza ulanishi yoki `.env` xatosi |
| Kamera ochilmaydi | `localhost` yoki HTTPS orqali oching; brauzerda kamera ruxsatini tekshiring |
| “QR kod yaroqsiz yoki muddati o‘tgan” | Xodim QR kodni yangilashi kerak (`QR_CODE_TTL` ni oshirish mumkin) |
| Vaqtlar noto‘g‘ri | `TZ` (standart `Asia/Tashkent`) backend va bazada bir xil bo‘lishi kerak |
| Bazani noldan boshlash | `docker compose down -v && docker compose up -d --build` |
