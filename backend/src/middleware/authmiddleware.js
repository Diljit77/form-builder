import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

export default function auth(req, res, next) {
  try {
   
    const header = req.headers.authorization || '';
 
    const token = header.startsWith('Bearer ') ? header.replace('Bearer ', '') : header;
    console.log('Extracted token:', token);
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.log('Auth middleware error:', err);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
