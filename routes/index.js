import AppController from '../controllers/AppController';

export default function routes(app) {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
}
