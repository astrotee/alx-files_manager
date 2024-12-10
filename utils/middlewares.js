import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

const { ObjectId } = require('mongodb');

export async function basicAuth(req, res, next) {
  const auth = req.header('Authorization');
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
  const creds = buff.toString('utf-8');
  const [email, password] = creds.split(':');
  if (!email || !password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const users = await dbClient.usersCollection();
  const user = await users.findOne({ email });
  if (!user || user.password !== sha1(password)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}

export async function authToken(req, res, next) {
  const token = req.header('X-Token');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const users = await dbClient.usersCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
}
