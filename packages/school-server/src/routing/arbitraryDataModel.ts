import config from "config";
import mongoose from "mongoose";

const arbitrarySchema = new mongoose.Schema({
  payload: mongoose.Schema.Types.Mixed
});

export const arbitraryModel = mongoose.model(config.get("mongodb.collectionName"), arbitrarySchema);
