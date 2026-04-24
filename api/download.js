const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { url } = req.body;

  if (!url || (!url.includes('facebook.com') && !url.includes('fb.watch'))) {
    return res.status(400).json({ error: 'URL Facebook tidak valid!' });
  }

  try {
    // Kita berpura-pura menjadi HP Android yang membuka Chrome
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'sb=1234567890; datr=1234567890; c_user=1234567890;' // Cookie dummy agar FB tidak redirect ke login
    };

    const response = await axios.get(url, { headers, maxRedirects: 5 });
    const htmlData = response.data;

    let videoUrl = null;
    
    // Metode 1: Cari di dalam tag meta (Cara lama, kadang masih work)
    const ogVideoMatch = htmlData.match(/property="og:video:url"\s+content="([^"]+)"/);
    if (ogVideoMatch) videoUrl = ogVideoMatch[1].replace(/&amp;/g, '&');

    // Metode 2: Cari di dalam kode Javascript Facebook (Cara paling ampuh untuk HD/SD)
    if (!videoUrl) {
      // Mencari pola link video .mp4 yang dikompres Facebook
      const sdMatch = htmlData.match(/sd_src_no_ratelimit:"([^"]+)"/);
      const hdMatch = htmlData.match(/hd_src_no_ratelimit:"([^"]+)"/);
      
      if (hdMatch) videoUrl = hdMatch[1].replace(/&amp;/g, '&');
      else if (sdMatch) videoUrl = sdMatch[1].replace(/&amp;/g, '&');
    }

    // Metode 3: Regex alternatif jika struktur JS berubah
    if (!videoUrl) {
      const altMatch = htmlData.match(/"playable_url":"([^"]+)"/);
      if (altMatch) videoUrl = altMatch[1].replace(/\\u0025/g, '%');
    }

    if (videoUrl) {
      return res.status(200).json({
        success: true,
        title: 'Facebook Video',
        videoUrl: videoUrl,
        imageUrl: null
      });
    } else {
      return res.status(404).json({ 
        error: 'Gagal menemukan video. Pastikan ini adalah link VIDEO PUBLIK (bukan gambar, bukan story, dan bukan post privat).' 
      });
    }

  } catch (error) {
    console.error('Scraping Error:', error.message);
    return res.status(500).json({ 
      error: 'Server gagal mengambil data dari Facebook. Coba lagi beberapa saat.' 
    });
  }
};
