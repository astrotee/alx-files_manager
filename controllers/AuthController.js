import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';

const AuthController = {
  async getConnect(req, res) {
    const { user } = req;
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
    return res.status(200).send({ token });
  },
  async getDisconnect(req, res) {
    const token = req.header('X-Token');
    const key = `auth_${token}`;
    await redisClient.del(key);
    return res.status(204).send();
  },
};

export default AuthController;
