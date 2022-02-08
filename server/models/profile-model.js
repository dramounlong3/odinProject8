import mongoose from "mongoose";
import moment from "moment";

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  game_generation: {
    type: String,
    enum: ["1", "2", "3", "4", "5", "6", "7", "8", "mix"],
    required: true,
  },
  game_result: {
    type: String,
    enum: ["win", "lose", "draw", "undefined"],
    default: "undefined",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

const Profile = mongoose.model("Profile", profileSchema);
export { Profile };
