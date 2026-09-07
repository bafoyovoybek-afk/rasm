// AI-Repetitor backend server
// Bu server frontend (index.html) o'rniga Anthropic API bilan gaplashadi,
// shunda API kalitingiz brauzerda emas, faqat serverda saqlanadi.

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Kerak bo'lsa domeningizga cheklang, pastdagi izohga qarang
// Rasmlar base64 shaklida keladi — shuning uchun limit oshirilgan
app.use(express.json({ limit: '25mb' }));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-6';

if (!ANTHROPIC_API_KEY) {
  console.error('XATOLIK: ANTHROPIC_API_KEY muhit o\'zgaruvchisi topilmadi!');
  console.error('Uni server ishga tushirishdan oldin o\'rnating (.env fayl yoki hosting sozlamalarida).');
}

// Ruxsat etilgan rasm turlari (Anthropic vision qo'llab-quvvatlaydigan formatlar)
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // rasm uchun ~5MB chegara

// Kelgan rasmlarni tekshirib, Anthropic formatidagi bloklarga aylantiradi
function buildImageBlocks(images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  if (images.length > MAX_IMAGES) {
    throw new Error(`Bir vaqtda maksimal ${MAX_IMAGES} ta rasm yuborish mumkin`);
  }

  return images.map((img, i) => {
    if (!img || typeof img !== 'object') {
      throw new Error(`${i + 1}-rasm formati noto'g'ri`);
    }

    let mediaType = img.media_type;
    let data = img.data;

    // "data:image/png;base64,AAAA..." shaklidagi qiymatni ham qabul qilamiz
    if (typeof data === 'string' && data.startsWith('data:')) {
      const match = /^data:([^;,]+);base64,(.*)$/s.exec(data);
      if (!match) throw new Error(`${i + 1}-rasm data URL formati noto'g'ri`);
      mediaType = mediaType || match[1];
      data = match[2];
    }

    if (typeof data !== 'string' || data.length === 0) {
      throw new Error(`${i + 1}-rasm ma'lumoti bo'sh`);
    }
    if (!ALLOWED_IMAGE_TYPES.includes(mediaType)) {
      throw new Error(`${i + 1}-rasm turi qo'llab-quvvatlanmaydi (faqat JPEG, PNG, GIF, WEBP)`);
    }
    // base64 hajmini taxminan baytga o'giramiz
    const approxBytes = Math.floor(data.length * 3 / 4);
    if (approxBytes > MAX_IMAGE_BYTES) {
      throw new Error(`${i + 1}-rasm juda katta (maksimal 5MB)`);
    }
    if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) {
      throw new Error(`${i + 1}-rasm base64 ma'lumoti buzilgan`);
    }

    return {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: data.replace(/\s/g, '') }
    };
  });
}

app.post('/api/chat', async (req, res) => {
  try {
    const { system, input, images } = req.body;
    const hasText = typeof input === 'string' && input.trim().length > 0;
    const hasImages = Array.isArray(images) && images.length > 0;

    // Rasm yuborilgan bo'lsa, matn majburiy emas
    if (!hasText && !hasImages) {
      return res.status(400).json({ error: { message: "'input' matni yoki 'images' rasmi kerak" } });
    }

    let imageBlocks;
    try {
      imageBlocks = buildImageBlocks(images);
    } catch (validationErr) {
      return res.status(400).json({ error: { message: validationErr.message } });
    }

    // Content bloklarini yig'amiz: rasmlar oldin, so'ng matn (Anthropic tavsiyasi)
    const content = [
      ...imageBlocks,
      { type: 'text', text: hasText ? input : 'Bu rasmni tahlil qilib, tushuntirib ber. Agar rasmda masala, savol yoki topshiriq bo\'lsa — uni yechib ber va bosqichlarni izohlab ber.' }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: system || '',
        messages: [{ role: 'user', content }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API xatosi:', data);
      return res.status(response.status).json({ error: data.error || { message: 'Anthropic API xatosi' } });
    }

    const textBlock = (data.content || []).find(c => c.type === 'text');
    return res.json({ text: textBlock ? textBlock.text : '' });

  } catch (err) {
    console.error('Server xatosi:', err);
    return res.status(500).json({ error: { message: err.message || 'Ichki server xatosi' } });
  }
});

// Frontend fayllarini xizmat qilish (index.html shu papkada bo'lsa)
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});
