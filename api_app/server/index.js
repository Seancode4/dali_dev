// index.js
const app = require('./app');

// if exists, use, else, 3000
const port = process.env.PORT || 3000;


// listening on 3000, function to respond to console
app.listen(port, () => console.log(`listening on port ${port}`));