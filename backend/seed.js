require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Sample Products Data
const baseProductsData = [
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
  },
  {
    name: "Stardew Valley",
    description: "Build the farm of your dreams, befriend the local community, and explore mines in this cozy farming RPG.",
    price: 14.99,
    stock: 0,
    category: "Simulation",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Stardew+Valley"
  },
  {
    name: "NieR: Automata",
    description: "Androids 2B, 9S, and A2 fight to reclaim Earth in a stylish action RPG with a haunting story.",
    price: 39.99,
    stock: 145,
    category: "Action RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=NieR+Automata"
  },
  {
    name: "Dead by Daylight",
    description: "A multiplayer horror game where one killer hunts four survivors trying to escape a deadly trial.",
    price: 19.99,
    stock: 210,
    category: "Horror",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Dead+by+Daylight"
  },
  {
    name: "Titanfall 2",
    description: "A fast-paced sci-fi shooter featuring fluid pilot movement, giant Titans, and a cinematic campaign.",
    price: 24.99,
    stock: 95,
    category: "Shooter",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Titanfall+2"
  },
  {
    name: "Team Fortress 2",
    description: "A class-based team shooter with distinct characters, objective modes, and chaotic multiplayer battles.",
    price: 9.99,
    stock: 0,
    category: "Shooter",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Team+Fortress+2"
  },
  {
    name: "Drakengard",
    description: "A dark fantasy action game about a pact-bound warrior and dragon fighting through a brutal war.",
    price: 34.99,
    stock: 45,
    category: "Action RPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Drakengard"
  },
  {
    name: "Resident Evil 7: Biohazard",
    description: "A first-person survival horror experience set in a terrifying derelict plantation mansion.",
    price: 29.99,
    stock: 105,
    category: "Horror",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Resident+Evil+7"
  },
  {
    name: "Call of Duty: Black Ops III",
    description: "A futuristic Call of Duty entry with campaign, competitive multiplayer, and Zombies mode.",
    price: 39.99,
    stock: 165,
    category: "Shooter",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Black+Ops+III"
  },
  {
    name: "Persona 5",
    description: "Lead the Phantom Thieves through stylish turn-based battles and daily life in modern Tokyo.",
    price: 49.99,
    stock: 125,
    category: "JRPG",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=Persona+5"
  },
  {
    name: "For Honor",
    description: "A melee action game where knights, vikings, and samurai clash in tactical multiplayer combat.",
    price: 19.99,
    stock: 150,
    category: "Fighting",
    imageUrl: "https://dummyimage.com/400x400/000/fff&text=For+Honor"
  }
];

