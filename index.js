import express from "express";
import bodyParser from "body-parser";
import axios, { isAxiosError } from "axios";
import pg from "pg";
import bcrypt from "bcrypt"
import 'dotenv/config';
import jwt from "jsonwebtoken"
import cookieParser from "cookie-parser"
const app = express();
const port = 3000;
const saltRounds=10;

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "arete",
  password: process.env.POSTGRESQLPASSWORD,
  port: 5432,
});
db.connect(); 
let isloggedin=false
app.get("/", authenticateToken,(req, res) => {
  if (req.user) {
    return res.render("home.ejs",{loginBool:true})
  } else {
    return res.render("home.ejs",{loginBool:false})
  }
});

app.get("/dashboard", authenticateToken,(req, res) => {
  if (req.user) {
    return res.render("dashboard.ejs",{loginBool:true})
  } else {
    return res.redirect("/signup")
  }
});


app.get("/mentor",authenticateToken,async (req, res) => {
  const mentorList=await db.query("SELECT * FROM mentors")
  if (req.user) {
    console.log(mentorList.rows);
    return res.render("mentor.ejs",{loginBool:true,mentors:mentorList.rows})
  } else {
    return res.render("mentor.ejs",{loginBool:false,mentors:mentorList.rows})
  }
});

// app.get("/pricing", (req, res) => {
//  res.render("pricing.ejs",{loginBool:isloggedin})
// });

app.get("/roadmaps",authenticateToken,(req, res) => {
  if (req.user) {
    return res.render("roadmaps.ejs",{loginBool:true})
  } else {
    return res.render("roadmaps.ejs",{loginBool:false})
  }
});

app.get("/library",authenticateToken, async (req, res) => {
  if (req.user) {
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
  return res.render("library.ejs",{books:libRenderData,loginBool:true})
}
else{
return res.redirect("/signup")
}
});

app.get("/books/:id",authenticateToken, async (req,res)=>{
  if (req.user){
  const bookId =req.params.id
  const bookData=await axios.get(`https://gutendex.com/books/${bookId}`)
  const bookcontent=await axios.get(bookData.data.formats["text/plain; charset=utf-8"])
  const dataSend={
    title:bookData.data.title,
     materialSrc:bookcontent.data
  }
  res.render("reader.ejs",{content:dataSend,loginBool:true})
}
return res.redirect("/signup")
})

app.get("/signup",authenticateToken, (req, res) => {
if (req.user){ 
  return res.redirect("/dashboard")
}else{
  return res.render("signup.ejs",{loginBool:false})
}
});

app.post("/signup",authenticateToken, (req, res) => {
  if (req.user){ 
  return res.redirect("/dashboard")
}else{
  const username=req.body.name;
  const email=req.body.email;
  const password=req.body.password;
  bcrypt.hash(password,saltRounds,async (err,hash)=>{
    if (err) {
      console.log(err)
    }
  const addQuery=await db.query("INSERT INTO users (username,email,password_hash) VALUES ($1,$2,$3) RETURNING id,username,email",[username,email,hash])
  console.log(addQuery.rows[0]);
  const accessToken=jwt.sign(addQuery.rows[0], process.env.ACCESS_TOKEN,{ expiresIn: '30d' })
  res.cookie("token",accessToken)
  res.redirect("/dashboard")
});
}
});

app.post("/login",authenticateToken,async (req, res) => {
if (req.user){ 
  return res.redirect("/dashboard")
}else{
  const email = req.body.email;
  const loginPassword = req.body.password;

  try {
    const userData = await db.query("SELECT * FROM users WHERE email=$1", [email]);

    if (userData.rows.length === 0) {
      return res.send("User not found");
    }

    const hashedPassword = userData.rows[0].password_hash;
    const passwordMatches = await bcrypt.compare(loginPassword, hashedPassword);
    const userInfoJson=userData.rows[0]
    if (!passwordMatches) {
      return res.send("Incorrect password");
    }
    if (passwordMatches) {
      const accessToken=jwt.sign({id:userInfoJson.id,email:userInfoJson.email}, process.env.ACCESS_TOKEN,{ expiresIn: '30d'})
      res.cookie("token",accessToken)
      res.redirect("/dashboard");
    }
  } catch (err) {
    console.log(err);
    res.send("Something went wrong while logging in");
  }
}
});

app.post("/increasexp",authenticateToken,async (req,res)=>{
  if (req.user){ 
  const xptoadd=req.body.xp;
  const userid=req.user.id;
  try {
    const addingXp=db.query("UPDATE users SET xp=xp+$1 WHERE id=$2;",[xptoadd,userid]);
  } catch (error) {
    console.log(err)
  }
  res.sendStatus(200)
}else{
    return res.redirect("/signup")
}
})

app.get("/login", authenticateToken,(req, res) => {
   if (req.user){ 
    return res.redirect("/dashboard")
   }else{
    return res.render("login.ejs",{loginBool:false})
   }
});

function authenticateToken(req,res,next) {
  const authToken=req.cookies.token;
  jwt.verify(authToken,process.env.ACCESS_TOKEN,(err,result)=>{
    if (err) {
      req.user = null;
      return next();
    }
    else{
      req.user=result;
      next()
    }
  })
}
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
