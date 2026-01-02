import mongoose from 'mongoose';
import 'dotenv/config';

async function checkHealth() {
  try {
    // Vérifier la connexion MongoDB
    const state = mongoose.connection.readyState;
    
    if (state !== 1) {
      console.error('MongoDB non connecté');
      process.exit(1);
    }
    
    console.log('Health check OK');
    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

// Connexion et vérification
mongoose.connect(process.env.MONGODB_URI)
  .then(checkHealth)
  .catch(() => process.exit(1));

// Timeout
setTimeout(() => {
  console.error('Health check timeout');
  process.exit(1);
}, 10000);
