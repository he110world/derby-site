var moment = require('moment');

module.exports = Tree;

function Tree() {
}

Tree.prototype.view = __dirname;
var todoName;

Tree.prototype.init = function (model) {
    var self = this;
    todoName = model.root.get('$render.params.name');
    model.ref('todos1', model.root.query(todoName, {}));
    model.ref('todos2', model.root.at(todoName));
    model.ref('_page.beginDate', model.root.at('tree_config__.'+todoName+'.beginDate'));

    var gettodocount = 0;
    var getTodoList = function(todos1) {
        ++gettodocount;
        console.log(gettodocount);
        var todoList = [];
        var rootIdList = [];
        var todoDict = {};
        var totalTime = 0;

        var estimateTime_r = function (id) {
            var todoInfo = todoDict[id];
            if (!todoInfo) {
                console.log(id);
                return 1;
            }
            var todo = todoInfo.todo;
            if (todo.children.length == 0) {
                var estTime = parseInt(todo.estTime) || 1;
                todoInfo.estTime = estTime;
                return estTime;
            }

            var allTime = 0;
            for (var c in todo.children) {
                var cid = todo.children[c];
                allTime += parseInt(estimateTime_r(cid));
            }
            todoInfo.estTime = allTime;
            return allTime;
        };

        var calcImportance_r = function (id) {
            var todoInfo = todoDict[id];
            var todo = todoInfo.todo;
            var childrenTotal = 0;

            if (todo.children.length>0) {
                for (var c in todo.children) {
                    var childInfo = todoDict[todo.children[c]];
                    childrenTotal += childInfo.todo.importance || 1;
                }

                var k = todoInfo.importance / childrenTotal;
                for (var c in todo.children) {
                    var cid = todo.children[c];
                    var childInfo = todoDict[cid];
                    var imp = childInfo.todo.importance || 1;
                    childInfo.importance = Math.ceil(k * imp);

                    calcImportance_r(cid);
                }
            }
        };

        var genTask_r = function (id) {
            var children = [];
            var todoInfo = todoDict[id];
            var todo = todoInfo.todo;

            if (todo.type == '任务') {
                totalTime += parseInt(todo.estTime) || 1;
                todoInfo.totalTime = totalTime;
                todoList.push(todoInfo);
            }

            var todoChildren = todo.children;
            if (todoChildren.length>0) {
                for(var c in todoChildren) {
                    children.push(todoChildren[c]);
                }
                children.sort(sortByWeight);

                for(var c in children) {
                    genTask_r(children[c]);
                }
            }
        };

        var initTodo_r = function (id) {
            //var todoInfo = allTodo[id];
            //var todo = todoInfo.todo;
            var todo = self.model.get('todos2.'+id);
            if (!todo.del) {
                todoDict[id] = {todo:todo};

                for (var c in todo.children) {
                    var cid = todo.children[c];
                    initTodo_r(cid);
                }
            }
        };

        var sortByWeight = function (id1, id2) {
            var todo1 = todoDict[id1];
            var todo2 = todoDict[id2];

            if (todo2.weight > todo1.weight) {
                return 1;
            } else if (todo2.weight < todo1.weight) {
                return -1;
            } else {
                return 0;
            }
        };

        //var allTodo = {};
        for(var t in todos1) {
            var todo = todos1[t];

            if (!todo.del && !todo.parent) {
                rootIdList.push(todo.id);
            }

            //allTodo[todo.id] = {todo:todo};
        }

        //初始化
        for (var r in rootIdList) {
            var id = rootIdList[r];
            initTodo_r(id);
        }

        //估算时间/重要性
        for (var r in rootIdList) {
            var id = rootIdList[r];
            var todoInfo = todoDict[id];
            var todo = todoInfo.todo;

            todoInfo.estTime = estimateTime_r(id);
            todoInfo.importance = todo.importance ? todo.importance * 1000 : 1000;
            calcImportance_r(id);
        }

        //计算权重
        for (var id in todoDict) {
            var todoInfo = todoDict[id];
            todoInfo.weight = todoInfo.importance / todoInfo.estTime;
        }

        //按权重遍历树木
        rootIdList.sort(sortByWeight);
        for (var r in rootIdList) {
            var id = rootIdList[r];
            genTask_r(id);
        }
        //this.model.set('_page.todoList', todoList);
        return todoList;
    };

    model.subscribe(todoName, function() {
        console.log(1);
        //self.getTodoList(model.get('todos1'));
        model.fn('getTodoList', getTodoList);
        console.log(2);
        model.start('_page.todoList', 'todos1', 'getTodoList');
        console.log(3);
    });

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
    var model = this.model.root;
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

    //删除当前节点（没有真正删除，只是标记了一下）
    //model.del(todoName+'.'+nodeId);
    model.set(todoName+'.'+nodeId+'.del', true);
    model.set(todoName+'.'+nodeId+'.parent', null);
};

