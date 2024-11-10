require("dotenv").config();

const express = require("express");
const path = require("path");
const app = express();

app.use(
  require("express-session")({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(require("morgan")("dev"));
app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(require("cookie-parser")(process.env.SECRET));

app.use("/", (req, res) => {
  res.render("homepage");
});

app.listen(3000, () => console.log("app is live at: http://localhost:3000"));
