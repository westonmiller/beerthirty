import express from 'express';


const app = express();

app.get('/', (request, response) => {
  response.send(`Welcome to Beerthrity`);
});

app.listen(process.env.PORT || 3007);

process.on('SIGINT', function() {
  console.info('Closing Server');
  process.exit();
});