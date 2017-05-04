const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const mongoConnected = require('./db.js');
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
        db.collection('users').insert(req.body, (err, user) => {
          if (err) {
            return res.status(404).send(err)
          }
          let { _id, username, email } = user.ops[0];
          res.status(200).json({
            status: 200,
            message: 'Your account was successfully created',
            user: { _id, username, email }
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
        const token = jwt.sign(user, CONFIG.SECRET, { noTimestamp: true })
        res.status(200).json({
          status: 200,
          message: 'Wellcome',
          user,
          token,
          tokenType: 'Bearer'
        });
      }
    })
  })
});

router.delete('/user', (req, res) => {
  let { username, password } = req.body;
  console.log(req.body)
  mongoConnected.then(db => {
    db.collection('users').findOneAndDelete({ username, password }).then((user) => {

      console.log(user)
      if (!user) {
        return res.status(400).json({
          status: 400,
          message: 'Please provide a valid username and password'
        });
      } else {
        res.status(200).json({
          status: 200,
          message: 'Your account was successfully removed'
        });
      }
    })
  })
})

router.get('/users', (req, res) => {
  mongoConnected.then(db => {
    db.collection('users').find({}, { password: 0 }).toArray((err, users) => {
      res.status(200).send(users);
    })
  })
})

module.exports = router