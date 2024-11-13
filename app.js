const express = require('express');
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');
const User = require('./models/user');
const Cart = require('./models/Cart'); // Import Cart model
const Order = require('./models/Order'); // Import Order model
const bcrypt = require('bcrypt');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');
const multer = require('multer'); // Import multer

const requireAuth = require('./middleware/requireAuth');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/FoodOrderingSystem')
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Set up Handlebars as the view engine with helpers
const hbs = exphbs.create({
    extname: '.hbs',
    helpers: {
        multiply: (a, b) => a * b,
        calculateTotal: function(cartItems) {
            let total = 0;
            for (let item of cartItems) {
                total += item.price * item.quantity;
            }
            return total.toFixed(2);
        },
        json: (context) => JSON.stringify(context), // Helper for JSON conversion
        eq: (a, b) => a === b // Add the equality helper here
    }
});
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve images from uploads folder
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
}));

// Configure multer to store images in an "uploads" directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Admin check middleware
async function checkAdmin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user || !user.isAdmin) {
            return res.status(403).send('Access denied');
        }
        next();
    } catch (err) {
        console.error('Error checking admin status:', err);
        return res.status(500).send('Server error');
    }
}

// Home route
app.get('/', async (req, res) => {
    try {
        const menuItems = await MenuItem.find().lean();
        
        // Fetch the current user from the database if they're logged in
        let isAdmin = false;
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);
            isAdmin = user ? user.isAdmin : false;
        }
        
        res.render('index', { 
            title: 'Food Ordering System', 
            menuItems, 
            userId: req.session.userId,
            username: req.session.username,
            isAdmin: isAdmin // Pass isAdmin to template
        });
    } catch (error) {
        console.error('Error fetching menu items:', error);
        res.status(500).send('Server error');
    }
});

// Registration page and submission
app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) return res.status(400).send('Email or username already in use');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });
        await user.save();
        res.redirect('/login');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).send('Error registering user');
    }
});

// Login page and submission
app.get('/login', (req, res) => res.render('login'));
// app.post('/login', async (req, res) => {
//     const { email, password } = req.body;
//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             console.log('User not found');
//             return res.status(401).send('Invalid email or password');
//         }

//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             console.log('Password does not match');
//             return res.status(401).send('Invalid email or password');
//         }

//         req.session.userId = user._id;
//         req.session.username = user.username;
//         req.session.isAdmin = user.isAdmin; // Storing admin status in session

//         if (user.isAdmin) {
//             return res.redirect('/admin/dashboard');
//         } else {
//             return res.redirect('/'); // Redirect to home for non-admins
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).send('Error logging in');
//     }
// });
// Login page testing getting invalid 
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log(`Attempting login for email: ${email}`);
        console.log(`Plain text password entered: ${password}`); // TEMP: Log plain password

        // Step 1: Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return res.status(401).send('Invalid email or password');
        }

        console.log('User found:', user); // Logs the user details
        console.log(`Stored hashed password: ${user.password}`); // TEMP: Log hashed password

        // Step 2: Perform a direct comparison (for debugging purposes only)
        if (password === user.password) {
            console.log('Direct string comparison matches (WARNING: Plain-text match, not secure)');
        } else {
            console.log('Direct string comparison does not match');
        }

        // Step 3: Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            console.log('Password does not match (bcrypt compare)'); // Log for debugging
            return res.status(401).send('Invalid email or password');
        }

        console.log('Password matches. Login successful.'); // Log successful login

        // Set session variables
        req.session.userId = user._id;
        req.session.username = user.username;
        req.session.isAdmin = user.isAdmin;

        if (user.isAdmin) {
            return res.redirect('/admin/dashboard');
        } else {
            return res.redirect('/');
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error logging in');
    }
});


// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Admin dashboard route
app.get('/admin/dashboard', checkAdmin, async (req, res) => {
    try {
        const orders = await Order.find().lean(); // Fetch all orders
        res.render('adminDashboard', { title: 'Admin Dashboard', username: req.session.username, orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
});

app.get('/cart', requireAuth, async (req, res) => {  // <== requireAuth applied
    const cartItems = await Cart.find({ userId: req.session.userId }).lean();
    res.json(cartItems);
});

// Admin route to view order details
app.get('/admin/orders/:orderId', checkAdmin, async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).send('Order not found');

        res.render('adminOrderDetails', { order, title: 'Order Details' });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Error fetching order details');
    }
});

// Admin route to get all orders
app.get('/admin/orders', checkAdmin, async (req, res) => {
    try {
        const orders = await Order.find().lean();
        res.render('adminOrders', { orders, title: 'Manage Orders' });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
});

// Update order status route
app.post('/admin/update-order-status/:orderId', checkAdmin, async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body; // Expected status can be 'Processing' or 'Delivering'
    
    try {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: status });
        res.redirect('/admin/orders'); // Redirect back to the orders page
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Error updating order status');
    }
});

// Route to view order status for customers
app.get('/order-status', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    try {
        const orders = await Order.find({ userId: req.session.userId }).lean();
        res.render('orderStatus', { orders, title: 'Your Order Status' });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).send('Error fetching order status');
    }
});

// Route to view order details for customers
app.get('/order-status/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).send('Order not found');

        res.render('orderDetails', { order, title: 'Order Details' });
    } catch (error) {
        console.error('Error fetching order status:', error);
        res.status(500).send('Error fetching order status');
    }
});

