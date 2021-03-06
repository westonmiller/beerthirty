import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import Beer from './models/Beer';
import Review from './models/Review';
import socketio from 'socket.io';
import http from 'http';
import path from 'path';
import moment from 'moment';
import 'countdown';
import 'moment-countdown';

let app = express();
let server = http.Server(app);
let io = socketio(server);


String.prototype.paddingLeft = function () {
   return String('00' + this).slice(-2);
};

server.listen(process.env.PORT || 3007);

let eventEndTime = moment('2017-10-26 17:00-06:00');
let eventEndTimeSeconds = eventEndTime.valueOf();

io.on('connection', (socket) => {
  var eventOverNotificationSent = false;
  app.socket = socket;
  socket.emit('message','Connected');
  socket.emit('eventEndTime', eventEndTime.format('YYYY-MM-DD HH:mm:ssZ'));
  let eventTimer = setInterval(function() {
    const currentTime = moment().valueOf();
    const seconds = eventEndTimeSeconds - currentTime;
    const duration = moment.duration(seconds);
    const timeTillEventOver = duration.hours().toString().paddingLeft() + ':'
                              + duration.minutes().toString().paddingLeft() + ':'
                              + duration.seconds().toString().paddingLeft();
    socket.emit('timeTillEventOver', {timeTillEventOver, seconds});
    socket.emit('humanReadableTimeTillOver', timeTillEventOver);

    if (seconds <= -30000) {
      clearInterval(eventTimer);
    }
    if (seconds <= 0 ) {
      if (!eventOverNotificationSent) {
        io.emit('eventOver', true);
        eventOverNotificationSent = true;
      }
    }
  }, 1000);
});


mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/beertally');

app.use(bodyParser.json());

app.post('/beers', (request, response) => {
  const {name, brewery, submitter, imageURL} = request.body;
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
          imageURL
        });

        newBeer.save((error, beer) => {
          if (!error) {
            io.emit('newBeer', beer);
            io.emit('newStuff', 'newReview');
            response.status(201).send(beer);
          } else {
            response.send(error);
          }
        });
      }
  });
});

app.get('/beers', (request, response) => {
  console.log('BEERS GET')
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
    if (!error && beer) {
      beer.remove((error) => {
        if (!error) {
          Review.remove({beerId: id});
          response.send('Beer Deleted');
        }
      });
    } else {
      response.status(404).send('No Beer Found');
    }
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



      Review.find({ beerId: id, reviewer}, (error, reviews) => {
        if (reviews.length > 0) {
          return response.sendStatus(418)
        } else {
          const newReview = new Review({
            overallRating: overallRating,
            reviewer: reviewer,
            beerId: id
          });

          newReview.save((error, review) => {
            if (error) {response.status(500).send(error);}
            beer.reviews.push(review);
            beer.save((error) => {
              if (error) {return response.status(500).send(error);}
              io.emit('newStuff', 'newReview');
              io.emit('newBeer', beer);
              return response.status(201).send(review);
            });
          });
          
        }
      });




    } else {
      return response.status(404).send('No Beer Found');
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
  response.sendFile(path.join( __dirname, './index.html'));
});

app.get('/tv', (request, response) => {
  response.sendFile(path.join( __dirname, './tvIndex.html'));
});

app.use('/', express.static(__dirname));


process.on('SIGINT', function() {
  console.info('Closing Server');
  mongoose.connection.close(() => {
    console.info('Closed Database');
    process.exit();
  });
});

