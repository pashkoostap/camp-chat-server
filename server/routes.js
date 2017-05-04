const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const mongoConnected = require('./db.js')
const CONFIG = require('./config.json');
const { validateString, validateEmail } = require('./utils/validation');

router.post('/signup', (req, res) => {
  let { username, email, password } = req.body;

  mongoConnected.then(db => {
    db.collection('users').findOne({ $or: [{ username }, { email }] }).then((user) => {
      if (user) {
        return res.status(400).json({
          status: 400,
          message: 'This username or email is already used'
        });
      }

      if (!username || !validateString(username)) {
        res.status(400).json({
          status: 400,
          message: 'Your name must contains at least 6 symbols'
        });
      } else if (!email || !validateEmail(email)) {
        res.status(400).json({
          status: 400,
          message: 'Please provide a valid email'
        });
      } else if (!password || !validateString(password)) {
        res.status(400).json({
          status: 400,
          message: 'Your password must contains at least 6 symbols'
        });
      } else {
        const token = jwt.sign(req.body, CONFIG.SECRET, { noTimestamp: true })
        db.collection('users').insert({ username, email, password, token, tokenType: 'Bearer' }, (err, user) => {
          if (err) {
            return res.status(404).send(err)
          }
          let { _id, username, email, token, tokenType } = user.ops[0];

          res.status(200).json({
            status: 200,
            message: 'User was succesfully created',
            user: { _id, username, email, token }
          });
        })
      }
    })
  });
})

router.post('/login', (req, res) => {
  let { username, password } = req.body;
  mongoConnected.then(db => {
    db.collection('users').findOne({ username, password }, { password: 0 }).then((user) => {
      if (!user) {
        return res.status(400).json({
          status: 400,
          message: 'User not found'
        });
      } else {
        res.status(200).json({
          status: 200,
          message: 'Wellcome',
          user
        });
      }
    })
  })
});

router.get('/users', (req, res) => {
  mongoConnected.then(db => {
    db.collection('users').find({}, { password: 0 }).toArray((err, users) => {
      res.status(200).send(users);
    })
  })
})

module.exports = router