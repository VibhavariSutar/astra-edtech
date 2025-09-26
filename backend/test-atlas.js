import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔗 Testing MongoDB Atlas connection...');
console.log('Connection string:', process.env.MONGODB_URI ? 
  process.env.MONGODB_URI.replace(/:(.*)@/, ':****@') : 'Not found');

async function testConnection() {
  try {
    // Test basic MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Connected to MongoDB Atlas successfully!');
    console.log('📍 Host:', mongoose.connection.host);
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🚀 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // Test if we can perform operations
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Collections found:', collections.length);
    
    await mongoose.connection.close();
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error message:', error.message);
    
    // Helpful debugging info
    if (error.message.includes('auth failed')) {
      console.log('💡 Tip: Check your username and password');
    } else if (error.message.includes('getaddrinfo')) {
      console.log('💡 Tip: Check your cluster name in the connection string');
    } else if (error.message.includes('network')) {
      console.log('💡 Tip: Check your IP whitelist in Atlas');
    }
    
    process.exit(1);
  }
}

// Check if MONGODB_URI is set
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.log('💡 Make sure you have a .env file with MONGODB_URI');
  process.exit(1);
}

testConnection();