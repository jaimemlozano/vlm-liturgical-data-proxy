/**
 * Vercel Serverless Function
 * This is your secure proxy.
 */
export default async (req, res) => {
  // 1. Get the file path from the URL.
  // e.g., if the app requests /api/data/en/version.json
  // the 'path' variable will be ['en', 'version.json']
  const { path } = req.query;
  const filePath = path.join('/');

  // 2. Get your secret GitHub Token (you will set this in Vercel's settings)
  const GITHUB_TOKEN = process.env.GITHUB_PAT;

  // 3. Set the URL to the correct repo's raw content
  const repoUrl = 'https://raw.githubusercontent.com/kiwidiwi/vlm-liturgical-data/main';

  // This is the full URL we will fetch from
  const fetchUrl = `${repoUrl}/${filePath}`;

  try {
    // 4. Securely fetch the file from your private repo
    const response = await fetch(fetchUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw', // Asks GitHub for the raw file
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch from GitHub: ${response.statusText}`);
    }

    // 5. Send the file's contents back to your app
    const data = await response.json();
    
    // Add a 1-hour cache to keep it fast
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: 'Failed to load data', details: error.message });
  }
};