const demoProductMetadata = [
  {
    model: "PS5 Standard Edition",
    serialNumber: "GAME-ELDEN-PS5-001",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Bandai Namco Entertainment",
      contactEmail: "support@bandainamco.example",
      country: "Japan"
    },
    popularity: 98
  },
  {
    model: "PC Ultimate Edition",
    serialNumber: "GAME-CYBER-PC-002",
    warrantyStatus: "active",
    distributorInfo: {
      name: "CD Projekt",
      contactEmail: "support@cdprojekt.example",
      country: "Poland"
    },
    popularity: 89
  },
  {
    model: "PS5 Standard Edition",
    serialNumber: "GAME-FC24-PS5-003",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Electronic Arts",
      contactEmail: "support@ea.example",
      country: "United States"
    },
    popularity: 84
  },
  {
    model: "Xbox Series X Edition",
    serialNumber: "GAME-MWIII-XBX-004",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Activision",
      contactEmail: "support@activision.example",
      country: "United States"
    },
    popularity: 91
  },
  {
    model: "PS5 Launch Edition",
    serialNumber: "GAME-SPIDER2-PS5-005",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Sony Interactive Entertainment",
      contactEmail: "support@playstation.example",
      country: "United States"
    },
    popularity: 94
  },
  {
    model: "Nintendo Switch Physical Edition",
    serialNumber: "GAME-ZELDA-SW-006",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Nintendo",
      contactEmail: "support@nintendo.example",
      country: "Japan"
    },
    popularity: 97
  },
  {
    model: "PS5 Premium Edition",
    serialNumber: "GAME-GTAV-PS5-007",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Rockstar Games",
      contactEmail: "support@rockstar.example",
      country: "United States"
    },
    popularity: 92
  },
  {
    model: "Xbox Series X Edition",
    serialNumber: "GAME-RDR2-XBX-008",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Rockstar Games",
      contactEmail: "support@rockstar.example",
      country: "United States"
    },
    popularity: 88
  },
  {
    model: "Nintendo Switch Standard Edition",
    serialNumber: "GAME-MARIO-SW-009",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Nintendo",
      contactEmail: "support@nintendo.example",
      country: "Japan"
    },
    popularity: 86
  },
  {
    model: "PS5 Standard Edition",
    serialNumber: "GAME-GOWR-PS5-010",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Sony Interactive Entertainment",
      contactEmail: "support@playstation.example",
      country: "United States"
    },
    popularity: 90
  },
  {
    model: "PS5 Remake Edition",
    serialNumber: "GAME-RE4-PS5-011",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Capcom",
      contactEmail: "support@capcom.example",
      country: "Japan"
    },
    popularity: 82
  },
  {
    model: "PS5 Premium Edition",
    serialNumber: "GAME-MK1-PS5-012",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Warner Bros. Games",
      contactEmail: "support@wbgames.example",
      country: "United States"
    },
    popularity: 78
  },
  {
    model: "PC Deluxe Edition",
    serialNumber: "GAME-BG3-PC-013",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Larian Studios",
      contactEmail: "support@larian.example",
      country: "Belgium"
    },
    popularity: 96
  },
  {
    model: "Xbox Series X Edition",
    serialNumber: "GAME-HALO-XBX-014",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Xbox Game Studios",
      contactEmail: "support@xbox.example",
      country: "United States"
    },
    popularity: 74
  },
  {
    model: "PC Complete Edition",
    serialNumber: "GAME-WITCHER-PC-015",
    warrantyStatus: "expired",
    distributorInfo: {
      name: "CD Projekt",
      contactEmail: "support@cdprojekt.example",
      country: "Poland"
    },
    popularity: 87
  },
  {
    model: "Nintendo Switch Digital Code",
    serialNumber: "GAME-STARDEW-SW-016",
    warrantyStatus: "none",
    distributorInfo: {
      name: "ConcernedApe",
      contactEmail: "support@stardew.example",
      country: "United States"
    },
    popularity: 73
  },
  {
    model: "PS4 Game of the YoRHa Edition",
    serialNumber: "GAME-NIER-PS4-017",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Square Enix",
      contactEmail: "support@squareenix.example",
      country: "Japan"
    },
    popularity: 85
  },
  {
    model: "PC Standard Edition",
    serialNumber: "GAME-DBD-PC-018",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Behaviour Interactive",
      contactEmail: "support@bhvr.example",
      country: "Canada"
    },
    popularity: 80
  },
  {
    model: "Xbox One Standard Edition",
    serialNumber: "GAME-TF2-XBO-019",
    warrantyStatus: "expired",
    distributorInfo: {
      name: "Electronic Arts",
      contactEmail: "support@ea.example",
      country: "United States"
    },
    popularity: 83
  },
  {
    model: "PC Digital Code",
    serialNumber: "GAME-TF2-PC-020",
    warrantyStatus: "none",
    distributorInfo: {
      name: "Valve",
      contactEmail: "support@valvesoftware.example",
      country: "United States"
    },
    popularity: 79
  },
  {
    model: "PS2 Collector Edition",
    serialNumber: "GAME-DRAKENGARD-PS2-021",
    warrantyStatus: "expired",
    distributorInfo: {
      name: "Square Enix",
      contactEmail: "support@squareenix.example",
      country: "Japan"
    },
    popularity: 58
  },
  {
    model: "PS4 Gold Edition",
    serialNumber: "GAME-RE7-PS4-022",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Capcom",
      contactEmail: "support@capcom.example",
      country: "Japan"
    },
    popularity: 81
  },
  {
    model: "PS4 Zombies Chronicles Edition",
    serialNumber: "GAME-BO3-PS4-023",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Activision",
      contactEmail: "support@activision.example",
      country: "United States"
    },
    popularity: 77
  },
  {
    model: "PS4 Royal Edition",
    serialNumber: "GAME-PERSONA5-PS4-024",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Atlus",
      contactEmail: "support@atlus.example",
      country: "Japan"
    },
    popularity: 93
  },
  {
    model: "PS4 Standard Edition",
    serialNumber: "GAME-FORHONOR-PS4-025",
    warrantyStatus: "active",
    distributorInfo: {
      name: "Ubisoft",
      contactEmail: "support@ubisoft.example",
      country: "France"
    },
    popularity: 70
  }
];

const productsData = baseProductsData.map((product, index) => ({
  ...product,
  ...demoProductMetadata[index]
}));

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
