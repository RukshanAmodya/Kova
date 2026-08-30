export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const fileId = url.searchParams.get('id');
    if (!fileId) {
      return new Response("Error: Video ID is missing", { status: 400 });
    }

    // Use environment variable if set, otherwise fallback to hardcoded API key
    const API_KEY = env.GOOGLE_API_KEY || 'YOUR_API_KEY_HERE';

    if (API_KEY === 'YOUR_API_KEY_HERE') {
      return new Response("Error: Google Drive API Key is not configured in the worker.", { status: 500 });
    }

    // Google Drive API URL
    const driveUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;

    // Forward only range-related headers to Google Drive API (avoiding Host/Cookie mismatches)
    const headers = new Headers();
    if (request.headers.has('Range')) {
      headers.set('Range', request.headers.get('Range'));
    }
    if (request.headers.has('If-Range')) {
      headers.set('If-Range', request.headers.get('If-Range'));
    }

    const response = await fetch(driveUrl, { headers });
    const proxyResponse = new Response(response.body, response);

    // Delete Google specific headers to prevent exposing internal details
    proxyResponse.headers.delete('x-guploader-uploadid');
    proxyResponse.headers.delete('x-goog-hash');
    proxyResponse.headers.delete('x-goog-generation');
    proxyResponse.headers.delete('x-goog-metageneration');
    proxyResponse.headers.delete('x-goog-stored-content-encoding');
    proxyResponse.headers.delete('x-goog-stored-content-length');

    // Headers for streaming and CORS support
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*');
    proxyResponse.headers.set('Content-Disposition', 'inline; filename="video.mp4"');
    proxyResponse.headers.set('Content-Type', 'video/mp4');
    proxyResponse.headers.set('Cache-Control', 'public, max-age=3600');

    return proxyResponse;
  }
};
