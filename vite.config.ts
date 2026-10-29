import { defineConfig, loadEnv } from 'vite';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

function getApiKey(): string {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/GEMINI_API_KEY=([^\r\n]+)/);
      if (match && match[1].trim() && match[1].trim() !== 'MY_GEMINI_API_KEY') {
        return match[1].trim();
      }
    }
  } catch (e) {
    // ignore
  }

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return process.env.GEMINI_API_KEY;
  }

  const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
  if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
    return env.GEMINI_API_KEY;
  }

  return '';
}

function getGenAI() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured or is a placeholder.');
  }
  return new GoogleGenAI({ apiKey });
}

async function parseStandingsWithGemini(base64Data: string, mimeType: string) {
  const ai = getGenAI();
  const prompt = `Extract the complete soccer league standings table from this screenshot.
Return ONLY a valid JSON array of objects with the exact keys:
- rank: number (e.g. 1, 2, ..., 18)
- team: string (exact team name)
- gp: number (Games Played)
- w: number (Wins)
- t: number (Ties/Draws)
- l: number (Losses)
- pts: number (Points)
- gf: number (Goals For)
- ga: number (Goals Against)
- gd: number (Goal Differential, signed integer like 7, 0, -1, -10)

Extract every single row accurately in table order. Do not skip any rows.
Output ONLY a raw JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
            { text: prompt }
          ]
        }
      ]
    });
    return response.text;
  } catch (err: any) {
    console.warn('gemini-3.1-flash-lite retry with gemini-3.8-flash:', err?.message);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Data } },
            { text: prompt }
          ]
        }
      ]
    });
    return response.text;
  }
}

function standingsApiMiddleware(req: any, res: any, next: any) {
  const url = req.url?.split('?')[0];
  if (url === '/api/parse-standings') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
      if (body.length > 25 * 1024 * 1024) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.destroy();
      }
    });

    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        let base64 = payload.imageBase64 || '';
        if (base64.includes('base64,')) {
          base64 = base64.split('base64,')[1];
        }
        const mimeType = payload.mimeType || 'image/jpeg';

        if (!base64) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: 'No image data provided' }));
          return;
        }

        const rawResult = await parseStandingsWithGemini(base64, mimeType);
        let cleanText = (rawResult || '').trim();
        if (cleanText.includes('```')) {
          const match = cleanText.match(/```(?:json)?([\s\S]*?)```/);
          if (match) cleanText = match[1].trim();
        }
        cleanText = cleanText.replace(/^[^{\[]*/, '').replace(/[^}\]]*$/, '').trim();

        let parsed: any = JSON.parse(cleanText);
        if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.standings)) parsed = parsed.standings;
          else if (Array.isArray(parsed.teams)) parsed = parsed.teams;
          else if (Array.isArray(parsed.data)) parsed = parsed.data;
          else if (Array.isArray(parsed.table)) parsed = parsed.table;
        }

        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('AI could not identify a valid table in this image.');
        }

        const standings = parsed.map((item: any, idx: number) => {
          const teamName = String(item.team || item.name || `Team ${idx + 1}`).trim();
          const gp = Number(item.gp ?? item.played ?? 0) || 0;
          const w = Number(item.w ?? item.wins ?? 0) || 0;
          const t = Number(item.t ?? item.ties ?? item.d ?? item.draws ?? 0) || 0;
          const l = Number(item.l ?? item.losses ?? 0) || 0;
          const gf = Number(item.gf ?? item.goalsFor ?? 0) || 0;
          const ga = Number(item.ga ?? item.goalsAgainst ?? 0) || 0;
          const gd = item.gd !== undefined ? Number(item.gd) : (gf - ga);
          const pts = item.pts !== undefined ? Number(item.pts) : ((w * 3) + t);
          const isUs = Boolean(teamName.toLowerCase().includes('rockies') || teamName.toLowerCase().includes('albion'));

          return {
            id: idx + 1,
            rank: item.rank || (idx + 1),
            name: teamName,
            team: teamName,
            gp, w, t, l, gf, ga, gd, pts, isUs
          };
        });

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, standings }));
      } catch (err: any) {
        console.error('Error parsing standings image:', err);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to parse standings image' }));
      }
    });
    return;
  }
  next();
}

export default defineConfig({
  base: './',
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {}
  },
  preview: {
    allowedHosts: true
  },
  plugins: [
    {
      name: 'standings-api',
      configureServer(server) {
        server.middlewares.use(standingsApiMiddleware);
      },
      configurePreviewServer(server) {
        server.middlewares.use(standingsApiMiddleware);
      }
    }
  ]
});
