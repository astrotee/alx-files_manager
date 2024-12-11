import sha1 from 'sha1';
import redisClient from './redis';
import dbClient from './db';

const { ObjectId } = require('mongodb');

export async function getUserBasicAuth(req) {
  const auth = req.header('Authorization');
  if (!auth) {
    return null;
  }
  const buff = Buffer.from(auth.replace('Basic ', ''), 'base64');
  const creds = buff.toString('utf-8');
  const [email, password] = creds.split(':');
  if (!email || !password) {
    return null;
  }
  const users = await dbClient.usersCollection();
  const user = await users.findOne({ email });
  if (!user || user.password !== sha1(password)) {
    return null;
  }
  return user;
}

export async function getUserXAuthToken(req) {
  const token = req.header('X-Token');
  if (!token) {
    return null;
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return null;
  }
  const users = await dbClient.usersCollection();
  const user = await users.findOne({ _id: new ObjectId(userId) });
  return user;
}