Tree.prototype.delAllChildren = function (nodeId) {
    var model = this.model;//.root;
    var node = model.get('todos2'+'.'+nodeId);

    //当前节点的子节点=[]
    model.set('todos2'+'.'+nodeId+'.children', []);

    console.log(nodeId);
    //所有子节点的父节点=null
    for(var cid in node.children) {
        var path = 'todos2'+'.'+node.children[cid];
        console.log(path);
        model.set(path + '.parent', null);
        console.log('fuck');
        model.set(path + '.del', true);
        console.log('shit');
    }

};

Tree.prototype.isOverdue = function (todoInfo) {
    var beginDate = this.model.get('_page.beginDate');
    return false;
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

Tree.prototype.setBeginDate = function () {
    this.setBeginDateDialog.show();
};

Tree.prototype.getOverdue = function (todoInfo, beginDate) {
    var now = moment().format('YYYY-MM-DD');
    if (!beginDate) {   //没有设定开始默认今天
        beginDate = now;
    }
    var due = moment(beginDate);
    var days = Math.floor(todoInfo.totalTime / 9);
    var weekends = [7];

    //从beginDate开始加天数，跳过周末
    var dueDay = due.days();
    var totalDays = 0;
    while(days>0) {
        ++dueDay;
        ++totalDays;
        if (dueDay>7) {
            dueDay = 1;
        }
        if (weekends.indexOf(dueDay)<0) {
            --days;
        }
    }
    due.add(totalDays, 'days');
    var overdue = due.diff(now, 'days');
    if (overdue>0) {
        var workdue = 0;
        var workday = moment().days();

        //去掉now到overdue之间的工作日
        for(var i=0; i<overdue; i++) {
            if (weekends.indexOf(workday++)<0) {
                ++workdue;
            }
            if (workday>7) {
                workday = 1;
            }
        }
        return workdue;
    } else {
        return overdue;
    }
};

Tree.prototype.lessThan = function(a,b) {
    return b<a;
};

Tree.prototype.lessThanHack = function(a,b,hack) {
    return b<a;
};

Tree.prototype.equalHack = function(a,b,hack) {
    return a==b;
};

Tree.prototype.getTodoStyle = function(todoList, nodeId) {
    var beginDate = this.model.get('_page.beginDate');
    for(var t in todoList) {
        var todoInfo = todoList[t];
        if (todoInfo.todo.id==nodeId) {
            if (todoInfo.todo.finished) {
                return 'background: #00a855; opacity: 0.6; color:white;'
            } else {
                var due = this.getOverdue(todoInfo, beginDate);
                if (due<=0) {
                    return 'background: #cf126e; opacity: 0.6; color:white;';
                } else if (due<4) {
                    return 'background: #ff892a; opacity: 0.6; color:white;';
                } else {
                    return 'border: 1px solid #32aefd;';
                }
            }
        }
    }
    return "";
};