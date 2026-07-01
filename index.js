import express from "express";
import bodyParser from "body-parser";
import axios from "axios"
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
 res.render("home.ejs")
});

app.get("/dashboard", (req, res) => {
 res.render("dashboard.ejs")
});


app.get("/mentor", (req, res) => {
 res.render("mentor.ejs")
});

app.get("/pricing", (req, res) => {
 res.render("pricing.ejs")
});

app.get("/roadmaps", (req, res) => {
 res.render("roadmaps.ejs")
});

app.get("/library", async (req, res) => {
  // const result=await axios.get("https://project-gutenberg-books-api.p.rapidapi.com/api/books?q=shakespeare&page_size=10")
//   console.log(result.data)
 res.render("library.ejs")
});
app.get("/signup", (req, res) => {
 res.render("signup.ejs")
});

app.post("/signup", (req, res) => {
 res.redirect("/dashboard")
});

app.get("/login", (req, res) => {
 res.render("login.ejs")
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
