require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Sample Products Data
const productsData = [
  {
    name: "Elden Ring",
    description: "An epic action RPG set in a vast, dark fantasy world created by Hidetaka Miyazaki and George R. R. Martin.",
    price: 59.99,
    stock: 120,
    category: "RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Elden+Ring"
  },
  {
    name: "Cyberpunk 2077",
    description: "An open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary.",
    price: 49.99,
    stock: 200,
    category: "RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Cyberpunk+2077"
  },
  {
    name: "EA SPORTS FC 24",
    description: "The next chapter in The World's Game featuring over 19,000 fully licensed players, 700 teams, and 30 leagues.",
    price: 69.99,
    stock: 300,
    category: "Sports",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=FC+24"
  },
  {
    name: "Call of Duty: Modern Warfare III",
    description: "In the direct sequel to the record-breaking MWII, Captain Price and Task Force 141 face off against the ultimate threat.",
    price: 69.99,
    stock: 250,
    category: "Shooter",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=MW+III"
  },
  {
    name: "Marvel's Spider-Man 2",
    description: "Spider-Men Peter Parker and Miles Morales return for an exciting new adventure in the critically acclaimed franchise.",
    price: 69.99,
    stock: 180,
    category: "Action",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Spider-Man+2"
  },
  {
    name: "The Legend of Zelda: Tears of the Kingdom",
    description: "An epic adventure across the land and skies of Hyrule awaits in this sequel to Breath of the Wild.",
    price: 69.99,
    stock: 140,
    category: "Adventure",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Zelda+TotK"
  },
  {
    name: "Grand Theft Auto V",
    description: "Experience the intertwining stories of Franklin, Michael, and Trevor in the sprawling city of Los Santos.",
    price: 29.99,
    stock: 500,
    category: "Action",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=GTA+V"
  },
  {
    name: "Red Dead Redemption 2",
    description: "An epic tale of life in America's unforgiving heartland, featuring a vast open world and deeply engaging story.",
    price: 39.99,
    stock: 220,
    category: "Action",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=RDR+2"
  },
  {
    name: "Super Mario Bros. Wonder",
    description: "Find wonder in the next evolution of Mario fun with classic side-scrolling gameplay and unpredictable twists.",
    price: 59.99,
    stock: 160,
    category: "Platformer",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Mario+Wonder"
  },
  {
    name: "God of War Ragnarök",
    description: "Join Kratos and Atreus on a mythic journey for answers before the prophesied battle that will end the world.",
    price: 59.99,
    stock: 130,
    category: "Action",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=GoW+Ragnarok"
  },
  {
    name: "Resident Evil 4 Remake",
    description: "Survival is just the beginning. Six years have passed since the biological disaster in Raccoon City.",
    price: 49.99,
    stock: 110,
    category: "Horror",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=RE+4"
  },
  {
    name: "Mortal Kombat 1",
    description: "Discover a reborn Mortal Kombat Universe created by the Fire God Liu Kang featuring a new fighting system and game modes.",
    price: 69.99,
    stock: 175,
    category: "Fighting",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=MK+1"
  },
  {
    name: "Baldur's Gate 3",
    description: "Gather your party and return to the Forgotten Realms in a tale of fellowship, betrayal, and the lure of absolute power.",
    price: 59.99,
    stock: 300,
    category: "RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=BG+3"
  },
  {
    name: "Halo Infinite",
    description: "When all hope is lost and humanity's fate hangs in the balance, the Master Chief is ready to confront the most ruthless foe he's ever faced.",
    price: 59.99,
    stock: 210,
    category: "Shooter",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Halo+Infinite"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    description: "You are Geralt of Rivia, mercenary monster slayer. Before you stands a war-torn, monster-infested continent you can explore at will.",
    price: 29.99,
    stock: 400,
    category: "RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Witcher+3"
  }
];

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB...");

    // 1. Clear only the old product data
    console.log("Clearing old products...");
    await Product.deleteMany({});

    // 2. Seed Video Game CDs
    console.log("Seeding video game CDs...");
    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Successfully added ${insertedProducts.length} video games.`);

    console.log("Database seeded successfully! 🎮");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
