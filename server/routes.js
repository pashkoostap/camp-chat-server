const express = require('express');
const router = express.Router();
const { ObjectID } = require('mongodb');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary');

const mongoConnected = require('./db.js');
const CONFIG = require('./config.json');
const { validateString, validateEmail, validateArray } = require('./utils/validation');

cloudinary.config({
  cloud_name: 'dyldtu4gm',
  api_key: '599713991634749',
  api_secret: 'peiRVSRPeidkQe4xsfM1Dhfsaz8'
});

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
  mongoConnected.then(db => {
    db.collection('users').findOneAndDelete({ username, password }).then((user) => {
      if (!user) {
        return res.status(400).json({
          status: 400,
          message: 'Please provide a valid username and password'
        });
      } else {
        res.status(200).json({
          status: 200,
          message: 'Your account was successfully deleted'
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

router.post('/newchat', (req, res) => {
  let { chatname, users } = req.body;
  let chatObj = {
    chatname,
    users: []
  }
  if (!chatname || !validateString(chatname)) {
    return res.status(400).json({
      status: 400,
      message: 'Chat name must contains at least 6 symbols'
    });
  }

  if (!users || !validateArray(users)) {
    return res.status(400).json({
      status: 400,
      message: 'Users must be an array and must contains at least 2 users'
    });
  }

  mongoConnected.then(db => {
    db.collection('chats').findOne({ chatname }).then(chat => {
      if (chat) {
        return res.status(400).json({
          status: 400,
          message: 'This chatname is already used'
        });
      }
    })
    users.forEach((user, i, arr) => {
      let { username } = user;
      db.collection('users').findOne({ username }, { password: 0 }).then(user => {
        chatObj.users.push(user);
        if (i == arr.length - 1) {
          db.collection('chats').insert(chatObj).then(doc => {
            let chat = doc.ops[0];
            res.status(200).json({
              status: 200,
              message: 'New chat was successfully created',
              chat
            });
          })
        }
      })
    })
  })
})

router.get('/getchats/:userID', (req, res) => {
  let { userID } = req.params;
  if (!ObjectID.isValid(userID)) {
    return res.status(404).json({
      status: 400,
      message: 'Please provide valid userID'
    })
  }
  mongoConnected.then(db => {
    db.collection('chats').find({ users: { $elemMatch: { _id: ObjectID(userID) } } }).toArray((err, chats) => {
      if (!chats || !validateArray(chats)) {
        return res.status(400).json({
          status: 400,
          message: 'Chats for this user were not found'
        })
      }
      res.status(200).send(chats);
    })
  })
})


router.get('/getmessages/:chatID', (req, res) => {
  let { chatID } = req.params;
  if (!ObjectID.isValid(chatID)) {
    return res.status(404).json({
      status: 400,
      message: 'Please provide valid chatID'
    })
  }
  mongoConnected.then(db => {
    db.collection('messages').find({ chatID }).toArray((err, messages) => {
      if (err) {
        return res.status(400).json({
          status: 400,
          message: 'Error'
        })
      }
      res.status(200).send(messages);
    })
  })
})

router.get('/messages/:chatname', (req, res) => {
  let { chatname } = req.params;
  mongoConnected.then(db => {
    db.collection('chats').findOne({ chatname }).then(chat => {
      if (!chat) {
        return res.status(400).json({
          status: 400,
          message: 'We can`t find this chat'
        })
      }
      db.collection('messages').find({ chatname }).toArray((err, messages) => {
        if (err) {
          return res.status(400).send(err);
        } else if (messages.length == 0) {
          return res.status(400).json({
            status: 400,
            message: 'Messages for this chat were not found'
          });
        }
        res.status(200).send(messages);
      })
    })

  })
})

router.post('/image', (req, res) => {
  let { image } = req.body;
  console.log(image)
  if (!image || !validateString(image)) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a valid image url or'
    })
  }
  cloudinary.uploader.upload(image, function (result) {
    res.send(result)
  });
})

module.exports = router