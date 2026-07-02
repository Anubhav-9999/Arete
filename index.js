import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import pg from "pg";
import bcrypt from "bcrypt"
import 'dotenv/config';
import session from "express-session";
import passport from "passport";



const app = express();
const port = 3000;
const saltRounds=10;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:process.env.SESSIONSECRET,
  resave:false,
  saveUninitialized:true
}))
app.use(passport.initialize());
app.use(passport.session())



const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "arete",
  password: process.env.POSTGRESQLPASSWORD,
  port: 5432,
});
db.connect();
const isloggedin=true
app.get("/", (req, res) => {
 res.render("home.ejs",{loginBool:isloggedin})
});

app.get("/dashboard", (req, res) => {
 res.render("dashboard.ejs",{loginBool:isloggedin})
});


app.get("/mentor", (req, res) => {
 res.render("mentor.ejs",{loginBool:isloggedin})
});

app.get("/pricing", (req, res) => {
 res.render("pricing.ejs",{loginBool:isloggedin})
});

app.get("/roadmaps", (req, res) => {
 res.render("roadmaps.ejs",{loginBool:isloggedin})
});

app.get("/library", async (req, res) => {
  const result=await axios.get("https://gutendex.com/books?topic=science")
    const libRenderData=[]
  result.data.results.forEach(element => {
    let data ={
      id:element.id,
      author:element.authors[0].name,
      title:element.title,
      cover_page:element.formats['image/jpeg'],
      content_link:element.formats['text/plain; charset=us-ascii']
    }
    libRenderData.push(data)
  });
  res.render("library.ejs",{books:libRenderData,loginBool:isloggedin})
});

app.get("/books/:id", async (req,res)=>{
  const bookId =req.params.id
  const bookData=await axios.get(`https://gutendex.com/books/${bookId}`)
  const bookcontent=await axios.get(bookData.data.formats["text/plain; charset=utf-8"])
  const dataSend={
    title:bookData.data.title,
     materialSrc:bookcontent.data
  }
  console.log(bookcontent.data)
  res.render("reader.ejs",{content:dataSend,loginBool:isloggedin})
})

app.get("/signup", (req, res) => {
 res.render("signup.ejs",{loginBool:isloggedin})
});

app.post("/signup", (req, res) => {
  const username=req.body.name;
  const email=req.body.email;
  const password=req.body.password;
  bcrypt.hash(password,saltRounds,(err,hash)=>{
    if (err) {
      console.log(err)
    }
  const addQuery=db.query("INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3)",[username,email,hash])
  })
  
  res.redirect("/dashboard")
});

app.post("/login",async (req, res) => {
  const email = req.body.email;
  const loginPassword = req.body.password;

  try {
    const userData = await db.query("SELECT * FROM users WHERE email=$1", [email]);

    if (userData.rows.length === 0) {
      return res.send("User not found");
    }

    const hashedPassword = userData.rows[0].password_hash;
    const passwordMatches = await bcrypt.compare(loginPassword, hashedPassword);
    console.log(passwordMatches)
    if (!passwordMatches) {
      return res.send("Incorrect password");
    }

    res.redirect("/dashboard");
  } catch (err) {
    console.log(err);
    res.send("Something went wrong while logging in");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs",{loginBool:isloggedin})
});
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
