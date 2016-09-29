import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  reviewer: String,
  overallRating: Number
});

export default mongoose.model('Review', reviewSchema);