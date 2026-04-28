import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    NODE_ENV: process.env.NODE_ENV,
    APP_URL: process.env.APP_URL,
    SHARED_APP_URL: process.env.SHARED_APP_URL,
    headers: req.headers,
    cwd: process.cwd(),
    env_keys: Object.keys(process.env).filter(k => !k.includes('KEY') && !k.includes('SECRET') && !k.includes('PASSWORD'))
  });
}
