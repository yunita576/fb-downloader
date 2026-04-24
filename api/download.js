const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS
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
    // Menggunakan RapidAPI untuk mengambil data
    const options = {
      method: 'GET',
      url: 'https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main_download',
      params: {
        url: url,
        platform: 'facebook'
      },
      headers: {
        // PENTING: GANTI INI DENGAN KUNCI API ANDA DARI RAPIDAPI
        'X-RapidAPI-Key': '6eb874512fmshede2e929ee8df48p1e6f1ajsn917f381d654b',
        'X-RapidAPI-Host': 'facebook-reel-and-video-downloader.p.rapidapi.com'
      }
    };

    const response = await axios.request(options);
    const apiData = response.data;

    // Memastikan API mengembalikan link video
    if (apiData && apiData.versions && apiData.versions.length > 0) {
      // Mengambil kualitas video terbaik (biasanya index pertama)
      const videoUrl = apiData.versions[0].download_url;
      const title = apiData.title || 'Facebook Video';

      return res.status(200).json({
        success: true,
        title: title,
        videoUrl: videoUrl,
        imageUrl: null // API ini fokus pada video
      });
    } else {
      return res.status(404).json({ error: 'Video tidak ditemukan. Pastikan link valid dan publik.' });
    }

  } catch (error) {
    console.error(error.response ? error.response.data : error.message);
    return res.status(500).json({ error: 'Gagal mengambil data. Coba lagi nanti atau gunakan link berbeda.' });
  }
};
