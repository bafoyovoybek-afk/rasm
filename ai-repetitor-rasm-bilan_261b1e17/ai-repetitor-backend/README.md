# AI-Repetitor — Backend bilan ishga tushirish

Bu papkada saytingizni **to'liq mustaqil holda** (Claude.ai tashqarisida) ishlatish uchun kerak bo'lgan hamma narsa bor.

## Tuzilishi
```
backend/
  server.js          ← Anthropic API bilan gaplashadigan server
  package.json       ← kerakli kutubxonalar
  .env.example        ← API kalitini yozish namunasi
  public/
    index.html        ← saytingiz (frontend)
```

## 1-qadam: API kalit oling
1. https://console.anthropic.com ga kiring
2. "API Keys" bo'limidan yangi kalit yarating
3. Kalitni nusxalab oling (sk-ant- bilan boshlanadi)

## 2-qadam: Kompyuteringizda sinab ko'rish

```bash
cd backend
npm install
cp .env.example .env
# .env faylni oching va ANTHROPIC_API_KEY qatoriga o'z kalitingizni qo'ying
npm start
```

So'ng brauzerda `http://localhost:3000` manzilini oching — sayt ochiladi va AI-chat ishlaydi.

## 3-qadam: Internetga joylashtirish (deploy)

Serverni bepul joylashtirish uchun quyidagilardan birini tanlang:

### Railway.app (eng oson)
1. https://railway.app ga GitHub orqali kiring
2. "New Project" → "Deploy from GitHub repo" (avval bu papkani GitHub'ga yuklang)
3. "Variables" bo'limida `ANTHROPIC_API_KEY` ni qo'shing
4. Railway avtomatik joylashtiradi va sizga havola beradi

### Render.com
1. https://render.com da "New Web Service" yarating
2. GitHub repo'ni ulang
3. Build command: `npm install`, Start command: `npm start`
4. "Environment" bo'limida `ANTHROPIC_API_KEY` ni qo'shing

### O'zingizning VPS/serveringiz
```bash
npm install -g pm2
cd backend
npm install
ANTHROPIC_API_KEY=sk-ant-... pm2 start server.js --name ai-repetitor
```

## 📷 Rasm yuborish (Vision)

Sayt endi rasmni **o'qib tushunadi**. O'quvchi masalani daftardan yoki kitobdan rasmga olib yuborsa, AI uni yechib beradi.

### Foydalanish
Suhbat sahifasidagi yozish maydonida ikkita yangi tugma bor:
- **🖼 Rasm yuklash** — telefon/kompyuterdan rasm tanlash (bir vaqtda 5 tagacha)
- **📷 Kameradan rasmga olish** — kamerani ochib to'g'ridan-to'g'ri surat olish
- **Ctrl+V** — clipboard'dagi rasmni to'g'ridan-to'g'ri joylash (screenshot uchun qulay)

Rasm yuborishdan oldin kichik ko'rinishda chiqadi, ×  tugmasi bilan o'chirish mumkin. Matn yozish shart emas — faqat rasm ham yuborilsa, AI uni o'zi tahlil qiladi. Chatdagi rasmni bosib kattalashtirib ko'rish mumkin.

### AI rasm bilan nima qiladi
- Masala/savolni o'qib **bosqichma-bosqich yechib beradi**
- Daftar, kitob, doskadagi **matnni o'qiydi** va tushuntiradi
- Grafik, diagramma, jadval va chizmalarni izohlaydi
- O'quvchining yechimini tekshirib **xatolarini ko'rsatadi**
- Rasm o'qilmasa, buni aytadi va yaxshiroq surat so'raydi

### Texnik jihatlari
- Qo'llab-quvvatlanadigan formatlar: **JPG, PNG, GIF, WEBP**
- Rasm brauzerda **avtomatik siqiladi** (maksimal 1400px) — internet trafigi va API xarajati tejaladi
- Bir xabarda maksimal **5 ta rasm**, har biri 10MB gacha
- Server tomonda ham format, hajm va base64 tekshiruvi bor (`server.js` → `buildImageBlocks`)
- Rasmlar hech qayerda saqlanmaydi — faqat so'rov ichida AI ga uzatiladi

> **Kamera haqida muhim:** brauzerlar kameraga faqat **HTTPS** saytlarda (yoki `localhost`da) ruxsat beradi. Saytni oddiy `http://` da joylasangiz, kamera tugmasi xato beradi — "Rasm yuklash" esa baribir ishlaydi. Railway va Render HTTPS ni avtomatik beradi.

## Muhim eslatmalar
- **API kalitingizni hech qachon** `index.html` yoki GitHub'ga ochiq holda joylamang — u faqat serverdagi `.env` faylida yoki hosting sozlamalarida bo'lishi kerak.
- Agar frontend va backend turli domenlarda bo'lsa (masalan sayt `mysite.com`da, server `api.mysite.com`da), `index.html` faylidagi `BACKEND_URL` qatorini to'liq manzilga o'zgartiring:
  ```js
  const BACKEND_URL = 'https://api.mysite.com/api/chat';
  ```
- `server.js` ichidagi `cors()` — hozircha barcha domenlarga ruxsat beradi. Xavfsizlik uchun productionda uni faqat o'z domeningizga cheklashingiz mumkin:
  ```js
  app.use(cors({ origin: 'https://mysite.com' }));
  ```
- Rasmlar base64 shaklida kelgani uchun `express.json({ limit: '25mb' })` qilib qo'yilgan. Agar hosting o'zining so'rov hajmi chegarasi bo'lsa (masalan Nginx `client_max_body_size`), uni ham oshirish kerak bo'lishi mumkin.
