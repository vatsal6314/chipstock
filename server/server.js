const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
      console.log('Connected to MongoDB successfully');
    } else {
      console.warn('⚠️ MONGODB_URI not set in environment. Running in unconfigured mode.');
    }

    app.listen(PORT, () => {
      console.log(`ChipStock server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
