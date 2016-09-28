import express from 'express';
import mongoose from 'mongoose';
//import Beer from './models/Beer';
//import Review from './models/Review';


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/beerthirty');

const app = express();

app.get('/', (request, response) => {
  response.send(`Welcome to Beerthrity`);
});

app.listen(process.env.PORT || 3007);

process.on('SIGINT', function() {
  console.info('Closing Server');
  mongoose.connection.close(() => {
    console.info('Closed Database');
    process.exit();
  });
});