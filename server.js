import express from 'express';
import routes from './routes';

const app = express();
app.use(express.json());
routes(app);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
