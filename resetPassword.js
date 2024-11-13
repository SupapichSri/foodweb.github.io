const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('./models/user'); // Adjust this path if needed

// Connect to MongoDB (use the same connection string as in app.js)
mongoose.connect('mongodb://localhost:27017/FoodOrderingSystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

async function resetPassword(email, newPassword) {
    try {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        // Update the user's password in the database
        const result = await User.updateOne({ email }, { password: hashedPassword });
        if (result.nModified === 0) {
            console.log(`No user found with email ${email}`);
        } else {
            console.log(`Password for ${email} has been reset to ${newPassword}`);
        }
    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        mongoose.connection.close(); // Close the database connection
    }
}

// Run the resetPassword function with your test email and new password
resetPassword("w@email.com", "test123").catch(console.error);
