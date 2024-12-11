import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';

const { ObjectId } = require('mongodb');

const FilesController = {
  async postUpload(req, res) {
    const userId = req.user._id.toString();
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
    let parentObjId;
    if (parentId) {
      try {
        parentObjId = new ObjectId(parentId);
      } catch (error) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      const parent = await files.findOne({ _id: parentObjId });
      if (!parent) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parent.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    const fileInfo = {
      userId: new ObjectId(userId),
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId ? parentObjId : 0,
    };
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const folderPath = FOLDER_PATH;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    if (type !== 'folder') {
      const filePath = path.join(folderPath, uuidv4());
      const buff = Buffer.from(data, 'base64');
      fs.writeFileSync(filePath, buff);
      fileInfo.localPath = filePath;
    }
    const newFile = await files.insertOne(fileInfo);
    return res.status(201).json({
      id: newFile.insertedId,
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
    });
  },
  async getShow(req, res) {
    const userId = req.user._id;
    const { id } = req.params;
    let file;
    try {
      file = new ObjectId(id);
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
    const files = await dbClient.filesCollection();
    const fileFound = await files.findOne({ userId, _id: file });
    if (!fileFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    return res.status(200).json({
      id: fileFound._id,
      userId: fileFound.userId,
      name: fileFound.name,
      type: fileFound.type,
      isPublic: fileFound.isPublic,
      parentId: fileFound.parentId,
    });
  },
  async getIndex(req, res) {
    const userId = req.user._id;
    const page = req.query.page && parseInt(req.query.page, 10) ? parseInt(req.query.page, 10) : 0;
    const pid = req.query.parentId;
    let parentId;
    try {
      parentId = new ObjectId(pid);
    } catch (error) {
      parentId = 0;
    }
    const files = await dbClient.filesCollection();
    const filesFound = await files.aggregate([
      { $match: { userId, parentId: pid ? parentId : 0 } },
      { $sort: { name: 1 } },
      { $skip: page * 20 },
      { $limit: 20 },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: '$parentId',
        },
      },
    ]).toArray();
    return res.status(200).json(filesFound);
  },
  async putPublish(req, res) {
    const userId = req.user._id;
    const { id } = req.params;
    let file;
    try {
      file = new ObjectId(id);
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
    const files = await dbClient.filesCollection();
    const fileFound = await files.findOne({ userId, _id: file });
    if (!fileFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    await files.updateOne({ _id: file }, { $set: { isPublic: true } });
    return res.status(200).json({
      id: fileFound._id,
      userId: fileFound.userId,
      name: fileFound.name,
      type: fileFound.type,
      isPublic: true,
      parentId: fileFound.parentId,
    });
  },
  async putUnpublish(req, res) {
    const userId = req.user._id;
    const { id } = req.params;
    let file;
    try {
      file = new ObjectId(id);
    } catch (error) {
      return res.status(404).json({ error: 'Not found' });
    }
    const files = await dbClient.filesCollection();
    const fileFound = await files.findOne({ userId, _id: file });
    if (!fileFound) {
      return res.status(404).json({ error: 'Not found' });
    }
    await files.updateOne({ _id: file }, { $set: { isPublic: false } });
    return res.status(200).json({
      id: fileFound._id,
      userId: fileFound.userId,
      name: fileFound.name,
      type: fileFound.type,
      isPublic: false,
      parentId: fileFound.parentId,
    });
  },
};

export default FilesController;
