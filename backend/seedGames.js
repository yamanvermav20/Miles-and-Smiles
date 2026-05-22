import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

const gameSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String },
    minPlayers: { type: Number, default: 2 },
    maxPlayers: { type: Number, default: 2 },
    category: { type: String },
    isRanked: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { versionKey: false }
);

const Game = mongoose.model("Game", gameSchema, "games");

const games = [
  { 
    title: "Tic Tac Toe", 
    image: "/TicTacToe.jpg",
    description: "Classic game of X's and O's. Get three in a row to win!",
    minPlayers: 2,
    maxPlayers: 2,
    category: "strategy",
    isRanked: true,
  },
  { 
    title: "Memory", 
    image: "/Memory.jpg",
    description: "Match pairs of cards. Test your memory skills!",
    minPlayers: 2,
    maxPlayers: 4,
    category: "puzzle",
    isRanked: false,
  },
  { 
    title: "Snakes and Ladders", 
    image: "/SnakesLadders.jpg",
    description: "Race to the top! Climb ladders and avoid snakes.",
    minPlayers: 2,
    maxPlayers: 4,
    category: "casual",
    isRanked: false,
  },
  { 
    title: "Dots and Boxes", 
    image: "/DotsBoxes.jpg",
    description: "Connect dots to form boxes. Capture the most boxes to win!",
    minPlayers: 2,
    maxPlayers: 2,
    category: "strategy",
    isRanked: true,
  },
  { 
    title: "Chess", 
    image: "/Chess.jpg",
    description: "The ultimate game of strategy. Checkmate your opponent to win!",
    minPlayers: 2,
    maxPlayers: 2,
    category: "strategy",
    isRanked: true,
  },
];

mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ Connected to miles_and_smiles database");

    await Game.deleteMany({});
    await Game.insertMany(games);

    console.log("🎮 Games inserted successfully into 'games' collection!");
    console.log(`   Total games: ${games.length}`);
    console.log(`   Ranked games: ${games.filter(g => g.isRanked).length}`);
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error("❌ Error inserting data:", err);
  });