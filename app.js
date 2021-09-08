require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const routes = require('./src/routes')

app.use(bodyParser.json());
app.use(express.json())
app.use(routes)

const port = process.env.PORT || 4000

app.listen(port, () => {
  console.log(`Server started on ${port}`)
});