const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./backend/models/User'); // Replace with the correct path to your User model

mongoose.connect('mongodb://localhost:27017/DBC', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Database connection error:', err));

const hashPasswords = async () => {
    try {
        const users = await User.find({});
        for (const user of users) {
            if (!user.password.startsWith('$2b$')) { // Skip already hashed passwords
                user.password = await bcrypt.hash(user.password, 10);
                await user.save();
                console.log(`Password hashed for user: ${user.email}`);
            }
        }
        console.log('Password hashing complete.');
        mongoose.connection.close();
    } catch (err) {
        console.error('Error hashing passwords:', err);
        mongoose.connection.close();
    }
};

hashPasswords();
