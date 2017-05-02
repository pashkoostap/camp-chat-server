const MongoClient = require('mongodb').MongoClient
const CONFIG = require('./config.json')

const mongoConnected = new Promise((res, rej) => {
  MongoClient.connect(CONFIG.DB, (err, db) => {
    if (err) rej(err)
    console.log('Connected correctly to db server')
    res(db)
  })
})

mongoConnected.catch(err => console.error(err.stack))

module.exports = mongoConnected