// Route to add item to cart
app.post('/add-to-cart', async (req, res) => {
    if (!req.session.userId) return res.status(401).send('Please log in first.');

    const { itemId, quantity, options } = req.body;
    try {
        const menuItem = await MenuItem.findById(itemId);
        const existingCartItem = await Cart.findOne({ userId: req.session.userId, itemId: menuItem._id });

        if (existingCartItem) {
            existingCartItem.quantity += parseInt(quantity, 10);
            existingCartItem.options = options;
            await existingCartItem.save();
            return res.status(200).send('Item quantity updated in cart');
        } else {
            const cartItem = new Cart({
                userId: req.session.userId,
                itemId: menuItem._id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: quantity,
                options: options
            });
            await cartItem.save();
            res.status(200).send('Item added to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        res.status(500).send(`Error adding to cart: ${error.message}`);
    }
});

// Route to view cart
app.get('/cart', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    try {
        const cartItems = await Cart.find({ userId: req.session.userId }).lean();
        res.json(cartItems);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Error fetching cart items');
    }
});

// Route to the checkout page
app.get('/checkout', async (req, res) => {
    if (!req.session.userId) return res.redirect('/login');

    try {
        const cartItems = await Cart.find({ userId: req.session.userId }).lean();
        res.render('checkout', { cartItems, title: 'Checkout' });
    } catch (error) {
        console.error('Error fetching cart items for checkout:', error);
        res.status(500).send('Error loading checkout page');
    }
});

// Submit order with receipt image and clear cart
// app.post('/submit-order', upload.single('receiptImage'), async (req, res) => {
//     const { name, address, phone, paymentMethod, qrCodePayment } = req.body;
    
//     try {
//         const cartItems = await Cart.find({ userId: req.session.userId }).lean();

//         if (cartItems.length === 0) {
//             return res.status(400).send("Your cart is empty.");
//         }

//         const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

//         const newOrder = new Order({
//             userId: req.session.userId,
//             items: cartItems.map(item => ({
//                 name: item.name,
//                 price: item.price,
//                 quantity: item.quantity,
//                 options: item.options,
//                 image: item.image
//             })),
//             totalAmount,
//             customerName: name,
//             customerAddress: address,
//             customerPhone: phone,
//             paymentMethod,
//             qrCodePayment: qrCodePayment === 'true', // Convert to boolean
//             receiptImage: req.file ? req.file.path : null,
//             paymentStatus: 'Pending' // Set status as pending for verification
//         });

//         await newOrder.save();
//         await Cart.deleteMany({ userId: req.session.userId });

//         // Return JSON response with the order ID
//         res.json({ message: 'Order confirmed! Thank you for your purchase.', orderId: newOrder._id });
//     } catch (error) {
//         console.error('Error submitting order:', error);
//         res.status(500).send('Error processing order');
//     }
// });

// Submit order with receipt image and clear cart
app.post('/submit-order', upload.single('receiptImage'), async (req, res) => {
    const { name, address, phone, paymentMethod, qrCodePayment } = req.body;

    try {
        const cartItems = await Cart.find({ userId: req.session.userId }).lean();

        if (cartItems.length === 0) {
            return res.status(400).send("Your cart is empty.");
        }

        const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

        const newOrder = new Order({
            userId: req.session.userId,
            items: cartItems.map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                options: item.options,
                image: item.image
            })),
            totalAmount,
            customerName: name,
            customerAddress: address,
            customerPhone: phone,
            paymentMethod,
            qrCodePayment: qrCodePayment === 'true',
            receiptImage: req.file ? req.file.path : null,
            paymentStatus: 'Pending'
        });

        await newOrder.save();
        await Cart.deleteMany({ userId: req.session.userId });

        // Render the confirmation page
        res.render('orderConfirmation', { title: 'Order Confirmation', orderId: newOrder._id, totalAmount });
    } catch (error) {
        console.error('Error submitting order:', error);
        res.status(500).send('Error processing order');
    }
});


// Admin route to get pending orders
app.get('/admin/pending-orders', checkAdmin, async (req, res) => {
    try {
        const pendingOrders = await Order.find({ paymentStatus: 'Pending' }).lean();
        res.render('pendingOrders', { pendingOrders, title: 'Pending Orders' });
    } catch (error) {
        console.error('Error fetching pending orders:', error);
        res.status(500).send('Server error');
    }
});

// Admin route to verify payment
app.post('/admin/verify-payment/:orderId', checkAdmin, async (req, res) => {
    const { orderId } = req.params;
    try {
        await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Success', paymentVerified: true });
        res.send('Payment verified and order is in progress');
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).send('Error verifying payment');
    }
});

// Admin route to manage orders
app.get('/admin/orders', checkAdmin, async (req, res) => {
    try {
        const orders = await Order.find().lean(); // Fetch all orders
        res.render('adminOrders', { orders, title: 'Manage Orders' }); // Render the orders view
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Server error');
    }
});

// Admin route to view order details
app.get('/admin/orders/:orderId', checkAdmin, async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).send('Order not found');

        res.render('adminOrderDetails', { order, title: 'Order Details' });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Error fetching order details');
    }
});

// Update cart item quantity
app.post('/update-cart', async (req, res) => {
    if (!req.session.userId) return res.status(401).send('Please log in first.');

    const { itemId, quantity } = req.body;
    try {
        const cartItem = await Cart.findById(itemId);
        if (!cartItem) return res.status(404).send('Cart item not found');

        cartItem.quantity = parseInt(quantity, 10);
        await cartItem.save();
        res.status(200).send('Cart item updated successfully');
    } catch (error) {
        console.error(`Error updating cart item:`, error);
        res.status(500).send('Error updating cart item');
    }
});

// Remove item from cart
app.post('/remove-from-cart', async (req, res) => {
    if (!req.session.userId) return res.status(401).send('Please log in first.');

    const { itemId } = req.body;
    try {
        await Cart.findByIdAndDelete(itemId);
        res.status(200).send('Item removed from cart');
    } catch (error) {
        console.error('Error removing cart item:', error);
        res.status(500).send('Error removing cart item');
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
