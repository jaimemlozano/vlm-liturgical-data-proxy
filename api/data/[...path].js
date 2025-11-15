/**
 * Vercel Serverless Function
 * This is your secure proxy.
 */
export default async (req, res) => {
  const startTime = Date.now();
  console.log('[API] Request received:', {
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // 1. Get the file path from the URL.
  // e.g., if the app requests /api/data/en/version.json
  // the 'path' variable will be ['en', 'version.json']
  let pathSegments = null;
  
  // Try to get path from query first (standard catch-all route behavior)
  if (req.query && req.query.path) {
    pathSegments = req.query.path;
    console.log('[API] Path from query:', pathSegments);
  }
  
  // If not in query, try to extract from URL
  if (!pathSegments && req.url) {
    try {
      const urlPath = req.url.replace('/api/data', '').split('?')[0];
      if (urlPath && urlPath !== '/') {
        pathSegments = urlPath.split('/').filter(Boolean);
        console.log('[API] Extracted path from URL:', pathSegments);
      }
    } catch (urlError) {
      console.error('[API] Error extracting path from URL:', urlError);
    }
  }
  
  // Normalize pathSegments to array
  if (pathSegments) {
    if (typeof pathSegments === 'string') {
      pathSegments = [pathSegments];
    } else if (!Array.isArray(pathSegments)) {
      pathSegments = [String(pathSegments)];
    }
  }

  // Validate pathSegments parameter - MUST be an array with at least one element
  if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
    console.error('[API] Invalid path parameter:', {
      pathSegments,
      query: req.query,
      url: req.url,
      queryType: typeof req.query,
      pathType: typeof pathSegments
    });
    return res.status(400).json({ 
      error: 'Invalid path parameter',
      details: `Path must be provided. Received query: ${JSON.stringify(req.query || {})}, URL: ${req.url || 'undefined'}`
    });
  }

  // Now safely join the path segments
  const filePath = pathSegments.join('/');
  console.log('[API] Constructed file path:', filePath);

  // 2. Get your secret GitHub Token (you will set this in Vercel's settings)
  const GITHUB_TOKEN = process.env.GITHUB_PAT;

  if (!GITHUB_TOKEN) {
    console.error('[API] Missing GITHUB_PAT environment variable');
    return res.status(500).json({ 
      error: 'Server configuration error',
      details: 'GitHub token not configured'
    });
  }

  // 3. Use GitHub API for private repo access (raw.githubusercontent.com doesn't support auth headers)
  const owner = 'kiwidiwi';
  const repo = 'vlm-liturgical-data';
  const branch = 'main';
  
  // GitHub API endpoint for getting file contents
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
  
  console.log('[API] Fetching from GitHub API:', apiUrl.replace(GITHUB_TOKEN, '***'));

  try {
    // 4. Securely fetch the file from your private repo using GitHub API
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw',
        'User-Agent': 'vlm-liturgical-data-proxy',
      },
    });

    console.log('[API] GitHub API response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] GitHub API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.substring(0, 200), // Log first 200 chars
      });
      
      if (response.status === 404) {
        return res.status(404).json({ 
          error: 'File not found',
          details: `File not found at path: ${filePath}`
        });
      } else if (response.status === 401 || response.status === 403) {
        return res.status(500).json({ 
          error: 'Authentication failed',
          details: 'Invalid or missing GitHub token'
        });
      }
      
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    // 5. Get the raw content (GitHub API with Accept: raw returns the file content directly)
    const responseText = await response.text();
    console.log('[API] Received response, length:', responseText.length);

    // Try to parse as JSON if it looks like JSON
    let data;
    let contentType = 'application/json';
    
    try {
      // Check if response looks like JSON (starts with { or [)
      const trimmed = responseText.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        data = JSON.parse(responseText);
        console.log('[API] Successfully parsed as JSON');
      } else {
        // Not JSON, return as text
        data = responseText;
        contentType = 'text/plain';
        console.log('[API] Response is not JSON, returning as text');
      }
    } catch (parseError) {
      // Parse failed, return as text
      data = responseText;
      contentType = 'text/plain';
      console.log('[API] JSON parse failed, returning as text:', parseError.message);
    }

    const duration = Date.now() - startTime;
    console.log('[API] Request completed successfully:', {
      filePath,
      duration: `${duration}ms`,
      contentType,
      dataSize: typeof data === 'string' ? data.length : JSON.stringify(data).length,
    });
    
    // Add a 1-hour cache to keep it fast
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.setHeader('Content-Type', contentType);
    res.status(200).json(data);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[API] Request failed:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
      filePath,
    });
    
    res.status(500).json({ 
      error: 'Failed to load data', 
      details: error.message 
    });
  }
};