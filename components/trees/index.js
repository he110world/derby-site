module.exports = Tree;

function Tree() {
}

Tree.prototype.view = __dirname;
var todoName;

Tree.prototype.init = function (model) {
    todoName = model.root.get('$render.params.name');
    model.ref('todos1', model.root.query(todoName, {}));
};

Tree.prototype.addRoot = function(text){
    this.model.root.add(todoName, {
        text: text,
        children: [],
        parent: null
    });
};

Tree.prototype.hasChildren = function(todo, id) {
    var node = this.getNode(todo, id);
    if (node) {
        return node.children.length>0;
    }
    return false;
};

Tree.prototype.getNode = function(todo, id) {
    for(var p in todo) {
        if (!todo[p]) {
            console.log('empty node: ' + p);
        }
        if (todo[p] && todo[p].id == id) {
            return todo[p];
        }
    }
    return null;
};

Tree.prototype.editNode = function(id) {
    console.log('fuck');
};

Tree.prototype.addChild = function(parentId, text) {
    var model = this.model.root;
    var node = model.get(todoName+'.'+parentId);
    if (!node) {
        return;
    }
    var newId = model.add(todoName, {
        text: text,
        children: [],
        type: '功能',
        parent: parentId
    });
    node.children.push(newId);
    model.set(todoName+'.'+parentId+'.children', node.children);
};

Tree.prototype.insertChild = function(nodeId, text) {
    var model = this.model.root;
    var node = model.get(todoName+'.'+nodeId);

    //新建节点
    var newId = model.add(todoName, {
        text: text,
        children: node.children,    //新节点的子节点=所有当前子节点
        type: node.type,
        parent: nodeId  //新节点的父节点=当前节点
    });

    //每个子节点的父节点=新节点
    for (var cid in node.children) {
        model.set(todoName+'.'+cid+'.parent', newId);
    }

    //当前节点的子节点=新节点
    model.set(todoName+'.'+nodeId+'.children', [newId]);
};

Tree.prototype.insertParent = function(nodeId, text) {
    var model = this.model.root;
    var node = model.get(todoName+'.'+nodeId);

    //新建节点
    var newId = model.add(todoName, {
        text: text,
        children: [nodeId],    //新节点的子节点=当前节点
        type: node.type,
        parent: node.parent  //新节点的父节点=当前节点的父节点
    });

    //父节点的子节点数组中的当前节点=新节点
    if (node.parent) {
        var path = todoName+'.'+node.parent+'.children';
        var index = this.model.root.get(path).indexOf(nodeId);
        model.remove(path, index);
        model.insert(path, index, newId);
    }

    //当前节点的父节点=新节点
    model.set(todoName+'.'+nodeId+'.parent', newId);
};

Tree.prototype.delNode = function(nodeId) {
    //this.model.removeRef('_page.editNode');
    var model = this.model.root;
    //model.subscribe(todoName, function() {
        var node = model.get(todoName+'.'+nodeId);

        //所有子节点的父节点=父节点
        for(var cid in node.children) {
            model.set(todoName+'.'+node.children[cid]+'.parent', node.parent);
        }

        //从父节点的子节点里删除当前节点
        if (node.parent) {
            var path = todoName+'.'+node.parent+'.children';
            var index = model.get(path).indexOf(nodeId);
            model.remove(path, index);

            //父节点的子节点+=所有子节点
            model.insert(path, index, node.children);
        }

        //删除当前节点
        //model.del(todoName+'.'+nodeId);
        model.set(todoName+'.'+nodeId+'.del', true);
        model.set(todoName+'.'+nodeId+'.parent', null);
    //});
};

Tree.prototype.getTodoList = function(selfOnly) {

};

Tree.prototype.addTodo = function(newTodo){

    if (!newTodo) return;

    this.model.add('todos', {
        text: newTodo,
        completed: false
    });

//  this.model.add('children', {name:'fuck'});

    this.model.set('_page.newTodo', '');

    this.addRoot(newTodo);
};

Tree.prototype.delTodo = function(todoId){
    this.model.del('todos.' + todoId);
};

Tree.prototype.clearCompleted = function(){
    var todos = this.model.get('todos');

    for (var id in todos) {
        if (todos[id].completed) this.model.del('todos.'+id);
    }
};

Tree.prototype.clearAll= function(){
//    var model = this.model.root;
    var todos = this.model.get('todos1');

    for (var id in todos) {
        console.log(id);
        this.model.del('todos1.'+id);
    }
};

Tree.prototype.editTodo = function(todo){

    this.model.set('_page.edit', {
        id: todo.id,
        text: todo.text
    });

    window.getSelection().removeAllRanges();
    document.getElementById(todo.id).focus()
};

Tree.prototype.doneEditing = function(todo){
    this.model.set('todos.'+todo.id+'.text', todo.text);
    this.model.set('_page.edit', {
        id: undefined,
        text: ''
    });
};

Tree.prototype.cancelEditing = function(e){
    // 27 = ESQ-key
    if (e.keyCode == 27) {
        this.model.set('_page.edit.id', undefined);
    }
};

Tree.prototype.hasParent = function (childId, parentId) {
    var id = this.model.root.get(todoName+'.'+childId+'.parent');
    while (id) {
        if (id == parentId) {
            return true;
        }
        id = this.model.root.get(todoName+'.'+id+'.parent');
    }
    return false;
};

Tree.prototype.showEdit = function (todoId) {
    if (this.model.get('_page.settingParent')) {
        var node = this.model.get('_page.editNode');
        if (node.id == todoId) {
//            this.model.flash('error', '自己的父节点不能是自己');
        } else if (node.parent == todoId) {
//            this.model.flash('error', '该节点已经是父节点');
        } else if (this.hasParent(todoId, node.id)) {
//            this.model.flash('error', '循环引用');
        } else {   //父节点不能是：自己，当前父节点，子节点
            if (node.parent) {
                var path = todoName+'.'+node.parent+'.children';
                var oldChildren = this.model.root.get(path);
                this.model.root.remove(path, oldChildren.indexOf(node.id));
            }
            this.model.root.set(todoName+'.'+node.id+'.parent', todoId);
            this.model.root.push(todoName+'.'+todoId+'.children', node.id);
        }
        this.model.set('_page.settingParent', false);
    } else {
        this.model.set('_page.nodeTypes', ['功能','任务']);
        this.model.set('_page.featureImportances', [1,2,3,4,5,6,7,8,9,10]);
        this.model.ref('_page.editNode', this.model.root.at(todoName+'.'+todoId));
        this.modalDialog.show();
    }
};

Tree.prototype.selectType = function (evt) {
    this.model.set('_page.editNode.type', evt.target.value);
};

Tree.prototype.closeEdit = function (action, cb) {
    console.log(action);
    console.log(cb);
};

Tree.prototype.setParent = function () {
    this.model.set('_page.settingParent', true);
};