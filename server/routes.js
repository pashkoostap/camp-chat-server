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

// POST SIGNUP
router.post('/signup', (req, res) => {
  let { username, email, password, photo } = req.body;
  let photoDefaultURL = 'https://res.cloudinary.com/dyldtu4gm/image/upload/v1494072138/anon_user_berl8k.jpg';
  if (photo == '') {
    photo = photoDefaultURL;
  }
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
        db.collection('users').insert({ username, email, password, photo }, (err, user) => {
          if (err) {
            return res.status(404).send(err)
          }
          let { _id, username, email, photo } = user.ops[0];
          // UPDATING COMMON CHAT WITH NEW REGISTERED USER
          let commonChatID = '590d98137a6eae00114ad275';
          db.collection('chats').findOneAndUpdate({ _id: ObjectID(commonChatID) }, { $push: { users: { _id, username, email, photo } } }).then(chat => console.log('Users in common chat were updated'))

          res.status(200).json({
            status: 200,
            message: 'Your account was successfully created',
            user: { _id, username, email, photo }
          });
        })
      }
    })
  });
})

// POST LOGIN
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

// DELETE USER
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

// GET USERS
router.get('/users', (req, res) => {
  mongoConnected.then(db => {
    db.collection('users').find({}, { password: 0 }).toArray((err, users) => {
      res.status(200).send(users);
    })
  })
})

// POST NEWCHAT
router.post('/newchat', (req, res) => {
  let { photo, chatname, users } = req.body;
  let photoDefaultURL = 'https://res.cloudinary.com/dyldtu4gm/image/upload/v1494337269/chat_default_radba1.jpg';
  if (!photo) {
    photo = photoDefaultURL;
  }
  let chatObj = {
    photo,
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
      db.collection('users').find({}, { password: 0 }).toArray((err, usersArr) => {
        users.forEach((user, i) => {
          usersArr.forEach(userObj => {
            if (userObj.username === user.username) {
              chatObj.users.push(userObj);
              if (i == users.length - 1) {
                db.collection('chats').insert(chatObj).then(doc => {
                  let chat = doc.ops[0];
                  res.status(200).json({
                    status: 200,
                    message: 'New chat was successfully created',
                    chat
                  });
                })
              }
            }
          });
        })
      })
    })
  })
})

// GET GETCHATS/:USERID
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

// GET GETCHAT/:CHATID
router.get('/getchat/:chatID', (req, res) => {
  let { chatID } = req.params;
  if (!ObjectID.isValid(chatID)) {
    return res.status(404).json({
      status: 400,
      message: 'Please provide valid chatID'
    })
  }
  mongoConnected.then(db => {
    db.collection('chats').findOne({ _id: ObjectID(chatID) }).then(chat => {
      res.status(200).send(chat)
    })
  })
})

// GET GETMESSAGES/:CHATID
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

// POST MESSAGES/:CHATSARRAY
router.post('/messages', (req, res) => {
  let { chats } = req.body;
  let messagesArr = [];
  if (!chats || !validateArray(chats)) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide an array of chats ids to get messages'
    })
  }
  mongoConnected.then(db => {
    db.collection('messages').find({}).toArray((err, messages) => {
      if (err) {
        return res.status(400).send(err);
      } else if (messages.length == 0) {
        return res.status(400).json({
          status: 400,
          message: 'Messages were not found'
        });
      }
      messages.forEach((message, i) => {
        chats.forEach(chat => {
          if (message.chatID === chat._id) {
            messagesArr.push(message);
          }
        })
        if (i == messages.length - 1) {
          res.send(messagesArr);
        }
      })
    })
  })
})

// GET GETMESSAGES/:CHATNAME
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

// POST IMAGE/
router.post('/image', (req, res) => {
  let { image } = req.body;
  console.log(image)
  if (!image || !validateString(image)) {
    return res.status(400).json({
      status: 400,
      message: 'Please provide a valid image'
    })
  }
  cloudinary.uploader.upload(image, function (result) {
    res.send(result)
  });
})

module.exports = router