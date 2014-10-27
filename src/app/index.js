var derby = require('derby');
var markedOptions = require('./../../config/markedOptions');
var path = require('path');
var app = module.exports = derby.createApp('site', __filename);

if (!derby.util.isProduction) global.app = app;

app.use(require('derby-login/components/notAuth'));
app.use(require('derby-login/components/auth'));

app.serverUse(module, 'derby-markdown', markedOptions);
app.serverUse(module, 'derby-stylus');
app.loadViews(path.join(__dirname, '/../../views/app'));
app.loadStyles(path.join(__dirname, '/../../styles/app'));
app.component(require('../../components/chat'));
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

    model.subscribe('tree_config__', function() {
        var config = model.query('tree_config__', {}).get(todo_name);
        if (!config.length) {
            console.log(todo_name);
            model.set('tree_config__.'+todo_name, {beginDate:null});
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
app.get('/confirmregistration', function(page, model){
    page.render('confirmregistration');
});

app.get('/recoverpassword', function(page, model, params){
    var secret = params.query.secret;
    model.set('_page.secret', secret);
    page.render('recoverpassword');
});

app.get('/login', function(page, model){
    page.render('login');
});

app.proto.passwordChanged = function(data) {
    app.model.set('_page.passwordChanged', true);
};

app.proto.recoveryEmailSent = function(data) {
    alert('Recovery email is sent to ' + data.email);
};

app.get('/emailchangeconfirmed', function(page, model){
    page.render('emailchangeconfirmed');
});

app.get('/registrationconfirmed', function(page, model){
    page.render('registrationconfirmed');
});

app.proto.emailChanged = function(data) {
    alert('Confirmation email is sent to ' + data.email);
};

app.proto.passwordChanged = function(data) {
    alert('Password is changed');
};

app.proto.addTree = function() {
    this.addTreeDialog.show();
};

app.proto.validateTreeName = function (name) {
    if (!name || name=='确定') {
        this.model.set('_page.dangerMsg', '名字不能为空');
        return false;
    }
    var treeNames = this.model.get('tree_names.names');
    for (var t in treeNames) {
        if (name == treeNames[t]) {
            this.model.set('_page.dangerMsg', '名字已存在');
            return false;
        }
    }
    this.model.set('_page.dangerMsg', null);
    return true;
};

//on-hide="xxx" => model.hide()时调用xxx(action,cancel)
app.proto.doAddTree = function(name, cancel) {
    if (name=='backdrop' || name=='close') {
        return;
    }
    if (!this.validateTreeName(name)) {
        cancel();
        return;
    }
    this.model.set('_page.dangerMsg', null);
    this.model.push('tree_names.names', name);
};

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
