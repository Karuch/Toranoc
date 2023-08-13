const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, './')));

// Start the server
const port = 80;
app.listen(port, function () {
  console.log(`Listening on port ${port}...`);
});