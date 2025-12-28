const mongoose = require('mongoose');
const Product = require('./models/Product');
require('dotenv').config();

const productsData = [
    {
        id: 1,
        name: "Premium Health Mix",
        price: 199,
        originalPrice: 399,
        image: "/original_images/Health_mix_1.webp",
        category: "featured",
        rating: 4.8,
        reviews: 120,
        specs: ["100% Natural", "No Added Sugar", "Rich in Protein", "Immunity Booster"],
        description: "A perfect blend of natural ingredients to boost your daily health and immunity.",
        ingredients: ["Sprouted Ragi (Finger Millet)", "Bajra (Pearl Millet)", "Jowar (Sorghum)", "Green Gram", "Roasted Gram", "Almonds", "Cashews", "Cardamom"],
        uses: ["Mix 2 tablespoons with warm milk or water.", "Cook as a porridge for breakfast.", "Add to smoothies for extra protein.", "Use as a healthy substitute for flour in baking."]
    },
    {
        id: 2,
        name: "Organic Superfood",
        price: 199,
        originalPrice: 399,
        image: "/original_images/718yDOwTEML.jpg",
        category: "bestselling",
        rating: 4.9,
        reviews: 85,
        specs: ["Organic", "Gluten Free", "Non-GMO", "High Fiber"],
        description: "Experience the power of nature with our organic superfood mix.",
        ingredients: ["Spirulina", "Chlorella", "Wheatgrass", "Moringa", "Ashwagandha", "Stevia Extract"],
        uses: ["Blend into your morning smoothie.", "Stir into juice or water.", "Sprinkle over salads or yogurt.", "Mix into energy balls."]
    },
    {
        id: 3,
        name: "Vitality Powder",
        price: 199,
        originalPrice: 399,
        image: "/original_images/images (2).jpg",
        category: "featured",
        rating: 4.5,
        reviews: 50,
        specs: ["Vitamins A-Z", "Energy Boost", "Low Calorie"],
        description: "Stay energetic all day long with Vitality Powder.",
        ingredients: ["Beetroot Powder", "Ginseng Root", "Guarana Seed", "Vitamin B Complex", "Electrolytes"],
        uses: ["Drink as a pre-workout booster.", "Take mid-day to fight fatigue.", "Mix with iced tea.", "Add to post-workout shakes."]
    },
    {
        id: 4,
        name: "Nutri-Active Blend",
        price: 199,
        originalPrice: 399,
        image: "/original_images/Health_mix_1.webp",
        category: "bestselling",
        rating: 4.7,
        reviews: 200,
        specs: ["Probiotics", "Digestive Health", "Vegan"],
        description: "Optimal nutrition for active lifestyles.",
        ingredients: ["Pea Protein Isolate", "Flaxseed", "Chia Seeds", "Probiotic Culture Blend", "Digestive Enzymes"],
        uses: ["Shake with almond milk.", "Blend with frozen berries.", "Stir into oatmeal.", "Make protein pancakes."]
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shop');
        console.log('Connected to MongoDB for seeding');
        await Product.deleteMany({});
        await Product.insertMany(productsData);
        console.log('Successfully seeded database');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
