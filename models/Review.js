import mongoose from 'mongoose';


const Schema = mongoose.Schema;

const reviewSchema = new Schema({
  reviewer: String,
  overallRating: Number,
  beerId: mongoose.Schema.Types.ObjectId
});

export default mongoose.model('Review', reviewSchema);