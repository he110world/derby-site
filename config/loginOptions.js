/*
var gravatar = require('nodejs-gravatar');

module.exports = {
  passport: {
    registerCallback: function (req, res, user, done) {
      var model = req.getModel();
      var $user = model.at('auths.' + user.id);
      model.fetch($user, function () {
        $user.set('displayName', $user.get('github.displayName'));
        $user.set('username', $user.get('github.username'));
        $user.set('profileUrl', $user.get('github.profileUrl'));
        var emails = $user.get('github.emails');
        if (emails && emails[0] && emails[0].value) {
          var email = emails[0].value;
          $user.set('email', email);
          $user.set('avatar', gravatar.imageUrl(email));
        } else {
          $user.set('avatar', $user.get('github._json.avatar_url'));
        }
        done();
      })
    },
    successRedirect: '/',
    failureRedirect: '/'
  },
  strategies: {
    github: {
      strategy: require('passport-github').Strategy,
      conf: {
        clientID: '93553d0ff80d92a54af3',
        clientSecret: '14e77b063b733111db1e4ea94682ad857fb700ab',
        callbackURL: 'http://localhost:3000/auth/github/callback'
      }
    }
  },
  user: {
    id: true,
    displayName: true,
    username: true,
    profileUrl: true,
    email: true,
    avatar: true,
    online: true
  }
};*/
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'derbylogin@gmail.com',
        pass: 'derbyrulez'
    }
});

var from = 'Derby-login Example ✔ <derbylogin@gmail.com>';

module.exports = {
    collection: 'auths',
    publicCollection: 'users',
    user: {
        id: true,
        email: true,
        github: true,
        google: true,
        twitter: true,
        facebook: true,
        vkontakte: true
    },
    passport: {},
    strategies: {
        github: {
            strategy: require('passport-github').Strategy,
            conf: {
                clientID: 'eeb00e8fa12f5119e5e9',
                clientSecret: '61631bdef37fce808334c83f1336320846647115'
            }
        },
        google: {
            strategy: require('passport-google-oauth').OAuth2Strategy,
            conf: {
                clientID: '1060568558513-164eli9jaaf8nbjgv4asv3gutn72usl6.apps.googleusercontent.com',
                clientSecret: 'lqYJ1NF1AEeAA07MUGrIynXD',
                callbackURL: 'http://localhost:3000/auth/google/callback',
                scope: ['https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email']
            }
        },
        twitter: {
            strategy: require('passport-twitter').Strategy,
            conf: {
                consumerKey: 'QuFZgZ0vQyoWiSxQF4vJcirpl',
                consumerSecret: 'qGeldJTNrcSf3NbYbCzwlMxp2eifh92aDHWCFlMmndb1OBYOJH',
                callbackURL: 'http://localhost:3000/auth/twitter/callback'
            }
        },
        facebook: {
            strategy: require('passport-facebook').Strategy,
            conf: {
                clientID: '58362219983',
                clientSecret: 'da0fb6cbcb6cac1a0aca9f78200935d2',
                callbackURL: 'http://localhost:3000/auth/facebook/callback'
            }
        },
        vkontakte: {
            strategy: require('passport-vkontakte').Strategy,
            conf: {
                clientID: '4373291',
                clientSecret: 'fOZiLyGhSH1DHWLFFfZo',
                callbackURL: 'http://localhost:3000/auth/vkontakte/callback'
            }
        }
    },
    hooks: {
        sendChangeEmailConfirmation: function(userId, email, done) {
            var mailOptions = {
                from: from,
                to: email,
                subject: 'Email change confirmation ✔',
                html: '<a href="http://localhost:3000/auth/confirmemailchange' +
                    '?id=' + userId + '">Confirm Email change</a>'
            };

            transporter.sendMail(mailOptions, function(err, info){
                if(err){
                    console.log(err);
                }else{
                    console.log('Message sent: ' + info.response);
                }
                done(err);
            });
        },
        sendRegistrationConfirmation: function(userId, email, done) {
            var mailOptions = {
                from: from,
                to: email,
                subject: 'Registration confirmation ✔',
                html: '<a href="http://localhost:3000/auth/confirmregistration' +
                    '?id=' + userId + '">Confirm Registration</a>'
            };

            transporter.sendMail(mailOptions, function(err, info){
                if(err){
                    console.log(err);
                }else{
                    console.log('Message sent: ' + info.response);
                }
                done(err);
            });
        },
        sendRecoveryConfirmation: function(userId, email, secret, done) {
            var mailOptions = {
                from: from,
                to: email,
                subject: 'Recovery confirmation ✔',
                html: '<a href="http://localhost:3000/recoverpassword' +
                    '?secret=' + secret + '">Recover password</a>'
            };

            transporter.sendMail(mailOptions, function(err, info){
                if(err){
                    console.log(err);
                }else{
                    console.log('Message sent: ' + info.response);
                }
                done(err);
            });
        }
    }
};