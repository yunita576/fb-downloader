const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  // Set CORS agar frontend bisa mengakses API ini
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { url } = req.body;

  if (!url || (!url.includes('facebook.com') && !url.includes('fb.watch'))) {
    return res.status(400).json({ error: 'URL Facebook tidak valid!' });
  }

  try {
    // Fetch halaman Facebook dengan User-Agent agar tidak diblokir
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
      }
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let videoUrl = null;
    let imageUrl = null;
    let title = $('title').text() || 'Facebook Media';

    // Cari meta tag og:video (untuk video)
    const ogVideo = $('meta[property="og:video"]').attr('content') || 
                    $('meta[property="og:video:url"]').attr('content') ||
                    $('meta[property="og:video:secure_url"]').attr('content');

    // Cari meta tag og:image (untuk gambar)
    const ogImage = $('meta[property="og:image"]').attr('content') || 
                    $('meta[property="og:image:url"]').attr('content');

    if (ogVideo) {
      videoUrl = ogVideo;
    } else if (ogImage) {
      imageUrl = ogImage;
    } else {
      return res.status(404).json({ error: 'Video atau Gambar tidak ditemukan. Pastikan link bersifat publik.' });
    }

    return res.status(200).json({
      success: true,
      title: title,
      videoUrl: videoUrl,
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Gagal mengambil data. Facebook mungkin memblokir request ini atau post bersifat privat.' });
  }
};
