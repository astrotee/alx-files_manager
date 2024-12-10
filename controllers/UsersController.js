import sha1 from 'sha1';
import dbClient from '../utils/db';

const UsersController = {
  async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const users = await dbClient.usersCollection();
    if (await users.findOne({ email })) {
      return res.status(400).json({ error: 'Already exist' });
    }
    const user = await users.insertOne({
      email,
      password: sha1(password),
    });
    return res.status(201).json({ email, id: user.insertedId });
  },
  async getMe(req, res) {
    const { user } = req;
    return res.status(200).json({ id: user._id.toString(), email: user.email });
  },
};

export default UsersController;
