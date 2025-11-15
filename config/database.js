const mongoose = require('mongoose');
// Yeh .env file se MONGO_URI variable load karta hai
require('dotenv').config(); 

const connectDB = async () => {
    try {
        // MONGO_URI ko process.env se uthaya
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Atlas Connected: ${conn.connection.host}`); // Connection successful message
    } catch (err) {
        console.error(`Error connecting to MongoDB: ${err.message}`);
        // Agar fail ho toh server band kar do
        process.exit(1); 
    }
};

module.exports = connectDB;