import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(userId) {
  if (!JWT_SECRET) throw new Error('Missing JWT_SECRET in environment');
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}
