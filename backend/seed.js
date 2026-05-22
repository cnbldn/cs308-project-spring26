require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Customer = require("./models/Customer");
const Comment = require("./models/Comment");
const Rating = require("./models/Rating");
const Order = require("./models/Order");
const Invoice = require("./models/Invoice");

// Sample Products Data
const baseProductsData = [
  {
    name: "Elden Ring",
    description: "An epic action RPG set in a vast, dark fantasy world created by Hidetaka Miyazaki and George R. R. Martin.",
    price: 59.99,
    stock: 120,
    category: "RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/b677845905ccd63299c86ae6bfcff423.jpg"
  },
  {
    name: "Cyberpunk 2077",
    description: "An open-world, action-adventure RPG set in the megalopolis of Night City, where you play as a cyberpunk mercenary.",
    price: 49.99,
    stock: 200,
    category: "RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/29bd8035bd874ae1c931ea77c60d4bee.jpg"
  },
  {
    name: "EA SPORTS FC 24",
    description: "The next chapter in The World's Game featuring over 19,000 fully licensed players, 700 teams, and 30 leagues.",
    price: 69.99,
    stock: 300,
    category: "Sports",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/24470f6dca8610bae3f10ad0aea40774.jpg"
  },
  {
    name: "Call of Duty: Modern Warfare III",
    description: "In the direct sequel to the record-breaking MWII, Captain Price and Task Force 141 face off against the ultimate threat.",
    price: 69.99,
    stock: 250,
    category: "Shooter",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/def4fb0d7b11c89e57dfb51d72d606be.jpg"
  },
  {
    name: "Marvel's Spider-Man 2",
    description: "Spider-Men Peter Parker and Miles Morales return for an exciting new adventure in the critically acclaimed franchise.",
    price: 69.99,
    stock: 180,
    category: "Action",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/3da4dbc271f500a4cb64dbf80bcd2047.jpg"
  },
  {
    name: "The Legend of Zelda: Tears of the Kingdom",
    description: "An epic adventure across the land and skies of Hyrule awaits in this sequel to Breath of the Wild.",
    price: 69.99,
    stock: 140,
    category: "Adventure",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/d376c4c8c82ee5467c7b642c3a54e2ed.jpg"
  },
  {
    name: "Grand Theft Auto V",
    description: "Experience the intertwining stories of Franklin, Michael, and Trevor in the sprawling city of Los Santos.",
    price: 29.99,
    stock: 500,
    category: "Action",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/6a38579399f89b6426961ef7aad5c77c.jpg"
  },
  {
    name: "Red Dead Redemption 2",
    description: "An epic tale of life in America's unforgiving heartland, featuring a vast open world and deeply engaging story.",
    price: 39.99,
    stock: 220,
    category: "Action",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/ec2fd5cc6ec44e485f9eaad4dd0257be.jpg"
  },
  {
    name: "Super Mario Bros. Wonder",
    description: "Find wonder in the next evolution of Mario fun with classic side-scrolling gameplay and unpredictable twists.",
    price: 59.99,
    stock: 160,
    category: "Platformer",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/f356bb58106a594ae677c4f661314e71.jpg"
  },
  {
    name: "God of War Ragnarök",
    description: "Join Kratos and Atreus on a mythic journey for answers before the prophesied battle that will end the world.",
    price: 59.99,
    stock: 130,
    category: "Action",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/f20d554d8b70ffc8b50bb8612e75bed9.jpg"
  },
  {
    name: "Resident Evil 4 Remake",
    description: "Survival is just the beginning. Six years have passed since the biological disaster in Raccoon City.",
    price: 49.99,
    stock: 110,
    category: "Horror",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/62a57cc70364d76148cd8e752f6f713b.jpg"
  },
  {
    name: "Mortal Kombat 1",
    description: "Discover a reborn Mortal Kombat Universe created by the Fire God Liu Kang featuring a new fighting system and game modes.",
    price: 69.99,
    stock: 175,
    category: "Fighting",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/7f7e3b7be9aec4420369732f864c0c22.jpg"
  },
  {
    name: "Baldur's Gate 3",
    description: "Gather your party and return to the Forgotten Realms in a tale of fellowship, betrayal, and the lure of absolute power.",
    price: 59.99,
    stock: 300,
    category: "RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/e757b7c33cf58073fad852b1ec15dc63.jpg"
  },
  {
    name: "Halo Infinite",
    description: "When all hope is lost and humanity's fate hangs in the balance, the Master Chief is ready to confront the most ruthless foe he's ever faced.",
    price: 59.99,
    stock: 210,
    category: "Shooter",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/e14a79a0a67da822e7445954ddf3e63d.jpg"
  },
  {
    name: "The Witcher 3: Wild Hunt",
    description: "You are Geralt of Rivia, mercenary monster slayer. Before you stands a war-torn, monster-infested continent you can explore at will.",
    price: 29.99,
    stock: 400,
    category: "RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/2d7a8c98d70915a09570c17593019540.jpg"
  },
  {
    name: "Stardew Valley",
    description: "Build the farm of your dreams, befriend the local community, and explore mines in this cozy farming RPG.",
    price: 14.99,
    stock: 0,
    category: "Simulation",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/6b9d9a2c8f76fb432bb302d7e7b723ff.jpg"
  },
  {
    name: "NieR: Automata",
    description: "Androids 2B, 9S, and A2 fight to reclaim Earth in a stylish action RPG with a haunting story.",
    price: 39.99,
    stock: 145,
    category: "Action RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/02d684e1ec5674d1f89f38d756b387e6.jpg"
  },
  {
    name: "Dead by Daylight",
    description: "A multiplayer horror game where one killer hunts four survivors trying to escape a deadly trial.",
    price: 19.99,
    stock: 210,
    category: "Horror",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/02711ba1051cbca7dd7acf4ca1dc3e01.jpg"
  },
  {
    name: "Titanfall 2",
    description: "A fast-paced sci-fi shooter featuring fluid pilot movement, giant Titans, and a cinematic campaign.",
    price: 24.99,
    stock: 95,
    category: "Shooter",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/1dac7e6380e320858f674a185f17ad70.jpg"
  },
  {
    name: "Team Fortress 2",
    description: "A class-based team shooter with distinct characters, objective modes, and chaotic multiplayer battles.",
    price: 9.99,
    stock: 0,
    category: "Shooter",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/8ea675904334dae3ac1070c37e876c19.jpg"
  },
  {
    name: "Drakengard",
    description: "A dark fantasy action game about a pact-bound warrior and dragon fighting through a brutal war.",
    price: 34.99,
    stock: 45,
    category: "Action RPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/7d3ebd3eafad8b7420088cef8e016b16.jpg"
  },
  {
    name: "Resident Evil 7: Biohazard",
    description: "A first-person survival horror experience set in a terrifying derelict plantation mansion.",
    price: 29.99,
    stock: 105,
    category: "Horror",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/f11e37f2d90955f10473e1cb2e45a346.jpg"
  },
  {
    name: "Call of Duty: Black Ops III",
    description: "A futuristic Call of Duty entry with campaign, competitive multiplayer, and Zombies mode.",
    price: 39.99,
    stock: 165,
    category: "Shooter",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/812759e3a5b93c8d3db0089c32a7e835.jpg"
  },
  {
    name: "Persona 5",
    description: "Lead the Phantom Thieves through stylish turn-based battles and daily life in modern Tokyo.",
    price: 49.99,
    stock: 125,
    category: "JRPG",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/a70af1b57993128d9b5c57a7cdd3dd41.jpg"
  },
  {
    name: "For Honor",
    description: "A melee action game where knights, vikings, and samurai clash in tactical multiplayer combat.",
    price: 19.99,
    stock: 150,
    category: "Fighting",
    imageUrl: "https://cdn2.steamgriddb.com/thumb/18d519f79841a7629faa656ab8262791.jpg"
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

const demoUsersData = [
  {
    name: "MertKaya91",
    email: "demo.customer1@example.com",
    password: "demo1234",
    role: "customer",
    taxId: "CUST-1001",
    homeAddress: "Sabanci University Dorms, Tuzla, Istanbul"
  },
  {
    name: "ZeynepPlays",
    email: "demo.customer2@example.com",
    password: "demo1234",
    role: "customer",
    taxId: "CUST-1002",
    homeAddress: "Orhanli Mah., Tuzla, Istanbul"
  },
  {
    name: "CanArcade",
    email: "demo.customer3@example.com",
    password: "demo1234",
    role: "customer",
    taxId: "CUST-1003",
    homeAddress: "Pendik Sahil, Istanbul"
  },
  {
    name: "Demo Product Manager",
    email: "demo.pm@example.com",
    password: "demo1234",
    role: "productManager",
    taxId: "PM-2001",
    homeAddress: "Campus Office, Tuzla, Istanbul"
  },
  {
    name: "Demo Sales Manager",
    email: "demo.sm@example.com",
    password: "demo1234",
    role: "salesManager",
    taxId: "SM-3001",
    homeAddress: "Admin Building, Tuzla, Istanbul"
  }
];

const demoUserEmails = demoUsersData.map((user) => user.email);

const buildOrderItem = (product, quantity) => ({
  product: product._id,
  name: product.name,
  model: product.model,
  serialNumber: product.serialNumber,
  quantity,
  unitPrice: product.price,
  lineTotal: Number((product.price * quantity).toFixed(2))
});

const sumLineTotals = (items) =>
  Number(items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2));

const approvedReviewTemplates = [
  (product) => `${product.name} grabbed me right away. The gameplay feels polished and I kept saying "one more hour" all week.`,
  (product) => `I was mainly curious about ${product.name}, but it ended up being one of the easiest games to recommend to friends.`,
  (product) => `${product.name} has a strong first impression and stays fun after a few sessions. Definitely worth keeping in the rotation.`,
  (product) => `Really happy with ${product.name}. It runs well, looks great, and the core loop is genuinely hard to put down.`,
  (product) => `${product.name} surprised me in a good way. I expected something decent and got a game I actually want to revisit.`
];

const pendingReviewTemplates = [
  (product) => `Still deciding how I feel about ${product.name}. There is a lot to like, but I want a few more hours before I settle on a final take.`,
  (product) => `Early impression of ${product.name}: fun mechanics so far, though I am not fully sold on every design choice yet.`,
  (product) => `I need more time with ${product.name}. Some parts clicked immediately, while others feel like they will grow on me later.`
];

const buildStatusHistory = (orderStatus, placedAt) => {
  const baseTime = new Date(placedAt);

  if (orderStatus === "delivered") {
    return [
      { status: "processing", changedAt: baseTime },
      { status: "in-transit", changedAt: new Date(baseTime.getTime() + 24 * 60 * 60 * 1000) },
      { status: "delivered", changedAt: new Date(baseTime.getTime() + 48 * 60 * 60 * 1000) }
    ];
  }

  if (orderStatus === "in-transit") {
    return [
      { status: "processing", changedAt: baseTime },
      { status: "in-transit", changedAt: new Date(baseTime.getTime() + 18 * 60 * 60 * 1000) }
    ];
  }

  return [{ status: "processing", changedAt: baseTime }];
};

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB...");

    // 1. Clear products and DB-8 demo support data.
    console.log("Clearing old products and demo support data...");
    await Promise.all([
      Product.deleteMany({}),
      Comment.deleteMany({}),
      Rating.deleteMany({}),
      Order.deleteMany({}),
      Invoice.deleteMany({}),
      Customer.deleteMany({ email: { $in: demoUserEmails } })
    ]);

    // 2. Seed products.
    console.log("Seeding video game products...");
    const insertedProducts = await Product.insertMany(productsData);
    console.log(`Successfully added ${insertedProducts.length} products.`);

    const productByName = new Map(
      insertedProducts.map((product) => [product.name, product])
    );

    // 3. Seed demo users.
    console.log("Seeding demo users...");
    const insertedUsers = await Customer.create(demoUsersData);
    const userByEmail = new Map(insertedUsers.map((user) => [user.email, user]));

    const customerOne = userByEmail.get("demo.customer1@example.com");
    const customerTwo = userByEmail.get("demo.customer2@example.com");
    const customerThree = userByEmail.get("demo.customer3@example.com");
    const productManager = userByEmail.get("demo.pm@example.com");
    const demoCustomers = [customerOne, customerTwo, customerThree];

    // 4. Seed ratings so every game has at least one, and many have two.
    console.log("Seeding ratings...");
    const ratingsData = insertedProducts.flatMap((product, index) => {
      const primaryCustomer = demoCustomers[index % demoCustomers.length];
      const primaryRating = {
        product: product._id,
        customer: primaryCustomer._id,
        value: 3 + (index % 3)
      };

      if (index % 2 === 0) {
        const secondaryCustomer = demoCustomers[(index + 1) % demoCustomers.length];
        return [
          primaryRating,
          {
            product: product._id,
            customer: secondaryCustomer._id,
            value: 4 + (index % 2)
          }
        ];
      }

      return [primaryRating];
    });
    await Rating.insertMany(ratingsData);

    // 5. Seed comments so every game has at least one approved comment.
    console.log("Seeding comments...");
    const commentsData = insertedProducts.flatMap((product, index) => {
      const approvedCustomer = demoCustomers[index % demoCustomers.length];
      const approvedComment = {
        product: product._id,
        customer: approvedCustomer._id,
        text: approvedReviewTemplates[index % approvedReviewTemplates.length](product),
        status: "approved",
        approvedBy: productManager._id,
        approvedAt: new Date(Date.UTC(2026, 3, 10 + (index % 10), 10, 0, 0))
      };

      if (index % 3 === 0) {
        const pendingCustomer = demoCustomers[(index + 1) % demoCustomers.length];
        return [
          approvedComment,
          {
            product: product._id,
            customer: pendingCustomer._id,
            text: pendingReviewTemplates[index % pendingReviewTemplates.length](product),
            status: "pending"
          }
        ];
      }

      return [approvedComment];
    });
    await Comment.insertMany(commentsData);

    // 6. Seed orders covering the full catalog in batches.
    console.log("Seeding orders...");
    const orderBatches = [];
    for (let index = 0; index < insertedProducts.length; index += 5) {
      orderBatches.push(insertedProducts.slice(index, index + 5));
    }

    const orderStatuses = ["delivered", "in-transit", "processing", "delivered", "in-transit"];
    const insertedOrders = await Order.insertMany(
      orderBatches.map((batch, index) => {
        const customer = demoCustomers[index % demoCustomers.length];
        const items = batch.map((product, itemIndex) =>
          buildOrderItem(product, (itemIndex % 2) + 1)
        );
        const subtotal = sumLineTotals(items);
        const placedAt = new Date(Date.UTC(2026, 3, 12 + index, 9, 0, 0));
        const orderStatus = orderStatuses[index % orderStatuses.length];

        return {
          customer: customer._id,
          items,
          subtotal,
          totalAmount: subtotal,
          paymentStatus: "paid",
          orderStatus,
          deliveryAddress: customer.homeAddress,
          mockPaymentReference: `MOCK-PAY-ORDER-${String(index + 1).padStart(3, "0")}`,
          statusHistory: buildStatusHistory(orderStatus, placedAt),
          placedAt
        };
      })
    );

    // 7. Seed invoices for all demo orders.
    console.log("Seeding invoices...");
    await Invoice.insertMany(
      insertedOrders.map((order, index) => {
        const customer = demoCustomers[index % demoCustomers.length];
        const issuedAt = new Date(order.placedAt.getTime() + 5 * 60 * 1000);

        return {
          invoiceNumber: `INV-2026-${String(index + 1).padStart(4, "0")}`,
          order: order._id,
          customer: customer._id,
          billingEmail: customer.email,
          billingAddress: customer.homeAddress,
          items: order.items,
          subtotal: order.subtotal,
          totalAmount: order.totalAmount,
          pdfUrl: `/mock/invoices/INV-2026-${String(index + 1).padStart(4, "0")}.pdf`,
          emailStatus: index % 2 === 0 ? "mock-sent" : "pending",
          issuedAt
        };
      })
    );

    console.log("Database seeded successfully with products, demo users, ratings, comments, orders, and invoices.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();
