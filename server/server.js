const app = require('./app');
const connectDB = require('./db');

const PORT = process.env.PORT || 5001;

async function start() {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
      console.log('✅ Connected to MongoDB Atlas successfully');
    } else {
      global.isLocalMode = true;
      console.log('⚡ Running in Local File Store Mode (data/local-db.json). Ready out-of-the-box!');
      console.log('ℹ️  To connect to MongoDB Atlas, add MONGODB_URI in your .env file.');
    }

    app.listen(PORT, () => {
      console.log(`🚀 ChipStock server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
