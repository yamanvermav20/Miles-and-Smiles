import mongoose from "mongoose";

const { Schema, model } = mongoose;

const gameSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
  },
  { versionKey: false }
);

const Game = model("Game", gameSchema);

export default Game;

