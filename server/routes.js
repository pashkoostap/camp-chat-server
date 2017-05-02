const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

const mongoConnected = require('./db.js')
const CONFIG = require('./config.json');
const { validateString, validateEmail } = require('./utils/validation');

router.post('/signup', (req, res) => {
  let { username, email, password } = req.body;

  mongoConnected.then(db => {
    db.collection('users').findOne({ username: { $exists: username }, email: { $exists: email } }).then((user) => {
      if (user) {
        console.log(user);
        return res.status(400).json({
          status: 400,
          message: 'This username or email is already used'
        });
      }

      if (!username || !validateString(username)) {
        console.log(username);
        res.status(400).json({
          status: 400,
          message: 'Your name must contains at least 6 symbols'
        });
      } else if (!email || !validateEmail(email)) {
        console.log(email);
        res.status(400).json({
          status: 400,
          message: 'Please provide a valid email'
        });
      } else if (!password || !validateString(password)) {
        console.log(password);
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
            message: 'User was succesfully created',
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
          message: '',
          user,
          token,
          tokenType: 'Bearer'
        });
      }
    })
  })
});

module.exports = router