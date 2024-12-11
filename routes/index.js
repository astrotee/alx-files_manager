import AppController from '../controllers/AppController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import UsersController from '../controllers/UsersController';
import { basicAuth, authToken } from '../utils/middlewares';

export default function routes(app) {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);

  app.get('/connect', basicAuth, AuthController.getConnect);
  app.get('/disconnect', authToken, AuthController.getDisconnect);

  app.post('/users', UsersController.postNew);
  app.get('/users/me', authToken, UsersController.getMe);

  app.post('/files', authToken, FilesController.postUpload);
  app.get('/files/:id', authToken, FilesController.getShow);
  app.get('/files', authToken, FilesController.getIndex);
  app.put('/files/:id/publish', authToken, FilesController.putPublish);
  app.put('/files/:id/unpublish', authToken, FilesController.putUnpublish);
}
