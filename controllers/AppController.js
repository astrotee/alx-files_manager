import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const AppController = {
  getStatus(req, res) {
    res.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  },
  async getStats(_, res) {
    const [users, files] = await Promise.all([dbClient.nbUsers(), dbClient.nbFiles()]);
    res.status(200).json({ users, files });
  },
};

export default AppController;
