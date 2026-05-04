// index.js
import 'dotenv/config';
import app from './src/index.js';

const PORT = process.env.SERVICE_PORT || 8000;

app.listen(PORT, () => {
  console.log(`Bastion Server running on port ${PORT}`);
})
