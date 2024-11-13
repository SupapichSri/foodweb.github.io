const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/FoodOrderingSystem');
        console.log('MongoDB connected');

        // Check if the specific admin user already exists
        const existingAdmin = await User.findOne({ email: 'admin@email.com' }); // Update this to the email you want to check

        if (existingAdmin) {
            // If the user exists but is not an admin, update their isAdmin status
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true; // Set the isAdmin flag
                await existingAdmin.save();
                console.log('Admin status updated for user:', existingAdmin.username);
            } else {
                console.log('Admin user already exists:', existingAdmin);
            }
        } else {
            // Create a new admin user if none exists
            const hashedPassword = await bcrypt.hash('adminpassword', 10); // Use a strong password
            const adminUser = new User({
                username: 'admin',
                email: 'admin@email.com', // Update to the email you want to use
                password: hashedPassword,
                isAdmin: true
            });

            await adminUser.save();
            console.log('Admin user created successfully');
        }
    } catch (error) {
        console.error('Error creating or updating admin user:', error);
    } finally {
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
        } catch (closeError) {
            console.error('Error closing MongoDB connection:', closeError);
        }
        // Removed process.exit(1) to keep the process alive if desired
    }
}

createAdmin();
