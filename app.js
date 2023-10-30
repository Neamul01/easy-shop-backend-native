const express = require("express");
require("dotenv/config");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

app.use(cors());
app.options("*", cors());

// middleware
app.use(express.json());
app.use(morgan("tiny"));
app.use("/public/uploads", express.static("public/uploads"));
app.use(authJwt());
app.use(errorHandler);

// Routers
const productsRoutes = require("./routes/products");
const categoriesRoutes = require("./routes/categories");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");

const api = process.env.API_URL;

app.use(`${api}/users`, usersRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/orders`, ordersRoutes);

mongoose
  .connect(process.env.CONNECTION_STR)
  .then(() => console.log("database connected"))
  .catch((err) => console.log(err));

app.listen(3000, () => {
  console.log("this server is started");
});
