const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

async function checkUsers() {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    console.log('Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');
    
    const users = await User.find({});
    console.log('Users found:', users.length);
    users.forEach(u => console.log(`- ${u.email} (${u.role})`));
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUsers();
