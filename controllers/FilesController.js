import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const { ObjectId } = require('mongodb');

const FilesController = {
  async postUpload(req, res) {
    const token = req.header('X-Token');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const users = await dbClient.usersCollection();
    const user = await users.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const {
      name, type, parentId, isPublic, data,
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }
    const files = await dbClient.filesCollection();
    if (parentId) {
      const parent = await files.findOne({ _id: new ObjectId(parentId) });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const newFolder = await files.insertOne({
        userId: new ObjectId(userId),
        name,
        type,
        parentId: parentId ? new ObjectId(parentId) : 0,
      });
      return res.status(201).json({
        id: newFolder.insertedId,
        userId,
        name,
        type,
        parentId,
      });
    }
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const folderPath = FOLDER_PATH;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    const filePath = path.join(folderPath, uuidv4());
    const buff = Buffer.from(data, 'base64');
    fs.writeFileSync(filePath, buff);
    const newFile = await files.insertOne({
      userId: new ObjectId(userId),
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId ? new ObjectId(parentId) : 0,
      localPath: filePath,
    });
    return res.status(201).json({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId,
    });
  },
};

export default FilesController;
