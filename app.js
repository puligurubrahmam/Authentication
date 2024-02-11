const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const app = express()
app.use(express.json())
let db = null
const dbPath = path.join(__dirname, 'userData.db')
const dbIntializer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started At http://localhost:3000......')
    })
  } catch (e) {
    console.log(`error occured : ${e.message}`)
  }
}
dbIntializer()

//registration API

app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const sqlquery = `
  select * from user
  where username='${username}';
  `
  const dbUser = await db.get(sqlquery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const insertQuery = `
       insert into user(username,name,password,gender,location)
       values('${username}','${name}','${hashedPassword}','${gender}','${location}');
       `
      await db.run(insertQuery)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//Login User API

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `
    select * from user where username='${username}';
    `
  const dbUser = await db.get(userQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password)
    if (isPasswordCorrect === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//Changing Password

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  const sqlquery = `
  select * from user where username='${username}';
  `
  const dbUser = await db.get(sqlquery)
  const isPasswordCorrect = await bcrypt.compare(oldPassword, dbUser.password)
  if (isPasswordCorrect === true) {
    if (newPassword.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const updateQuery = `
       update user set
       password='${hashedPassword}'
       where username='${username}';
       `
      await db.run(updateQuery)
      response.send('Password updated')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})
module.exports = app
