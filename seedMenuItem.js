const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

mongoose.connect('mongodb://localhost:27017/FoodOrderingSystem')
    .then(async () => {
        console.log('MongoDB connected for seeding');

        // Clear the existing collection
        await MenuItem.deleteMany({});
        console.log('Cleared existing menu items');

        // Define sample data
        const menuItems = [
            { 
                name: 'Burger', 
                price: 5.99, 
                description: 'Juicy beef burger with lettuce, tomato, and cheese', 
                image: 'https://cdn.pixabay.com/photo/2022/08/31/10/17/burger-7422970_640.jpg' 
            },
            { 
                name: 'Pizza', 
                price: 8.99, 
                description: 'Cheesy pizza with tomato sauce and pepperoni', 
                image: 'https://againstthegraingourmet.com/cdn/shop/products/Pepperoni_Pizza_Beauty_1200x1200.jpg?v=1658703726' 
            },
            { 
                name: 'Pasta', 
                price: 7.99, 
                description: 'Pasta with a rich tomato and basil sauce', 
                image: 'https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_1:1/k%2FPhoto%2FRecipes%2F2023-01-Caramelized-Tomato-Paste-Pasta%2F06-CARAMELIZED-TOMATO-PASTE-PASTA-039' 
            },
            { 
                name: 'Steak', 
                price: 12.99, 
                description: 'Grilled steak served with sides', 
                image: 'https://www.seriouseats.com/thmb/-KA2hwMofR2okTRndfsKtapFG4Q=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/__opt__aboutcom__coeus__resources__content_migration__serious_eats__seriouseats.com__recipes__images__2015__05__Anova-Steak-Guide-Sous-Vide-Photos15-beauty-159b7038c56a4e7685b57f478ca3e4c8.jpg',
                options: ['Rare', 'Medium-Rare', 'Medium', 'Well-Done'] // Customization options for steak
            }
        ];

        // Insert new data
        await MenuItem.insertMany(menuItems);
        console.log('Data inserted');
    })
    .catch(err => console.error('Connection error', err))
    .finally(() => mongoose.connection.close());
