import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const beerSchema = new Schema({
  name: String,
  brewery: String,
  submitter: String,
  description: String,
  reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'Review'}]
}, {
  toJSON: {virtuals: true}
});

beerSchema.virtual('rating').get(function () {
  const total = this.reviews.map((review) => review.overallRating).reduce((a,b) => a + b, 0);
  return total / this.reviews.length;
});


export default mongoose.model('Beer', beerSchema);