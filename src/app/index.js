var derby = require('derby');
var markedOptions = require('./../../config/markedOptions');
var path = require('path');
var app = module.exports = derby.createApp('site', __filename);

if (!derby.util.isProduction) global.app = app;

app.serverUse(module, 'derby-markdown', markedOptions);
app.serverUse(module, 'derby-stylus');
app.loadViews(path.join(__dirname, '/../../views/app'));
app.loadStyles(path.join(__dirname, '/../../styles/app'));
app.component(require('../../components/chat'));
app.component(require('../../components/preferences'));
app.component(require('../../components/sidebar'));
app.component(require('../../components/trees'));

app.use(require('d-bootstrap'));
app.use(require('d-datepicker'));

//app.use(require('d-comp-palette'));

app.get('*', function (page, model, params, next) {
  // it`s used to cheat template engine in derby-template examples
  model.set('_session.openBrackets', '{{');
  if (model.get('_session.loggedIn')) {
    var userId = model.get('_session.userId');
    $user = model.at('users.' + userId);
    model.subscribe($user, function () {
      model.ref('_session.user', $user);
      next();
    });
  } else {
    next();
  }
});

app.get('/', function (page, model) {
  page.render('home');
});

app.get('/chat', function (page, model) {
  var $messagesQuery = model.query('messages', {});
  model.subscribe($messagesQuery, 'users', function () {
    page.render('chat');
  });
});
app.get('/trees/:name', function(page, model, params, next) {
    if (params.name == 'null') {
        //next();
        return;
    }

    var todo_name = params.name;
    model.subscribe('tree_names', function() {
        var names = model.query('tree_names', {}).get('names');
        if (!names.length) {
            model.set('tree_names.names', [todo_name]);
        } else {
            if (names[0].indexOf(todo_name) == -1) {
                model.push('tree_names.names', todo_name);
            }
        }
    });

    model.subscribe(todo_name, function () {
        page.params = page.params || {};
        page.params.name = todo_name;
        page.render('trees');
    });
});

app.get('/started', function (page, model) {
    model.subscribe('tree_names', function() {
        model.ref('_page.tree_names', model.at('tree_names.names'));
        page.render('started');
    });
});

app.get('/:name/:sub?', function (page, model, params, next) {
  var name = params.name;
  var sub = params.sub;
  var viewName = sub ? name + ':' + sub : name;

  if (name === 'auth') return next();
//  if (name === 'trees') return next();

  page.render(viewName);
});

app.on('model', function (model) {
  model.fn('all', function (doc) {
    return true;
  });
  model.fn('online', function (doc) {
    return doc.online;
  });
});
/*

app.proto.getTrees = function () {
    var names =  this.model.root.get('_page.tree_names');
    return names;
};*/
