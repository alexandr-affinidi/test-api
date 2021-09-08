const express = require("express");
const Controller = require("./controller");

const routes = express.Router();



routes.post("/main", Controller.verify);


module.exports = routes;