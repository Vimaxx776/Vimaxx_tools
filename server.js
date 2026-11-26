const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('JWT_SECRET wajib diisi dengan nilai acak minimal 32 karakter.');
  process.exit(1);
}
const db = new Database(process.env.DB_PATH || './data/vimaxx.sqlite');
db.pragma('journal_mode = WAL');
db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL COLLATE NOCASE UNIQUE,
 password_hash TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notes (
 user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 content TEXT NOT NULL DEFAULT '',
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS activity (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 tool_name TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({limit:'32kb'}));
app.use('/api/auth', rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:true,legacyHeaders:false}));
app.use(express.static(path.join(__dirname,'public')));

function auth(req,res,next){
  const token=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  try {
    const payload=jwt.verify(token,JWT_SECRET);
    req.user={id:payload.sub,username:payload.username};
    next();
  } catch { return res.status(401).json({error:'Silakan masuk kembali.'}); }
}
function validUsername(v){return typeof v==='string' && /^[a-zA-Z0-9_]{3,24}$/.test(v);}
function validPassword(v){return typeof v==='string' && v.length>=8 && v.length<=128;}

app.post('/api/auth/register', async (req,res)=>{
  const {username,password}=req.body||{};
  if(!validUsername(username)) return res.status(400).json({error:'Username 3–24 karakter; gunakan huruf, angka, atau garis bawah.'});
  if(!validPassword(password)) return res.status(400).json({error:'Password harus 8–128 karakter.'});
  try {
    const hash=await bcrypt.hash(password,12);
    const info=db.prepare('INSERT INTO users(username,password_hash) VALUES(?,?)').run(username,hash);
    const user={id:Number(info.lastInsertRowid),username};
    const token=jwt.sign({sub:user.id,username},JWT_SECRET,{expiresIn:'7d'});
    res.status(201).json({token,user});
  } catch(e){res.status(409).json({error:'Username sudah digunakan.'});}
});
app.post('/api/auth/login', async (req,res)=>{
  const {username,password}=req.body||{};
  if(typeof username!=='string'||typeof password!=='string') return res.status(400).json({error:'Isi username dan password.'});
  const row=db.prepare('SELECT * FROM users WHERE username=?').get(username);
  if(!row || !(await bcrypt.compare(password,row.password_hash))) return res.status(401).json({error:'Username atau password salah.'});
  const user={id:row.id,username:row.username};
  const token=jwt.sign({sub:user.id,username:user.username},JWT_SECRET,{expiresIn:'7d'});
  res.json({token,user});
});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));
app.get('/api/notes',auth,(req,res)=>{
  const note=db.prepare('SELECT content,updated_at FROM notes WHERE user_id=?').get(req.user.id);
  res.json({note:note||null});
});
app.post('/api/notes',auth,(req,res)=>{
  const content=req.body?.content;
  if(typeof content!=='string'||content.length>10000) return res.status(400).json({error:'Catatan maksimal 10.000 karakter.'});
  db.prepare(`INSERT INTO notes(user_id,content,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET content=excluded.content,updated_at=CURRENT_TIMESTAMP`).run(req.user.id,content);
  res.json({ok:true});
});
app.post('/api/activity',auth,(req,res)=>{
  const name=req.body?.tool_name;
  if(typeof name!=='string'||name.length<1||name.length>80) return res.status(400).json({error:'Nama tool tidak valid.'});
  db.prepare('INSERT INTO activity(user_id,tool_name) VALUES(?,?)').run(req.user.id,name);
  res.json({ok:true});
});
app.get('/api/activity',auth,(req,res)=>{
  const items=db.prepare('SELECT tool_name,created_at FROM activity WHERE user_id=? ORDER BY id DESC LIMIT 100').all(req.user.id);
  res.json({items});
});
app.get('/health',(req,res)=>res.json({ok:true,service:'VIMAXX VIP Tools'}));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`VIMAXX VIP Tools berjalan di port ${PORT}`));
