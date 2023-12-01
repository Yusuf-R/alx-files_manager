/* eslint-disable import/newline-after-import */
//  create the Express server:
// it should listen on the port set by the environment variable PORT or by default 5000
// it should load all routes from the file routes/index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const router = require('./routes/index');

// it should parse the body of the request as a JSON object for all HTTP requests
app.use(express.json());

// it should load all routes from the file routes/index.js
app.use(router);

app.listen(port, () => {
  console.log(`Server running on port ${port}: http://localhost:${port}`);
});
