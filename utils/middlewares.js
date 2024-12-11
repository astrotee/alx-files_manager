import { getUserBasicAuth, getUserXAuthToken } from './auth';

export async function basicAuth(req, res, next) {
  const user = await getUserBasicAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}

export async function authToken(req, res, next) {
  const user = await getUserXAuthToken(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}
