import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import Beer from './models/Beer';
import Review from './models/Review';


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/beerthirty');

const app = express();

app.use(bodyParser.json());

app.post('/beers', (request, response) => {
  const {name, brewery, submitter, description} = request.body;

  Beer.find(
    {
      name: name.toLowerCase(),
      brewery: brewery.toLowerCase()
    }, (error, beers) => {
    if (beers.length) {
      response.status(409)
              .send({error: 'Beer already exists'});
    } else {
      const newBeer = new Beer({
        name: name.toLowerCase(),
        brewery: brewery.toLowerCase(),
        submitter: submitter.toLowerCase(),
        description
      });

      newBeer.save((error, beer) => {
        if (!error) {
          response.status(201).send(beer);
        } else {
          response.send(error);
        }
      });
    }
  });
});

app.get('/beers', (request, response) => {
  Beer.find({}).populate('reviews').exec((error, beers) => {
    if (!error) {
      response.status(200).send(beers);
    }
    else {
      response.status(500).send(error);
    }
  });
});

app.get('/beers/:id', (request, response) => {
  const { id } = request.params;

  Beer.findById(id).populate('reviews').exec((error, beer) => {
    if (!error && beer) {
      response.send(beer);
    } else {
      response.status(404).send('No Beer Found');
    }
  });
});

app.delete('/beers/:id', (request, response) => {
  const { id } = request.params;

  Beer.findById(id, (error, beer) => {
    beer.remove((error) => {
      if (!error) {
        response.send('Beer Deleted');
      } else {
        response.status(404).send('No Beer Found');
      }
    });
  });
});

app.post('/beers/:id/reviews', (request, response) => {
  const { id } = request.params;
  const { overallRating, reviewer } = request.body;
  if (!overallRating) {
    response.status(418).send('No overallRating');
    return;
  }

  Beer.findById(id).populate('reviews').exec((error, beer) => {
    if (!error && beer) {
      const newReview = new Review({
        overallRating: overallRating,
        reviewer: reviewer
      });

      newReview.save((error, review) => {
        if (error) {response.status(500).send(error);}

        beer.reviews.push(review);
        beer.save((error) => {
          if (error) {response.status(500).send(error);}
          response.status(201).send(review);
        });
      });
    } else {
      response.status(404).send('No Beer Found');
    }
  });
});

app.get('/beers/:id/reviews', (request, response) => {
  const { id } = request.params;

  Beer.findById(id).populate('reviews').exec((error, beer) => {
    if (!error && beer) {
      response.send(beer.reviews);
    } else {
      response.status(404).send('No Beer Found');
    }
  });
});

app.get('/beers/:id/reviews/:reviewId', (request, response) => {
  const { reviewId } = request.params;

  Review.findById(reviewId, (error, review) => {
    if (!error && review) {
      response.send(review);
    } else {
      response.status(404).send('No Review Found');
    }
  });
});


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