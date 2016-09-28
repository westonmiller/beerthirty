import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  reviewer: String,
  overallRating: Number
});

module.exports = mongoose.model('Review', reviewSchema);