const validateString = (username) => {
  // checking for white spaces in username
  let replacedUsername = username.replace(/\s/g, '').length;
  if (typeof username === 'string' && username.length > 5 && replacedUsername) {
    return true;
  } else {
    return false;
  }
}

const validateEmail = (email) => {
  let pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (typeof email === 'string' && email.match(pattern)) {
    return true;
  } else {
    return false;
  }
}

module.exports = {
  validateString,
  validateEmail
}