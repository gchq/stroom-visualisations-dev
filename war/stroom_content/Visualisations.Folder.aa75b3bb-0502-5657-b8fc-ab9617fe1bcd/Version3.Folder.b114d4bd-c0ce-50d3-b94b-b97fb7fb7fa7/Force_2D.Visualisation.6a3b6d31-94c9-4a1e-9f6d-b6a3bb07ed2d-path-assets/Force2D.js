(() => {
  // node_modules/d3-dispatch/src/dispatch.js
  var noop = { value: () => {
  } };
  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }
  function Dispatch(_) {
    this._ = _;
  }
  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return { type: t, name };
    });
  }
  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._, T = parseTypenames(typename + "", _), t, i = -1, n = T.length;
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }
      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type2, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
      for (t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type2, that, args) {
      if (!this._.hasOwnProperty(type2)) throw new Error("unknown type: " + type2);
      for (var t = this._[type2], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };
  function get(type2, name) {
    for (var i = 0, n = type2.length, c2; i < n; ++i) {
      if ((c2 = type2[i]).name === name) {
        return c2.value;
      }
    }
  }
  function set(type2, name, callback) {
    for (var i = 0, n = type2.length; i < n; ++i) {
      if (type2[i].name === name) {
        type2[i] = noop, type2 = type2.slice(0, i).concat(type2.slice(i + 1));
        break;
      }
    }
    if (callback != null) type2.push({ name, value: callback });
    return type2;
  }
  var dispatch_default = dispatch;

  // node_modules/d3-selection/src/namespaces.js
  var xhtml = "http://www.w3.org/1999/xhtml";
  var namespaces_default = {
    svg: "http://www.w3.org/2000/svg",
    xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  // node_modules/d3-selection/src/namespace.js
  function namespace_default(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces_default.hasOwnProperty(prefix) ? { space: namespaces_default[prefix], local: name } : name;
  }

  // node_modules/d3-selection/src/creator.js
  function creatorInherit(name) {
    return function() {
      var document2 = this.ownerDocument, uri = this.namespaceURI;
      return uri === xhtml && document2.documentElement.namespaceURI === xhtml ? document2.createElement(name) : document2.createElementNS(uri, name);
    };
  }
  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }
  function creator_default(name) {
    var fullname = namespace_default(name);
    return (fullname.local ? creatorFixed : creatorInherit)(fullname);
  }

  // node_modules/d3-selection/src/selector.js
  function none() {
  }
  function selector_default(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  // node_modules/d3-selection/src/selection/select.js
  function select_default(select) {
    if (typeof select !== "function") select = selector_default(select);
    for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // node_modules/d3-selection/src/array.js
  function array(x3) {
    return x3 == null ? [] : Array.isArray(x3) ? x3 : Array.from(x3);
  }

  // node_modules/d3-selection/src/selectorAll.js
  function empty() {
    return [];
  }
  function selectorAll_default(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  // node_modules/d3-selection/src/selection/selectAll.js
  function arrayAll(select) {
    return function() {
      return array(select.apply(this, arguments));
    };
  }
  function selectAll_default(select) {
    if (typeof select === "function") select = arrayAll(select);
    else select = selectorAll_default(select);
    for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }
    return new Selection(subgroups, parents);
  }

  // node_modules/d3-selection/src/matcher.js
  function matcher_default(selector) {
    return function() {
      return this.matches(selector);
    };
  }
  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  // node_modules/d3-selection/src/selection/selectChild.js
  var find = Array.prototype.find;
  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }
  function childFirst() {
    return this.firstElementChild;
  }
  function selectChild_default(match) {
    return this.select(match == null ? childFirst : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  // node_modules/d3-selection/src/selection/selectChildren.js
  var filter = Array.prototype.filter;
  function children() {
    return Array.from(this.children);
  }
  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }
  function selectChildren_default(match) {
    return this.selectAll(match == null ? children : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  // node_modules/d3-selection/src/selection/filter.js
  function filter_default(match) {
    if (typeof match !== "function") match = matcher_default(match);
    for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Selection(subgroups, this._parents);
  }

  // node_modules/d3-selection/src/selection/sparse.js
  function sparse_default(update) {
    return new Array(update.length);
  }

  // node_modules/d3-selection/src/selection/enter.js
  function enter_default() {
    return new Selection(this._enter || this._groups.map(sparse_default), this._parents);
  }
  function EnterNode(parent, datum2) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum2;
  }
  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) {
      return this._parent.insertBefore(child, this._next);
    },
    insertBefore: function(child, next) {
      return this._parent.insertBefore(child, next);
    },
    querySelector: function(selector) {
      return this._parent.querySelector(selector);
    },
    querySelectorAll: function(selector) {
      return this._parent.querySelectorAll(selector);
    }
  };

  // node_modules/d3-selection/src/constant.js
  function constant_default(x3) {
    return function() {
      return x3;
    };
  }

  // node_modules/d3-selection/src/selection/data.js
  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0, node, groupLength = group.length, dataLength = data.length;
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }
  function bindKey(parent, group, enter, update, exit, data, key) {
    var i, node, nodeByKeyValue = /* @__PURE__ */ new Map(), groupLength = group.length, dataLength = data.length, keyValues = new Array(groupLength), keyValue;
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }
    for (i = 0; i < dataLength; ++i) {
      keyValue = key.call(parent, data[i], i, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && nodeByKeyValue.get(keyValues[i]) === node) {
        exit[i] = node;
      }
    }
  }
  function datum(node) {
    return node.__data__;
  }
  function data_default(value, key) {
    if (!arguments.length) return Array.from(this, datum);
    var bind = key ? bindKey : bindIndex, parents = this._parents, groups = this._groups;
    if (typeof value !== "function") value = constant_default(value);
    for (var m2 = groups.length, update = new Array(m2), enter = new Array(m2), exit = new Array(m2), j = 0; j < m2; ++j) {
      var parent = parents[j], group = groups[j], groupLength = group.length, data = arraylike(value.call(parent, parent && parent.__data__, j, parents)), dataLength = data.length, enterGroup = enter[j] = new Array(dataLength), updateGroup = update[j] = new Array(dataLength), exitGroup = exit[j] = new Array(groupLength);
      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength) ;
          previous._next = next || null;
        }
      }
    }
    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }
  function arraylike(data) {
    return typeof data === "object" && "length" in data ? data : Array.from(data);
  }

  // node_modules/d3-selection/src/selection/exit.js
  function exit_default() {
    return new Selection(this._exit || this._groups.map(sparse_default), this._parents);
  }

  // node_modules/d3-selection/src/selection/join.js
  function join_default(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter) enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update) update = update.selection();
    }
    if (onexit == null) exit.remove();
    else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  // node_modules/d3-selection/src/selection/merge.js
  function merge_default(context) {
    var selection2 = context.selection ? context.selection() : context;
    for (var groups0 = this._groups, groups1 = selection2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m2; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }
    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }
    return new Selection(merges, this._parents);
  }

  // node_modules/d3-selection/src/selection/order.js
  function order_default() {
    for (var groups = this._groups, j = -1, m2 = groups.length; ++j < m2; ) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  }

  // node_modules/d3-selection/src/selection/sort.js
  function sort_default(compare) {
    if (!compare) compare = ascending;
    function compareNode(a2, b) {
      return a2 && b ? compare(a2.__data__, b.__data__) : !a2 - !b;
    }
    for (var groups = this._groups, m2 = groups.length, sortgroups = new Array(m2), j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }
    return new Selection(sortgroups, this._parents).order();
  }
  function ascending(a2, b) {
    return a2 < b ? -1 : a2 > b ? 1 : a2 >= b ? 0 : NaN;
  }

  // node_modules/d3-selection/src/selection/call.js
  function call_default() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  // node_modules/d3-selection/src/selection/nodes.js
  function nodes_default() {
    return Array.from(this);
  }

  // node_modules/d3-selection/src/selection/node.js
  function node_default() {
    for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  }

  // node_modules/d3-selection/src/selection/size.js
  function size_default() {
    let size = 0;
    for (const node of this) ++size;
    return size;
  }

  // node_modules/d3-selection/src/selection/empty.js
  function empty_default() {
    return !this.node();
  }

  // node_modules/d3-selection/src/selection/each.js
  function each_default(callback) {
    for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }
    return this;
  }

  // node_modules/d3-selection/src/selection/attr.js
  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }
  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }
  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }
  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }
  function attr_default(name, value) {
    var fullname = namespace_default(name);
    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local ? node.getAttributeNS(fullname.space, fullname.local) : node.getAttribute(fullname);
    }
    return this.each((value == null ? fullname.local ? attrRemoveNS : attrRemove : typeof value === "function" ? fullname.local ? attrFunctionNS : attrFunction : fullname.local ? attrConstantNS : attrConstant)(fullname, value));
  }

  // node_modules/d3-selection/src/window.js
  function window_default(node) {
    return node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView;
  }

  // node_modules/d3-selection/src/selection/style.js
  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }
  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }
  function style_default(name, value, priority) {
    return arguments.length > 1 ? this.each((value == null ? styleRemove : typeof value === "function" ? styleFunction : styleConstant)(name, value, priority == null ? "" : priority)) : styleValue(this.node(), name);
  }
  function styleValue(node, name) {
    return node.style.getPropertyValue(name) || window_default(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  // node_modules/d3-selection/src/selection/property.js
  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }
  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }
  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }
  function property_default(name, value) {
    return arguments.length > 1 ? this.each((value == null ? propertyRemove : typeof value === "function" ? propertyFunction : propertyConstant)(name, value)) : this.node()[name];
  }

  // node_modules/d3-selection/src/selection/classed.js
  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }
  function classList(node) {
    return node.classList || new ClassList(node);
  }
  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }
  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };
  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }
  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }
  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }
  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }
  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }
  function classed_default(name, value) {
    var names = classArray(name + "");
    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }
    return this.each((typeof value === "function" ? classedFunction : value ? classedTrue : classedFalse)(names, value));
  }

  // node_modules/d3-selection/src/selection/text.js
  function textRemove() {
    this.textContent = "";
  }
  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }
  function text_default(value) {
    return arguments.length ? this.each(value == null ? textRemove : (typeof value === "function" ? textFunction : textConstant)(value)) : this.node().textContent;
  }

  // node_modules/d3-selection/src/selection/html.js
  function htmlRemove() {
    this.innerHTML = "";
  }
  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }
  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }
  function html_default(value) {
    return arguments.length ? this.each(value == null ? htmlRemove : (typeof value === "function" ? htmlFunction : htmlConstant)(value)) : this.node().innerHTML;
  }

  // node_modules/d3-selection/src/selection/raise.js
  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }
  function raise_default() {
    return this.each(raise);
  }

  // node_modules/d3-selection/src/selection/lower.js
  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }
  function lower_default() {
    return this.each(lower);
  }

  // node_modules/d3-selection/src/selection/append.js
  function append_default(name) {
    var create2 = typeof name === "function" ? name : creator_default(name);
    return this.select(function() {
      return this.appendChild(create2.apply(this, arguments));
    });
  }

  // node_modules/d3-selection/src/selection/insert.js
  function constantNull() {
    return null;
  }
  function insert_default(name, before) {
    var create2 = typeof name === "function" ? name : creator_default(name), select = before == null ? constantNull : typeof before === "function" ? before : selector_default(before);
    return this.select(function() {
      return this.insertBefore(create2.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  // node_modules/d3-selection/src/selection/remove.js
  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }
  function remove_default() {
    return this.each(remove);
  }

  // node_modules/d3-selection/src/selection/clone.js
  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }
  function clone_default(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  // node_modules/d3-selection/src/selection/datum.js
  function datum_default(value) {
    return arguments.length ? this.property("__data__", value) : this.node().__data__;
  }

  // node_modules/d3-selection/src/selection/on.js
  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }
  function parseTypenames2(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return { type: t, name };
    });
  }
  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m2 = on.length, o; j < m2; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }
  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o, listener = contextListener(value);
      if (on) for (var j = 0, m2 = on.length; j < m2; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, options);
      o = { type: typename.type, name: typename.name, value, listener, options };
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }
  function on_default(typename, value, options) {
    var typenames = parseTypenames2(typename + ""), i, n = typenames.length, t;
    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m2 = on.length, o; j < m2; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }
    on = value ? onAdd : onRemove;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
    return this;
  }

  // node_modules/d3-selection/src/selection/dispatch.js
  function dispatchEvent(node, type2, params) {
    var window2 = window_default(node), event = window2.CustomEvent;
    if (typeof event === "function") {
      event = new event(type2, params);
    } else {
      event = window2.document.createEvent("Event");
      if (params) event.initEvent(type2, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type2, false, false);
    }
    node.dispatchEvent(event);
  }
  function dispatchConstant(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params);
    };
  }
  function dispatchFunction(type2, params) {
    return function() {
      return dispatchEvent(this, type2, params.apply(this, arguments));
    };
  }
  function dispatch_default2(type2, params) {
    return this.each((typeof params === "function" ? dispatchFunction : dispatchConstant)(type2, params));
  }

  // node_modules/d3-selection/src/selection/iterator.js
  function* iterator_default() {
    for (var groups = this._groups, j = 0, m2 = groups.length; j < m2; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) yield node;
      }
    }
  }

  // node_modules/d3-selection/src/selection/index.js
  var root = [null];
  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }
  function selection() {
    return new Selection([[document.documentElement]], root);
  }
  function selection_selection() {
    return this;
  }
  Selection.prototype = selection.prototype = {
    constructor: Selection,
    select: select_default,
    selectAll: selectAll_default,
    selectChild: selectChild_default,
    selectChildren: selectChildren_default,
    filter: filter_default,
    data: data_default,
    enter: enter_default,
    exit: exit_default,
    join: join_default,
    merge: merge_default,
    selection: selection_selection,
    order: order_default,
    sort: sort_default,
    call: call_default,
    nodes: nodes_default,
    node: node_default,
    size: size_default,
    empty: empty_default,
    each: each_default,
    attr: attr_default,
    style: style_default,
    property: property_default,
    classed: classed_default,
    text: text_default,
    html: html_default,
    raise: raise_default,
    lower: lower_default,
    append: append_default,
    insert: insert_default,
    remove: remove_default,
    clone: clone_default,
    datum: datum_default,
    on: on_default,
    dispatch: dispatch_default2,
    [Symbol.iterator]: iterator_default
  };
  var selection_default = selection;

  // node_modules/d3-selection/src/select.js
  function select_default2(selector) {
    return typeof selector === "string" ? new Selection([[document.querySelector(selector)]], [document.documentElement]) : new Selection([[selector]], root);
  }

  // node_modules/d3-color/src/define.js
  function define_default(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }
  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  // node_modules/d3-color/src/color.js
  function Color() {
  }
  var darker = 0.7;
  var brighter = 1 / darker;
  var reI = "\\s*([+-]?\\d+)\\s*";
  var reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*";
  var reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*";
  var reHex = /^#([0-9a-f]{3,8})$/;
  var reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`);
  var reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`);
  var reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`);
  var reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`);
  var reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`);
  var reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);
  var named = {
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  };
  define_default(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor(), this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });
  function color_formatHex() {
    return this.rgb().formatHex();
  }
  function color_formatHex8() {
    return this.rgb().formatHex8();
  }
  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }
  function color_formatRgb() {
    return this.rgb().formatRgb();
  }
  function color(format2) {
    var m2, l;
    format2 = (format2 + "").trim().toLowerCase();
    return (m2 = reHex.exec(format2)) ? (l = m2[1].length, m2 = parseInt(m2[1], 16), l === 6 ? rgbn(m2) : l === 3 ? new Rgb(m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, (m2 & 15) << 4 | m2 & 15, 1) : l === 8 ? rgba(m2 >> 24 & 255, m2 >> 16 & 255, m2 >> 8 & 255, (m2 & 255) / 255) : l === 4 ? rgba(m2 >> 12 & 15 | m2 >> 8 & 240, m2 >> 8 & 15 | m2 >> 4 & 240, m2 >> 4 & 15 | m2 & 240, ((m2 & 15) << 4 | m2 & 15) / 255) : null) : (m2 = reRgbInteger.exec(format2)) ? new Rgb(m2[1], m2[2], m2[3], 1) : (m2 = reRgbPercent.exec(format2)) ? new Rgb(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, 1) : (m2 = reRgbaInteger.exec(format2)) ? rgba(m2[1], m2[2], m2[3], m2[4]) : (m2 = reRgbaPercent.exec(format2)) ? rgba(m2[1] * 255 / 100, m2[2] * 255 / 100, m2[3] * 255 / 100, m2[4]) : (m2 = reHslPercent.exec(format2)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, 1) : (m2 = reHslaPercent.exec(format2)) ? hsla(m2[1], m2[2] / 100, m2[3] / 100, m2[4]) : named.hasOwnProperty(format2) ? rgbn(named[format2]) : format2 === "transparent" ? new Rgb(NaN, NaN, NaN, 0) : null;
  }
  function rgbn(n) {
    return new Rgb(n >> 16 & 255, n >> 8 & 255, n & 255, 1);
  }
  function rgba(r, g, b, a2) {
    if (a2 <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a2);
  }
  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb();
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }
  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }
  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }
  define_default(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return -0.5 <= this.r && this.r < 255.5 && (-0.5 <= this.g && this.g < 255.5) && (-0.5 <= this.b && this.b < 255.5) && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex,
    // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));
  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }
  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }
  function rgb_formatRgb() {
    const a2 = clampa(this.opacity);
    return `${a2 === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a2 === 1 ? ")" : `, ${a2})`}`;
  }
  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }
  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }
  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }
  function hsla(h, s, l, a2) {
    if (a2 <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a2);
  }
  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl();
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255, g = o.g / 255, b = o.b / 255, min2 = Math.min(r, g, b), max2 = Math.max(r, g, b), h = NaN, s = max2 - min2, l = (max2 + min2) / 2;
    if (s) {
      if (r === max2) h = (g - b) / s + (g < b) * 6;
      else if (g === max2) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max2 + min2 : 2 - max2 - min2;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }
  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }
  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }
  define_default(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360, s = isNaN(h) || isNaN(this.s) ? 0 : this.s, l = this.l, m2 = l + (l < 0.5 ? l : 1 - l) * s, m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s)) && (0 <= this.l && this.l <= 1) && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a2 = clampa(this.opacity);
      return `${a2 === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a2 === 1 ? ")" : `, ${a2})`}`;
    }
  }));
  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }
  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60 : h < 180 ? m2 : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60 : m1) * 255;
  }

  // node_modules/d3-interpolate/src/basis.js
  function basis(t12, v0, v1, v2, v3) {
    var t2 = t12 * t12, t3 = t2 * t12;
    return ((1 - 3 * t12 + 3 * t2 - t3) * v0 + (4 - 6 * t2 + 3 * t3) * v1 + (1 + 3 * t12 + 3 * t2 - 3 * t3) * v2 + t3 * v3) / 6;
  }
  function basis_default(values) {
    var n = values.length - 1;
    return function(t) {
      var i = t <= 0 ? t = 0 : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n), v1 = values[i], v2 = values[i + 1], v0 = i > 0 ? values[i - 1] : 2 * v1 - v2, v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/basisClosed.js
  function basisClosed_default(values) {
    var n = values.length;
    return function(t) {
      var i = Math.floor(((t %= 1) < 0 ? ++t : t) * n), v0 = values[(i + n - 1) % n], v1 = values[i % n], v2 = values[(i + 1) % n], v3 = values[(i + 2) % n];
      return basis((t - i / n) * n, v0, v1, v2, v3);
    };
  }

  // node_modules/d3-interpolate/src/constant.js
  var constant_default2 = (x3) => () => x3;

  // node_modules/d3-interpolate/src/color.js
  function linear(a2, d) {
    return function(t) {
      return a2 + t * d;
    };
  }
  function exponential(a2, b, y3) {
    return a2 = Math.pow(a2, y3), b = Math.pow(b, y3) - a2, y3 = 1 / y3, function(t) {
      return Math.pow(a2 + t * b, y3);
    };
  }
  function gamma(y3) {
    return (y3 = +y3) === 1 ? nogamma : function(a2, b) {
      return b - a2 ? exponential(a2, b, y3) : constant_default2(isNaN(a2) ? b : a2);
    };
  }
  function nogamma(a2, b) {
    var d = b - a2;
    return d ? linear(a2, d) : constant_default2(isNaN(a2) ? b : a2);
  }

  // node_modules/d3-interpolate/src/rgb.js
  var rgb_default = (function rgbGamma(y3) {
    var color2 = gamma(y3);
    function rgb2(start2, end) {
      var r = color2((start2 = rgb(start2)).r, (end = rgb(end)).r), g = color2(start2.g, end.g), b = color2(start2.b, end.b), opacity = nogamma(start2.opacity, end.opacity);
      return function(t) {
        start2.r = r(t);
        start2.g = g(t);
        start2.b = b(t);
        start2.opacity = opacity(t);
        return start2 + "";
      };
    }
    rgb2.gamma = rgbGamma;
    return rgb2;
  })(1);
  function rgbSpline(spline) {
    return function(colors) {
      var n = colors.length, r = new Array(n), g = new Array(n), b = new Array(n), i, color2;
      for (i = 0; i < n; ++i) {
        color2 = rgb(colors[i]);
        r[i] = color2.r || 0;
        g[i] = color2.g || 0;
        b[i] = color2.b || 0;
      }
      r = spline(r);
      g = spline(g);
      b = spline(b);
      color2.opacity = 1;
      return function(t) {
        color2.r = r(t);
        color2.g = g(t);
        color2.b = b(t);
        return color2 + "";
      };
    };
  }
  var rgbBasis = rgbSpline(basis_default);
  var rgbBasisClosed = rgbSpline(basisClosed_default);

  // node_modules/d3-interpolate/src/number.js
  function number_default(a2, b) {
    return a2 = +a2, b = +b, function(t) {
      return a2 * (1 - t) + b * t;
    };
  }

  // node_modules/d3-interpolate/src/string.js
  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
  var reB = new RegExp(reA.source, "g");
  function zero(b) {
    return function() {
      return b;
    };
  }
  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }
  function string_default(a2, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a2 = a2 + "", b = b + "";
    while ((am = reA.exec(a2)) && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs;
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm;
        else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({ i, x: number_default(am, bm) });
      }
      bi = reB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs;
      else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? one(q[0].x) : zero(b) : (b = q.length, function(t) {
      for (var i2 = 0, o; i2 < b; ++i2) s[(o = q[i2]).i] = o.x(t);
      return s.join("");
    });
  }

  // node_modules/d3-interpolate/src/transform/decompose.js
  var degrees = 180 / Math.PI;
  var identity = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };
  function decompose_default(a2, b, c2, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a2 * a2 + b * b)) a2 /= scaleX, b /= scaleX;
    if (skewX = a2 * c2 + b * d) c2 -= a2 * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c2 * c2 + d * d)) c2 /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a2 * d < b * c2) a2 = -a2, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a2) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX,
      scaleY
    };
  }

  // node_modules/d3-interpolate/src/transform/parse.js
  var svgNode;
  function parseCss(value) {
    const m2 = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
    return m2.isIdentity ? identity : decompose_default(m2.a, m2.b, m2.c, m2.d, m2.e, m2.f);
  }
  function parseSvg(value) {
    if (value == null) return identity;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
    value = value.matrix;
    return decompose_default(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  // node_modules/d3-interpolate/src/transform/index.js
  function interpolateTransform(parse, pxComma, pxParen, degParen) {
    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }
    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }
    function rotate(a2, b, s, q) {
      if (a2 !== b) {
        if (a2 - b > 180) b += 360;
        else if (b - a2 > 180) a2 += 360;
        q.push({ i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: number_default(a2, b) });
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }
    function skewX(a2, b, s, q) {
      if (a2 !== b) {
        q.push({ i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: number_default(a2, b) });
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }
    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({ i: i - 4, x: number_default(xa, xb) }, { i: i - 2, x: number_default(ya, yb) });
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }
    return function(a2, b) {
      var s = [], q = [];
      a2 = parse(a2), b = parse(b);
      translate(a2.translateX, a2.translateY, b.translateX, b.translateY, s, q);
      rotate(a2.rotate, b.rotate, s, q);
      skewX(a2.skewX, b.skewX, s, q);
      scale(a2.scaleX, a2.scaleY, b.scaleX, b.scaleY, s, q);
      a2 = b = null;
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }
  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  // node_modules/d3-interpolate/src/quantize.js
  function quantize_default(interpolator, n) {
    var samples = new Array(n);
    for (var i = 0; i < n; ++i) samples[i] = interpolator(i / (n - 1));
    return samples;
  }

  // node_modules/d3-timer/src/timer.js
  var frame = 0;
  var timeout = 0;
  var interval = 0;
  var pokeDelay = 1e3;
  var taskHead;
  var taskTail;
  var clockLast = 0;
  var clockNow = 0;
  var clockSkew = 0;
  var clock = typeof performance === "object" && performance.now ? performance : Date;
  var setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) {
    setTimeout(f, 17);
  };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }
  function clearNow() {
    clockNow = 0;
  }
  function Timer() {
    this._call = this._time = this._next = null;
  }
  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };
  function timer(callback, delay, time) {
    var t = new Timer();
    t.restart(callback, delay, time);
    return t;
  }
  function timerFlush() {
    now();
    ++frame;
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(void 0, e);
      t = t._next;
    }
    --frame;
  }
  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }
  function poke() {
    var now2 = clock.now(), delay = now2 - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now2;
  }
  function nap() {
    var t02, t12 = taskHead, t2, time = Infinity;
    while (t12) {
      if (t12._call) {
        if (time > t12._time) time = t12._time;
        t02 = t12, t12 = t12._next;
      } else {
        t2 = t12._next, t12._next = null;
        t12 = t02 ? t02._next = t2 : taskHead = t2;
      }
    }
    taskTail = t02;
    sleep(time);
  }
  function sleep(time) {
    if (frame) return;
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow;
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  // node_modules/d3-timer/src/timeout.js
  function timeout_default(callback, delay, time) {
    var t = new Timer();
    delay = delay == null ? 0 : +delay;
    t.restart((elapsed) => {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  // node_modules/d3-transition/src/transition/schedule.js
  var emptyOn = dispatch_default("start", "end", "cancel", "interrupt");
  var emptyTween = [];
  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;
  function schedule_default(node, name, id2, index2, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id2 in schedules) return;
    create(node, id2, {
      name,
      index: index2,
      // For context during callback.
      group,
      // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }
  function init(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }
  function set2(node, id2) {
    var schedule = get2(node, id2);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }
  function get2(node, id2) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id2])) throw new Error("transition not found");
    return schedule;
  }
  function create(node, id2, self) {
    var schedules = node.__transition, tween;
    schedules[id2] = self;
    self.timer = timer(schedule, 0, self.time);
    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start2, self.delay, self.time);
      if (self.delay <= elapsed) start2(elapsed - self.delay);
    }
    function start2(elapsed) {
      var i, j, n, o;
      if (self.state !== SCHEDULED) return stop();
      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;
        if (o.state === STARTED) return timeout_default(start2);
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        } else if (+i < id2) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }
      timeout_default(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return;
      self.state = STARTED;
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }
    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1), i = -1, n = tween.length;
      while (++i < n) {
        tween[i].call(node, t);
      }
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }
    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id2];
      for (var i in schedules) return;
      delete node.__transition;
    }
  }

  // node_modules/d3-transition/src/interrupt.js
  function interrupt_default(node, name) {
    var schedules = node.__transition, schedule, active, empty2 = true, i;
    if (!schedules) return;
    name = name == null ? null : name + "";
    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) {
        empty2 = false;
        continue;
      }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }
    if (empty2) delete node.__transition;
  }

  // node_modules/d3-transition/src/selection/interrupt.js
  function interrupt_default2(name) {
    return this.each(function() {
      interrupt_default(this, name);
    });
  }

  // node_modules/d3-transition/src/transition/tween.js
  function tweenRemove(id2, name) {
    var tween0, tween1;
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }
      schedule.tween = tween1;
    };
  }
  function tweenFunction(id2, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error();
    return function() {
      var schedule = set2(this, id2), tween = schedule.tween;
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = { name, value }, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }
      schedule.tween = tween1;
    };
  }
  function tween_default(name, value) {
    var id2 = this._id;
    name += "";
    if (arguments.length < 2) {
      var tween = get2(this.node(), id2).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }
    return this.each((value == null ? tweenRemove : tweenFunction)(id2, name, value));
  }
  function tweenValue(transition2, name, value) {
    var id2 = transition2._id;
    transition2.each(function() {
      var schedule = set2(this, id2);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });
    return function(node) {
      return get2(node, id2).value[name];
    };
  }

  // node_modules/d3-transition/src/transition/interpolate.js
  function interpolate_default(a2, b) {
    var c2;
    return (typeof b === "number" ? number_default : b instanceof color ? rgb_default : (c2 = color(b)) ? (b = c2, rgb_default) : string_default)(a2, b);
  }

  // node_modules/d3-transition/src/transition/attr.js
  function attrRemove2(name) {
    return function() {
      this.removeAttribute(name);
    };
  }
  function attrRemoveNS2(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }
  function attrConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrConstantNS2(fullname, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function attrFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attrFunctionNS2(fullname, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function attr_default2(name, value) {
    var fullname = namespace_default(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate_default;
    return this.attrTween(name, typeof value === "function" ? (fullname.local ? attrFunctionNS2 : attrFunction2)(fullname, i, tweenValue(this, "attr." + name, value)) : value == null ? (fullname.local ? attrRemoveNS2 : attrRemove2)(fullname) : (fullname.local ? attrConstantNS2 : attrConstant2)(fullname, i, value));
  }

  // node_modules/d3-transition/src/transition/attrTween.js
  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }
  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }
  function attrTweenNS(fullname, value) {
    var t02, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t02 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function attrTween(name, value) {
    var t02, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t02 = (i0 = i) && attrInterpolate(name, i);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function attrTween_default(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error();
    var fullname = namespace_default(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  // node_modules/d3-transition/src/transition/delay.js
  function delayFunction(id2, value) {
    return function() {
      init(this, id2).delay = +value.apply(this, arguments);
    };
  }
  function delayConstant(id2, value) {
    return value = +value, function() {
      init(this, id2).delay = value;
    };
  }
  function delay_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? delayFunction : delayConstant)(id2, value)) : get2(this.node(), id2).delay;
  }

  // node_modules/d3-transition/src/transition/duration.js
  function durationFunction(id2, value) {
    return function() {
      set2(this, id2).duration = +value.apply(this, arguments);
    };
  }
  function durationConstant(id2, value) {
    return value = +value, function() {
      set2(this, id2).duration = value;
    };
  }
  function duration_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each((typeof value === "function" ? durationFunction : durationConstant)(id2, value)) : get2(this.node(), id2).duration;
  }

  // node_modules/d3-transition/src/transition/ease.js
  function easeConstant(id2, value) {
    if (typeof value !== "function") throw new Error();
    return function() {
      set2(this, id2).ease = value;
    };
  }
  function ease_default(value) {
    var id2 = this._id;
    return arguments.length ? this.each(easeConstant(id2, value)) : get2(this.node(), id2).ease;
  }

  // node_modules/d3-transition/src/transition/easeVarying.js
  function easeVarying(id2, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (typeof v !== "function") throw new Error();
      set2(this, id2).ease = v;
    };
  }
  function easeVarying_default(value) {
    if (typeof value !== "function") throw new Error();
    return this.each(easeVarying(this._id, value));
  }

  // node_modules/d3-transition/src/transition/filter.js
  function filter_default2(match) {
    if (typeof match !== "function") match = matcher_default(match);
    for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }
    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  // node_modules/d3-transition/src/transition/merge.js
  function merge_default2(transition2) {
    if (transition2._id !== this._id) throw new Error();
    for (var groups0 = this._groups, groups1 = transition2._groups, m0 = groups0.length, m1 = groups1.length, m2 = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m2; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }
    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }
    return new Transition(merges, this._parents, this._name, this._id);
  }

  // node_modules/d3-transition/src/transition/on.js
  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }
  function onFunction(id2, name, listener) {
    var on0, on1, sit = start(name) ? init : set2;
    return function() {
      var schedule = sit(this, id2), on = schedule.on;
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);
      schedule.on = on1;
    };
  }
  function on_default2(name, listener) {
    var id2 = this._id;
    return arguments.length < 2 ? get2(this.node(), id2).on.on(name) : this.each(onFunction(id2, name, listener));
  }

  // node_modules/d3-transition/src/transition/remove.js
  function removeFunction(id2) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id2) return;
      if (parent) parent.removeChild(this);
    };
  }
  function remove_default2() {
    return this.on("end.remove", removeFunction(this._id));
  }

  // node_modules/d3-transition/src/transition/select.js
  function select_default3(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function") select = selector_default(select);
    for (var groups = this._groups, m2 = groups.length, subgroups = new Array(m2), j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule_default(subgroup[i], name, id2, i, subgroup, get2(node, id2));
        }
      }
    }
    return new Transition(subgroups, this._parents, name, id2);
  }

  // node_modules/d3-transition/src/transition/selectAll.js
  function selectAll_default2(select) {
    var name = this._name, id2 = this._id;
    if (typeof select !== "function") select = selectorAll_default(select);
    for (var groups = this._groups, m2 = groups.length, subgroups = [], parents = [], j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children2 = select.call(node, node.__data__, i, group), child, inherit2 = get2(node, id2), k = 0, l = children2.length; k < l; ++k) {
            if (child = children2[k]) {
              schedule_default(child, name, id2, k, children2, inherit2);
            }
          }
          subgroups.push(children2);
          parents.push(node);
        }
      }
    }
    return new Transition(subgroups, parents, name, id2);
  }

  // node_modules/d3-transition/src/transition/selection.js
  var Selection2 = selection_default.prototype.constructor;
  function selection_default2() {
    return new Selection2(this._groups, this._parents);
  }

  // node_modules/d3-transition/src/transition/style.js
  function styleNull(name, interpolate) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), string1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }
  function styleRemove2(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }
  function styleConstant2(name, interpolate, value1) {
    var string00, string1 = value1 + "", interpolate0;
    return function() {
      var string0 = styleValue(this, name);
      return string0 === string1 ? null : string0 === string00 ? interpolate0 : interpolate0 = interpolate(string00 = string0, value1);
    };
  }
  function styleFunction2(name, interpolate, value) {
    var string00, string10, interpolate0;
    return function() {
      var string0 = styleValue(this, name), value1 = value(this), string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
      return string0 === string1 ? null : string0 === string00 && string1 === string10 ? interpolate0 : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }
  function styleMaybeRemove(id2, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove2;
    return function() {
      var schedule = set2(this, id2), on = schedule.on, listener = schedule.value[key] == null ? remove2 || (remove2 = styleRemove2(name)) : void 0;
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);
      schedule.on = on1;
    };
  }
  function style_default2(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate_default;
    return value == null ? this.styleTween(name, styleNull(name, i)).on("end.style." + name, styleRemove2(name)) : typeof value === "function" ? this.styleTween(name, styleFunction2(name, i, tweenValue(this, "style." + name, value))).each(styleMaybeRemove(this._id, name)) : this.styleTween(name, styleConstant2(name, i, value), priority).on("end.style." + name, null);
  }

  // node_modules/d3-transition/src/transition/styleTween.js
  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }
  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }
  function styleTween_default(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error();
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  // node_modules/d3-transition/src/transition/text.js
  function textConstant2(value) {
    return function() {
      this.textContent = value;
    };
  }
  function textFunction2(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }
  function text_default2(value) {
    return this.tween("text", typeof value === "function" ? textFunction2(tweenValue(this, "text", value)) : textConstant2(value == null ? "" : value + ""));
  }

  // node_modules/d3-transition/src/transition/textTween.js
  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }
  function textTween(value) {
    var t02, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t02 = (i0 = i) && textInterpolate(i);
      return t02;
    }
    tween._value = value;
    return tween;
  }
  function textTween_default(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error();
    return this.tween(key, textTween(value));
  }

  // node_modules/d3-transition/src/transition/transition.js
  function transition_default() {
    var name = this._name, id0 = this._id, id1 = newId();
    for (var groups = this._groups, m2 = groups.length, j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit2 = get2(node, id0);
          schedule_default(node, name, id1, i, group, {
            time: inherit2.time + inherit2.delay + inherit2.duration,
            delay: 0,
            duration: inherit2.duration,
            ease: inherit2.ease
          });
        }
      }
    }
    return new Transition(groups, this._parents, name, id1);
  }

  // node_modules/d3-transition/src/transition/end.js
  function end_default() {
    var on0, on1, that = this, id2 = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = { value: reject }, end = { value: function() {
        if (--size === 0) resolve();
      } };
      that.each(function() {
        var schedule = set2(this, id2), on = schedule.on;
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }
        schedule.on = on1;
      });
      if (size === 0) resolve();
    });
  }

  // node_modules/d3-transition/src/transition/index.js
  var id = 0;
  function Transition(groups, parents, name, id2) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id2;
  }
  function transition(name) {
    return selection_default().transition(name);
  }
  function newId() {
    return ++id;
  }
  var selection_prototype = selection_default.prototype;
  Transition.prototype = transition.prototype = {
    constructor: Transition,
    select: select_default3,
    selectAll: selectAll_default2,
    selectChild: selection_prototype.selectChild,
    selectChildren: selection_prototype.selectChildren,
    filter: filter_default2,
    merge: merge_default2,
    selection: selection_default2,
    transition: transition_default,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: on_default2,
    attr: attr_default2,
    attrTween: attrTween_default,
    style: style_default2,
    styleTween: styleTween_default,
    text: text_default2,
    textTween: textTween_default,
    remove: remove_default2,
    tween: tween_default,
    delay: delay_default,
    duration: duration_default,
    ease: ease_default,
    easeVarying: easeVarying_default,
    end: end_default,
    [Symbol.iterator]: selection_prototype[Symbol.iterator]
  };

  // node_modules/d3-ease/src/cubic.js
  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  // node_modules/d3-transition/src/selection/transition.js
  var defaultTiming = {
    time: null,
    // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };
  function inherit(node, id2) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id2])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id2} not found`);
      }
    }
    return timing;
  }
  function transition_default2(name) {
    var id2, timing;
    if (name instanceof Transition) {
      id2 = name._id, name = name._name;
    } else {
      id2 = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }
    for (var groups = this._groups, m2 = groups.length, j = 0; j < m2; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule_default(node, name, id2, i, group, timing || inherit(node, id2));
        }
      }
    }
    return new Transition(groups, this._parents, name, id2);
  }

  // node_modules/d3-transition/src/selection/index.js
  selection_default.prototype.interrupt = interrupt_default2;
  selection_default.prototype.transition = transition_default2;

  // node_modules/d3-brush/src/brush.js
  var { abs, max, min } = Math;
  function number1(e) {
    return [+e[0], +e[1]];
  }
  function number2(e) {
    return [number1(e[0]), number1(e[1])];
  }
  var X = {
    name: "x",
    handles: ["w", "e"].map(type),
    input: function(x3, e) {
      return x3 == null ? null : [[+x3[0], e[0][1]], [+x3[1], e[1][1]]];
    },
    output: function(xy) {
      return xy && [xy[0][0], xy[1][0]];
    }
  };
  var Y = {
    name: "y",
    handles: ["n", "s"].map(type),
    input: function(y3, e) {
      return y3 == null ? null : [[e[0][0], +y3[0]], [e[1][0], +y3[1]]];
    },
    output: function(xy) {
      return xy && [xy[0][1], xy[1][1]];
    }
  };
  var XY = {
    name: "xy",
    handles: ["n", "w", "e", "s", "nw", "ne", "sw", "se"].map(type),
    input: function(xy) {
      return xy == null ? null : number2(xy);
    },
    output: function(xy) {
      return xy;
    }
  };
  function type(t) {
    return { type: t };
  }

  // node_modules/d3-path/src/path.js
  var pi = Math.PI;
  var tau = 2 * pi;
  var epsilon = 1e-6;
  var tauEpsilon = tau - epsilon;
  function append(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += arguments[i] + strings[i];
    }
  }
  function appendRound(digits) {
    let d = Math.floor(digits);
    if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
    if (d > 15) return append;
    const k = 10 ** d;
    return function(strings) {
      this._ += strings[0];
      for (let i = 1, n = strings.length; i < n; ++i) {
        this._ += Math.round(arguments[i] * k) / k + strings[i];
      }
    };
  }
  var Path = class {
    constructor(digits) {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null;
      this._ = "";
      this._append = digits == null ? append : appendRound(digits);
    }
    moveTo(x3, y3) {
      this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y3}`;
    }
    closePath() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._append`Z`;
      }
    }
    lineTo(x3, y3) {
      this._append`L${this._x1 = +x3},${this._y1 = +y3}`;
    }
    quadraticCurveTo(x1, y1, x3, y3) {
      this._append`Q${+x1},${+y1},${this._x1 = +x3},${this._y1 = +y3}`;
    }
    bezierCurveTo(x1, y1, x22, y22, x3, y3) {
      this._append`C${+x1},${+y1},${+x22},${+y22},${this._x1 = +x3},${this._y1 = +y3}`;
    }
    arcTo(x1, y1, x22, y22, r) {
      x1 = +x1, y1 = +y1, x22 = +x22, y22 = +y22, r = +r;
      if (r < 0) throw new Error(`negative radius: ${r}`);
      let x0 = this._x1, y0 = this._y1, x21 = x22 - x1, y21 = y22 - y1, x01 = x0 - x1, y01 = y0 - y1, l01_2 = x01 * x01 + y01 * y01;
      if (this._x1 === null) {
        this._append`M${this._x1 = x1},${this._y1 = y1}`;
      } else if (!(l01_2 > epsilon)) ;
      else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon) || !r) {
        this._append`L${this._x1 = x1},${this._y1 = y1}`;
      } else {
        let x20 = x22 - x0, y20 = y22 - y0, l21_2 = x21 * x21 + y21 * y21, l20_2 = x20 * x20 + y20 * y20, l21 = Math.sqrt(l21_2), l01 = Math.sqrt(l01_2), l = r * Math.tan((pi - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2), t01 = l / l01, t21 = l / l21;
        if (Math.abs(t01 - 1) > epsilon) {
          this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
        }
        this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
      }
    }
    arc(x3, y3, r, a0, a1, ccw) {
      x3 = +x3, y3 = +y3, r = +r, ccw = !!ccw;
      if (r < 0) throw new Error(`negative radius: ${r}`);
      let dx = r * Math.cos(a0), dy = r * Math.sin(a0), x0 = x3 + dx, y0 = y3 + dy, cw = 1 ^ ccw, da = ccw ? a0 - a1 : a1 - a0;
      if (this._x1 === null) {
        this._append`M${x0},${y0}`;
      } else if (Math.abs(this._x1 - x0) > epsilon || Math.abs(this._y1 - y0) > epsilon) {
        this._append`L${x0},${y0}`;
      }
      if (!r) return;
      if (da < 0) da = da % tau + tau;
      if (da > tauEpsilon) {
        this._append`A${r},${r},0,1,${cw},${x3 - dx},${y3 - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
      } else if (da > epsilon) {
        this._append`A${r},${r},0,${+(da >= pi)},${cw},${this._x1 = x3 + r * Math.cos(a1)},${this._y1 = y3 + r * Math.sin(a1)}`;
      }
    }
    rect(x3, y3, w, h) {
      this._append`M${this._x0 = this._x1 = +x3},${this._y0 = this._y1 = +y3}h${w = +w}v${+h}h${-w}Z`;
    }
    toString() {
      return this._;
    }
  };
  function path() {
    return new Path();
  }
  path.prototype = Path.prototype;

  // node_modules/d3-force/src/center.js
  function center_default(x3, y3) {
    var nodes, strength = 1;
    if (x3 == null) x3 = 0;
    if (y3 == null) y3 = 0;
    function force() {
      var i, n = nodes.length, node, sx = 0, sy = 0;
      for (i = 0; i < n; ++i) {
        node = nodes[i], sx += node.x, sy += node.y;
      }
      for (sx = (sx / n - x3) * strength, sy = (sy / n - y3) * strength, i = 0; i < n; ++i) {
        node = nodes[i], node.x -= sx, node.y -= sy;
      }
    }
    force.initialize = function(_) {
      nodes = _;
    };
    force.x = function(_) {
      return arguments.length ? (x3 = +_, force) : x3;
    };
    force.y = function(_) {
      return arguments.length ? (y3 = +_, force) : y3;
    };
    force.strength = function(_) {
      return arguments.length ? (strength = +_, force) : strength;
    };
    return force;
  }

  // node_modules/d3-quadtree/src/add.js
  function add_default(d) {
    const x3 = +this._x.call(null, d), y3 = +this._y.call(null, d);
    return add(this.cover(x3, y3), x3, y3, d);
  }
  function add(tree, x3, y3, d) {
    if (isNaN(x3) || isNaN(y3)) return tree;
    var parent, node = tree._root, leaf = { data: d }, x0 = tree._x0, y0 = tree._y0, x1 = tree._x1, y1 = tree._y1, xm, ym, xp, yp, right, bottom, i, j;
    if (!node) return tree._root = leaf, tree;
    while (node.length) {
      if (right = x3 >= (xm = (x0 + x1) / 2)) x0 = xm;
      else x1 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2)) y0 = ym;
      else y1 = ym;
      if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
    }
    xp = +tree._x.call(null, node.data);
    yp = +tree._y.call(null, node.data);
    if (x3 === xp && y3 === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;
    do {
      parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
      if (right = x3 >= (xm = (x0 + x1) / 2)) x0 = xm;
      else x1 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2)) y0 = ym;
      else y1 = ym;
    } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
    return parent[j] = node, parent[i] = leaf, tree;
  }
  function addAll(data) {
    var d, i, n = data.length, x3, y3, xz = new Array(n), yz = new Array(n), x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (i = 0; i < n; ++i) {
      if (isNaN(x3 = +this._x.call(null, d = data[i])) || isNaN(y3 = +this._y.call(null, d))) continue;
      xz[i] = x3;
      yz[i] = y3;
      if (x3 < x0) x0 = x3;
      if (x3 > x1) x1 = x3;
      if (y3 < y0) y0 = y3;
      if (y3 > y1) y1 = y3;
    }
    if (x0 > x1 || y0 > y1) return this;
    this.cover(x0, y0).cover(x1, y1);
    for (i = 0; i < n; ++i) {
      add(this, xz[i], yz[i], data[i]);
    }
    return this;
  }

  // node_modules/d3-quadtree/src/cover.js
  function cover_default(x3, y3) {
    if (isNaN(x3 = +x3) || isNaN(y3 = +y3)) return this;
    var x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1;
    if (isNaN(x0)) {
      x1 = (x0 = Math.floor(x3)) + 1;
      y1 = (y0 = Math.floor(y3)) + 1;
    } else {
      var z = x1 - x0 || 1, node = this._root, parent, i;
      while (x0 > x3 || x3 >= x1 || y0 > y3 || y3 >= y1) {
        i = (y3 < y0) << 1 | x3 < x0;
        parent = new Array(4), parent[i] = node, node = parent, z *= 2;
        switch (i) {
          case 0:
            x1 = x0 + z, y1 = y0 + z;
            break;
          case 1:
            x0 = x1 - z, y1 = y0 + z;
            break;
          case 2:
            x1 = x0 + z, y0 = y1 - z;
            break;
          case 3:
            x0 = x1 - z, y0 = y1 - z;
            break;
        }
      }
      if (this._root && this._root.length) this._root = node;
    }
    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    return this;
  }

  // node_modules/d3-quadtree/src/data.js
  function data_default2() {
    var data = [];
    this.visit(function(node) {
      if (!node.length) do
        data.push(node.data);
      while (node = node.next);
    });
    return data;
  }

  // node_modules/d3-quadtree/src/extent.js
  function extent_default(_) {
    return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? void 0 : [[this._x0, this._y0], [this._x1, this._y1]];
  }

  // node_modules/d3-quadtree/src/quad.js
  function quad_default(node, x0, y0, x1, y1) {
    this.node = node;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }

  // node_modules/d3-quadtree/src/find.js
  function find_default(x3, y3, radius) {
    var data, x0 = this._x0, y0 = this._y0, x1, y1, x22, y22, x32 = this._x1, y32 = this._y1, quads = [], node = this._root, q, i;
    if (node) quads.push(new quad_default(node, x0, y0, x32, y32));
    if (radius == null) radius = Infinity;
    else {
      x0 = x3 - radius, y0 = y3 - radius;
      x32 = x3 + radius, y32 = y3 + radius;
      radius *= radius;
    }
    while (q = quads.pop()) {
      if (!(node = q.node) || (x1 = q.x0) > x32 || (y1 = q.y0) > y32 || (x22 = q.x1) < x0 || (y22 = q.y1) < y0) continue;
      if (node.length) {
        var xm = (x1 + x22) / 2, ym = (y1 + y22) / 2;
        quads.push(
          new quad_default(node[3], xm, ym, x22, y22),
          new quad_default(node[2], x1, ym, xm, y22),
          new quad_default(node[1], xm, y1, x22, ym),
          new quad_default(node[0], x1, y1, xm, ym)
        );
        if (i = (y3 >= ym) << 1 | x3 >= xm) {
          q = quads[quads.length - 1];
          quads[quads.length - 1] = quads[quads.length - 1 - i];
          quads[quads.length - 1 - i] = q;
        }
      } else {
        var dx = x3 - +this._x.call(null, node.data), dy = y3 - +this._y.call(null, node.data), d2 = dx * dx + dy * dy;
        if (d2 < radius) {
          var d = Math.sqrt(radius = d2);
          x0 = x3 - d, y0 = y3 - d;
          x32 = x3 + d, y32 = y3 + d;
          data = node.data;
        }
      }
    }
    return data;
  }

  // node_modules/d3-quadtree/src/remove.js
  function remove_default3(d) {
    if (isNaN(x3 = +this._x.call(null, d)) || isNaN(y3 = +this._y.call(null, d))) return this;
    var parent, node = this._root, retainer, previous, next, x0 = this._x0, y0 = this._y0, x1 = this._x1, y1 = this._y1, x3, y3, xm, ym, right, bottom, i, j;
    if (!node) return this;
    if (node.length) while (true) {
      if (right = x3 >= (xm = (x0 + x1) / 2)) x0 = xm;
      else x1 = xm;
      if (bottom = y3 >= (ym = (y0 + y1) / 2)) y0 = ym;
      else y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
      if (!node.length) break;
      if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3]) retainer = parent, j = i;
    }
    while (node.data !== d) if (!(previous = node, node = node.next)) return this;
    if (next = node.next) delete node.next;
    if (previous) return next ? previous.next = next : delete previous.next, this;
    if (!parent) return this._root = next, this;
    next ? parent[i] = next : delete parent[i];
    if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
      if (retainer) retainer[j] = node;
      else this._root = node;
    }
    return this;
  }
  function removeAll(data) {
    for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
    return this;
  }

  // node_modules/d3-quadtree/src/root.js
  function root_default() {
    return this._root;
  }

  // node_modules/d3-quadtree/src/size.js
  function size_default2() {
    var size = 0;
    this.visit(function(node) {
      if (!node.length) do
        ++size;
      while (node = node.next);
    });
    return size;
  }

  // node_modules/d3-quadtree/src/visit.js
  function visit_default(callback) {
    var quads = [], q, node = this._root, child, x0, y0, x1, y1;
    if (node) quads.push(new quad_default(node, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
        var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        if (child = node[3]) quads.push(new quad_default(child, xm, ym, x1, y1));
        if (child = node[2]) quads.push(new quad_default(child, x0, ym, xm, y1));
        if (child = node[1]) quads.push(new quad_default(child, xm, y0, x1, ym));
        if (child = node[0]) quads.push(new quad_default(child, x0, y0, xm, ym));
      }
    }
    return this;
  }

  // node_modules/d3-quadtree/src/visitAfter.js
  function visitAfter_default(callback) {
    var quads = [], next = [], q;
    if (this._root) quads.push(new quad_default(this._root, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      var node = q.node;
      if (node.length) {
        var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
        if (child = node[0]) quads.push(new quad_default(child, x0, y0, xm, ym));
        if (child = node[1]) quads.push(new quad_default(child, xm, y0, x1, ym));
        if (child = node[2]) quads.push(new quad_default(child, x0, ym, xm, y1));
        if (child = node[3]) quads.push(new quad_default(child, xm, ym, x1, y1));
      }
      next.push(q);
    }
    while (q = next.pop()) {
      callback(q.node, q.x0, q.y0, q.x1, q.y1);
    }
    return this;
  }

  // node_modules/d3-quadtree/src/x.js
  function defaultX(d) {
    return d[0];
  }
  function x_default(_) {
    return arguments.length ? (this._x = _, this) : this._x;
  }

  // node_modules/d3-quadtree/src/y.js
  function defaultY(d) {
    return d[1];
  }
  function y_default(_) {
    return arguments.length ? (this._y = _, this) : this._y;
  }

  // node_modules/d3-quadtree/src/quadtree.js
  function quadtree(nodes, x3, y3) {
    var tree = new Quadtree(x3 == null ? defaultX : x3, y3 == null ? defaultY : y3, NaN, NaN, NaN, NaN);
    return nodes == null ? tree : tree.addAll(nodes);
  }
  function Quadtree(x3, y3, x0, y0, x1, y1) {
    this._x = x3;
    this._y = y3;
    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    this._root = void 0;
  }
  function leaf_copy(leaf) {
    var copy = { data: leaf.data }, next = copy;
    while (leaf = leaf.next) next = next.next = { data: leaf.data };
    return copy;
  }
  var treeProto = quadtree.prototype = Quadtree.prototype;
  treeProto.copy = function() {
    var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1), node = this._root, nodes, child;
    if (!node) return copy;
    if (!node.length) return copy._root = leaf_copy(node), copy;
    nodes = [{ source: node, target: copy._root = new Array(4) }];
    while (node = nodes.pop()) {
      for (var i = 0; i < 4; ++i) {
        if (child = node.source[i]) {
          if (child.length) nodes.push({ source: child, target: node.target[i] = new Array(4) });
          else node.target[i] = leaf_copy(child);
        }
      }
    }
    return copy;
  };
  treeProto.add = add_default;
  treeProto.addAll = addAll;
  treeProto.cover = cover_default;
  treeProto.data = data_default2;
  treeProto.extent = extent_default;
  treeProto.find = find_default;
  treeProto.remove = remove_default3;
  treeProto.removeAll = removeAll;
  treeProto.root = root_default;
  treeProto.size = size_default2;
  treeProto.visit = visit_default;
  treeProto.visitAfter = visitAfter_default;
  treeProto.x = x_default;
  treeProto.y = y_default;

  // node_modules/d3-force/src/constant.js
  function constant_default4(x3) {
    return function() {
      return x3;
    };
  }

  // node_modules/d3-force/src/jiggle.js
  function jiggle_default(random) {
    return (random() - 0.5) * 1e-6;
  }

  // node_modules/d3-force/src/collide.js
  function x(d) {
    return d.x + d.vx;
  }
  function y(d) {
    return d.y + d.vy;
  }
  function collide_default(radius) {
    var nodes, radii, random, strength = 1, iterations = 1;
    if (typeof radius !== "function") radius = constant_default4(radius == null ? 1 : +radius);
    function force() {
      var i, n = nodes.length, tree, node, xi, yi, ri, ri2;
      for (var k = 0; k < iterations; ++k) {
        tree = quadtree(nodes, x, y).visitAfter(prepare);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          ri = radii[node.index], ri2 = ri * ri;
          xi = node.x + node.vx;
          yi = node.y + node.vy;
          tree.visit(apply);
        }
      }
      function apply(quad, x0, y0, x1, y1) {
        var data = quad.data, rj = quad.r, r = ri + rj;
        if (data) {
          if (data.index > node.index) {
            var x3 = xi - data.x - data.vx, y3 = yi - data.y - data.vy, l = x3 * x3 + y3 * y3;
            if (l < r * r) {
              if (x3 === 0) x3 = jiggle_default(random), l += x3 * x3;
              if (y3 === 0) y3 = jiggle_default(random), l += y3 * y3;
              l = (r - (l = Math.sqrt(l))) / l * strength;
              node.vx += (x3 *= l) * (r = (rj *= rj) / (ri2 + rj));
              node.vy += (y3 *= l) * r;
              data.vx -= x3 * (r = 1 - r);
              data.vy -= y3 * r;
            }
          }
          return;
        }
        return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
      }
    }
    function prepare(quad) {
      if (quad.data) return quad.r = radii[quad.data.index];
      for (var i = quad.r = 0; i < 4; ++i) {
        if (quad[i] && quad[i].r > quad.r) {
          quad.r = quad[i].r;
        }
      }
    }
    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length, node;
      radii = new Array(n);
      for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
    }
    force.initialize = function(_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.iterations = function(_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };
    force.strength = function(_) {
      return arguments.length ? (strength = +_, force) : strength;
    };
    force.radius = function(_) {
      return arguments.length ? (radius = typeof _ === "function" ? _ : constant_default4(+_), initialize(), force) : radius;
    };
    return force;
  }

  // node_modules/d3-force/src/link.js
  function index(d) {
    return d.index;
  }
  function find2(nodeById, nodeId2) {
    var node = nodeById.get(nodeId2);
    if (!node) throw new Error("node not found: " + nodeId2);
    return node;
  }
  function link_default(links) {
    var id2 = index, strength = defaultStrength, strengths, distance2 = constant_default4(30), distances, nodes, count, bias, random, iterations = 1;
    if (links == null) links = [];
    function defaultStrength(link) {
      return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }
    function force(alpha) {
      for (var k = 0, n = links.length; k < iterations; ++k) {
        for (var i = 0, link, source, target, x3, y3, l, b; i < n; ++i) {
          link = links[i], source = link.source, target = link.target;
          x3 = target.x + target.vx - source.x - source.vx || jiggle_default(random);
          y3 = target.y + target.vy - source.y - source.vy || jiggle_default(random);
          l = Math.sqrt(x3 * x3 + y3 * y3);
          l = (l - distances[i]) / l * alpha * strengths[i];
          x3 *= l, y3 *= l;
          target.vx -= x3 * (b = bias[i]);
          target.vy -= y3 * b;
          source.vx += x3 * (b = 1 - b);
          source.vy += y3 * b;
        }
      }
    }
    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length, m2 = links.length, nodeById = new Map(nodes.map((d, i2) => [id2(d, i2, nodes), d])), link;
      for (i = 0, count = new Array(n); i < m2; ++i) {
        link = links[i], link.index = i;
        if (typeof link.source !== "object") link.source = find2(nodeById, link.source);
        if (typeof link.target !== "object") link.target = find2(nodeById, link.target);
        count[link.source.index] = (count[link.source.index] || 0) + 1;
        count[link.target.index] = (count[link.target.index] || 0) + 1;
      }
      for (i = 0, bias = new Array(m2); i < m2; ++i) {
        link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
      }
      strengths = new Array(m2), initializeStrength();
      distances = new Array(m2), initializeDistance();
    }
    function initializeStrength() {
      if (!nodes) return;
      for (var i = 0, n = links.length; i < n; ++i) {
        strengths[i] = +strength(links[i], i, links);
      }
    }
    function initializeDistance() {
      if (!nodes) return;
      for (var i = 0, n = links.length; i < n; ++i) {
        distances[i] = +distance2(links[i], i, links);
      }
    }
    force.initialize = function(_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.links = function(_) {
      return arguments.length ? (links = _, initialize(), force) : links;
    };
    force.id = function(_) {
      return arguments.length ? (id2 = _, force) : id2;
    };
    force.iterations = function(_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };
    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default4(+_), initializeStrength(), force) : strength;
    };
    force.distance = function(_) {
      return arguments.length ? (distance2 = typeof _ === "function" ? _ : constant_default4(+_), initializeDistance(), force) : distance2;
    };
    return force;
  }

  // node_modules/d3-force/src/lcg.js
  var a = 1664525;
  var c = 1013904223;
  var m = 4294967296;
  function lcg_default() {
    let s = 1;
    return () => (s = (a * s + c) % m) / m;
  }

  // node_modules/d3-force/src/simulation.js
  function x2(d) {
    return d.x;
  }
  function y2(d) {
    return d.y;
  }
  var initialRadius = 10;
  var initialAngle = Math.PI * (3 - Math.sqrt(5));
  function simulation_default(nodes) {
    var simulation, alpha = 1, alphaMin = 1e-3, alphaDecay = 1 - Math.pow(alphaMin, 1 / 300), alphaTarget = 0, velocityDecay = 0.6, forces = /* @__PURE__ */ new Map(), stepper = timer(step), event = dispatch_default("tick", "end"), random = lcg_default();
    if (nodes == null) nodes = [];
    function step() {
      tick();
      event.call("tick", simulation);
      if (alpha < alphaMin) {
        stepper.stop();
        event.call("end", simulation);
      }
    }
    function tick(iterations) {
      var i, n = nodes.length, node;
      if (iterations === void 0) iterations = 1;
      for (var k = 0; k < iterations; ++k) {
        alpha += (alphaTarget - alpha) * alphaDecay;
        forces.forEach(function(force) {
          force(alpha);
        });
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          if (node.fx == null) node.x += node.vx *= velocityDecay;
          else node.x = node.fx, node.vx = 0;
          if (node.fy == null) node.y += node.vy *= velocityDecay;
          else node.y = node.fy, node.vy = 0;
        }
      }
      return simulation;
    }
    function initializeNodes() {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.index = i;
        if (node.fx != null) node.x = node.fx;
        if (node.fy != null) node.y = node.fy;
        if (isNaN(node.x) || isNaN(node.y)) {
          var radius = initialRadius * Math.sqrt(0.5 + i), angle = i * initialAngle;
          node.x = radius * Math.cos(angle);
          node.y = radius * Math.sin(angle);
        }
        if (isNaN(node.vx) || isNaN(node.vy)) {
          node.vx = node.vy = 0;
        }
      }
    }
    function initializeForce(force) {
      if (force.initialize) force.initialize(nodes, random);
      return force;
    }
    initializeNodes();
    return simulation = {
      tick,
      restart: function() {
        return stepper.restart(step), simulation;
      },
      stop: function() {
        return stepper.stop(), simulation;
      },
      nodes: function(_) {
        return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
      },
      alpha: function(_) {
        return arguments.length ? (alpha = +_, simulation) : alpha;
      },
      alphaMin: function(_) {
        return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
      },
      alphaDecay: function(_) {
        return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
      },
      alphaTarget: function(_) {
        return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
      },
      velocityDecay: function(_) {
        return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
      },
      randomSource: function(_) {
        return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
      },
      force: function(name, _) {
        return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
      },
      find: function(x3, y3, radius) {
        var i = 0, n = nodes.length, dx, dy, d2, node, closest;
        if (radius == null) radius = Infinity;
        else radius *= radius;
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dx = x3 - node.x;
          dy = y3 - node.y;
          d2 = dx * dx + dy * dy;
          if (d2 < radius) closest = node, radius = d2;
        }
        return closest;
      },
      on: function(name, _) {
        return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
      }
    };
  }

  // node_modules/d3-force/src/manyBody.js
  function manyBody_default() {
    var nodes, node, random, alpha, strength = constant_default4(-30), strengths, distanceMin2 = 1, distanceMax2 = Infinity, theta2 = 0.81;
    function force(_) {
      var i, n = nodes.length, tree = quadtree(nodes, x2, y2).visitAfter(accumulate);
      for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    }
    function initialize() {
      if (!nodes) return;
      var i, n = nodes.length, node2;
      strengths = new Array(n);
      for (i = 0; i < n; ++i) node2 = nodes[i], strengths[node2.index] = +strength(node2, i, nodes);
    }
    function accumulate(quad) {
      var strength2 = 0, q, c2, weight = 0, x3, y3, i;
      if (quad.length) {
        for (x3 = y3 = i = 0; i < 4; ++i) {
          if ((q = quad[i]) && (c2 = Math.abs(q.value))) {
            strength2 += q.value, weight += c2, x3 += c2 * q.x, y3 += c2 * q.y;
          }
        }
        quad.x = x3 / weight;
        quad.y = y3 / weight;
      } else {
        q = quad;
        q.x = q.data.x;
        q.y = q.data.y;
        do
          strength2 += strengths[q.data.index];
        while (q = q.next);
      }
      quad.value = strength2;
    }
    function apply(quad, x1, _, x22) {
      if (!quad.value) return true;
      var x3 = quad.x - node.x, y3 = quad.y - node.y, w = x22 - x1, l = x3 * x3 + y3 * y3;
      if (w * w / theta2 < l) {
        if (l < distanceMax2) {
          if (x3 === 0) x3 = jiggle_default(random), l += x3 * x3;
          if (y3 === 0) y3 = jiggle_default(random), l += y3 * y3;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
          node.vx += x3 * quad.value * alpha / l;
          node.vy += y3 * quad.value * alpha / l;
        }
        return true;
      } else if (quad.length || l >= distanceMax2) return;
      if (quad.data !== node || quad.next) {
        if (x3 === 0) x3 = jiggle_default(random), l += x3 * x3;
        if (y3 === 0) y3 = jiggle_default(random), l += y3 * y3;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
      }
      do
        if (quad.data !== node) {
          w = strengths[quad.data.index] * alpha / l;
          node.vx += x3 * w;
          node.vy += y3 * w;
        }
      while (quad = quad.next);
    }
    force.initialize = function(_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.strength = function(_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant_default4(+_), initialize(), force) : strength;
    };
    force.distanceMin = function(_) {
      return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
    };
    force.distanceMax = function(_) {
      return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
    };
    force.theta = function(_) {
      return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
    };
    return force;
  }

  // node_modules/d3-format/src/formatDecimal.js
  function formatDecimal_default(x3) {
    return Math.abs(x3 = Math.round(x3)) >= 1e21 ? x3.toLocaleString("en").replace(/,/g, "") : x3.toString(10);
  }
  function formatDecimalParts(x3, p) {
    if (!isFinite(x3) || x3 === 0) return null;
    var i = (x3 = p ? x3.toExponential(p - 1) : x3.toExponential()).indexOf("e"), coefficient = x3.slice(0, i);
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x3.slice(i + 1)
    ];
  }

  // node_modules/d3-format/src/exponent.js
  function exponent_default(x3) {
    return x3 = formatDecimalParts(Math.abs(x3)), x3 ? x3[1] : NaN;
  }

  // node_modules/d3-format/src/formatGroup.js
  function formatGroup_default(grouping, thousands) {
    return function(value, width) {
      var i = value.length, t = [], j = 0, g = grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }
      return t.reverse().join(thousands);
    };
  }

  // node_modules/d3-format/src/formatNumerals.js
  function formatNumerals_default(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // node_modules/d3-format/src/formatSpecifier.js
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;
  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }
  formatSpecifier.prototype = FormatSpecifier.prototype;
  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === void 0 ? " " : specifier.fill + "";
    this.align = specifier.align === void 0 ? ">" : specifier.align + "";
    this.sign = specifier.sign === void 0 ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === void 0 ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === void 0 ? void 0 : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === void 0 ? void 0 : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === void 0 ? "" : specifier.type + "";
  }
  FormatSpecifier.prototype.toString = function() {
    return this.fill + this.align + this.sign + this.symbol + (this.zero ? "0" : "") + (this.width === void 0 ? "" : Math.max(1, this.width | 0)) + (this.comma ? "," : "") + (this.precision === void 0 ? "" : "." + Math.max(0, this.precision | 0)) + (this.trim ? "~" : "") + this.type;
  };

  // node_modules/d3-format/src/formatTrim.js
  function formatTrim_default(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".":
          i0 = i1 = i;
          break;
        case "0":
          if (i0 === 0) i0 = i;
          i1 = i;
          break;
        default:
          if (!+s[i]) break out;
          if (i0 > 0) i0 = 0;
          break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  // node_modules/d3-format/src/formatPrefixAuto.js
  var prefixExponent;
  function formatPrefixAuto_default(x3, p) {
    var d = formatDecimalParts(x3, p);
    if (!d) return prefixExponent = void 0, x3.toPrecision(p);
    var coefficient = d[0], exponent = d[1], i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1, n = coefficient.length;
    return i === n ? coefficient : i > n ? coefficient + new Array(i - n + 1).join("0") : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i) : "0." + new Array(1 - i).join("0") + formatDecimalParts(x3, Math.max(0, p + i - 1))[0];
  }

  // node_modules/d3-format/src/formatRounded.js
  function formatRounded_default(x3, p) {
    var d = formatDecimalParts(x3, p);
    if (!d) return x3 + "";
    var coefficient = d[0], exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1) : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  // node_modules/d3-format/src/formatTypes.js
  var formatTypes_default = {
    "%": (x3, p) => (x3 * 100).toFixed(p),
    "b": (x3) => Math.round(x3).toString(2),
    "c": (x3) => x3 + "",
    "d": formatDecimal_default,
    "e": (x3, p) => x3.toExponential(p),
    "f": (x3, p) => x3.toFixed(p),
    "g": (x3, p) => x3.toPrecision(p),
    "o": (x3) => Math.round(x3).toString(8),
    "p": (x3, p) => formatRounded_default(x3 * 100, p),
    "r": formatRounded_default,
    "s": formatPrefixAuto_default,
    "X": (x3) => Math.round(x3).toString(16).toUpperCase(),
    "x": (x3) => Math.round(x3).toString(16)
  };

  // node_modules/d3-format/src/identity.js
  function identity_default(x3) {
    return x3;
  }

  // node_modules/d3-format/src/locale.js
  var map = Array.prototype.map;
  var prefixes = ["y", "z", "a", "f", "p", "n", "\xB5", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y"];
  function locale_default(locale3) {
    var group = locale3.grouping === void 0 || locale3.thousands === void 0 ? identity_default : formatGroup_default(map.call(locale3.grouping, Number), locale3.thousands + ""), currencyPrefix = locale3.currency === void 0 ? "" : locale3.currency[0] + "", currencySuffix = locale3.currency === void 0 ? "" : locale3.currency[1] + "", decimal = locale3.decimal === void 0 ? "." : locale3.decimal + "", numerals = locale3.numerals === void 0 ? identity_default : formatNumerals_default(map.call(locale3.numerals, String)), percent = locale3.percent === void 0 ? "%" : locale3.percent + "", minus = locale3.minus === void 0 ? "\u2212" : locale3.minus + "", nan = locale3.nan === void 0 ? "NaN" : locale3.nan + "";
    function newFormat(specifier, options) {
      specifier = formatSpecifier(specifier);
      var fill = specifier.fill, align = specifier.align, sign = specifier.sign, symbol = specifier.symbol, zero2 = specifier.zero, width = specifier.width, comma = specifier.comma, precision = specifier.precision, trim = specifier.trim, type2 = specifier.type;
      if (type2 === "n") comma = true, type2 = "g";
      else if (!formatTypes_default[type2]) precision === void 0 && (precision = 12), trim = true, type2 = "g";
      if (zero2 || fill === "0" && align === "=") zero2 = true, fill = "0", align = "=";
      var prefix = (options && options.prefix !== void 0 ? options.prefix : "") + (symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type2) ? "0" + type2.toLowerCase() : ""), suffix = (symbol === "$" ? currencySuffix : /[%p]/.test(type2) ? percent : "") + (options && options.suffix !== void 0 ? options.suffix : "");
      var formatType = formatTypes_default[type2], maybeSuffix = /[defgprs%]/.test(type2);
      precision = precision === void 0 ? 6 : /[gprs]/.test(type2) ? Math.max(1, Math.min(21, precision)) : Math.max(0, Math.min(20, precision));
      function format2(value) {
        var valuePrefix = prefix, valueSuffix = suffix, i, n, c2;
        if (type2 === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;
          var valueNegative = value < 0 || 1 / value < 0;
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);
          if (trim) value = formatTrim_default(value);
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;
          valuePrefix = (valueNegative ? sign === "(" ? sign : minus : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type2 === "s" && !isNaN(value) && prefixExponent !== void 0 ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c2 = value.charCodeAt(i), 48 > c2 || c2 > 57) {
                valueSuffix = (c2 === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }
        if (comma && !zero2) value = group(value, Infinity);
        var length = valuePrefix.length + value.length + valueSuffix.length, padding = length < width ? new Array(width - length + 1).join(fill) : "";
        if (comma && zero2) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";
        switch (align) {
          case "<":
            value = valuePrefix + value + valueSuffix + padding;
            break;
          case "=":
            value = valuePrefix + padding + value + valueSuffix;
            break;
          case "^":
            value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
            break;
          default:
            value = padding + valuePrefix + value + valueSuffix;
            break;
        }
        return numerals(value);
      }
      format2.toString = function() {
        return specifier + "";
      };
      return format2;
    }
    function formatPrefix2(specifier, value) {
      var e = Math.max(-8, Math.min(8, Math.floor(exponent_default(value) / 3))) * 3, k = Math.pow(10, -e), f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier), { suffix: prefixes[8 + e / 3] });
      return function(value2) {
        return f(k * value2);
      };
    }
    return {
      format: newFormat,
      formatPrefix: formatPrefix2
    };
  }

  // node_modules/d3-format/src/defaultLocale.js
  var locale;
  var format;
  var formatPrefix;
  defaultLocale({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });
  function defaultLocale(definition) {
    locale = locale_default(definition);
    format = locale.format;
    formatPrefix = locale.formatPrefix;
    return locale;
  }

  // node_modules/d3-time/src/interval.js
  var t0 = /* @__PURE__ */ new Date();
  var t1 = /* @__PURE__ */ new Date();
  function timeInterval(floori, offseti, count, field) {
    function interval2(date) {
      return floori(date = arguments.length === 0 ? /* @__PURE__ */ new Date() : /* @__PURE__ */ new Date(+date)), date;
    }
    interval2.floor = (date) => {
      return floori(date = /* @__PURE__ */ new Date(+date)), date;
    };
    interval2.ceil = (date) => {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };
    interval2.round = (date) => {
      const d0 = interval2(date), d1 = interval2.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };
    interval2.offset = (date, step) => {
      return offseti(date = /* @__PURE__ */ new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };
    interval2.range = (start2, stop, step) => {
      const range = [];
      start2 = interval2.ceil(start2);
      step = step == null ? 1 : Math.floor(step);
      if (!(start2 < stop) || !(step > 0)) return range;
      let previous;
      do
        range.push(previous = /* @__PURE__ */ new Date(+start2)), offseti(start2, step), floori(start2);
      while (previous < start2 && start2 < stop);
      return range;
    };
    interval2.filter = (test) => {
      return timeInterval((date) => {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, (date, step) => {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {
            }
          }
          else while (--step >= 0) {
            while (offseti(date, 1), !test(date)) {
            }
          }
        }
      });
    };
    if (count) {
      interval2.count = (start2, end) => {
        t0.setTime(+start2), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };
      interval2.every = (step) => {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval2 : interval2.filter(field ? (d) => field(d) % step === 0 : (d) => interval2.count(0, d) % step === 0);
      };
    }
    return interval2;
  }

  // node_modules/d3-time/src/duration.js
  var durationSecond = 1e3;
  var durationMinute = durationSecond * 60;
  var durationHour = durationMinute * 60;
  var durationDay = durationHour * 24;
  var durationWeek = durationDay * 7;
  var durationMonth = durationDay * 30;
  var durationYear = durationDay * 365;

  // node_modules/d3-time/src/second.js
  var second = timeInterval((date) => {
    date.setTime(date - date.getMilliseconds());
  }, (date, step) => {
    date.setTime(+date + step * durationSecond);
  }, (start2, end) => {
    return (end - start2) / durationSecond;
  }, (date) => {
    return date.getUTCSeconds();
  });
  var seconds = second.range;

  // node_modules/d3-time/src/minute.js
  var timeMinute = timeInterval((date) => {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
  }, (date, step) => {
    date.setTime(+date + step * durationMinute);
  }, (start2, end) => {
    return (end - start2) / durationMinute;
  }, (date) => {
    return date.getMinutes();
  });
  var timeMinutes = timeMinute.range;
  var utcMinute = timeInterval((date) => {
    date.setUTCSeconds(0, 0);
  }, (date, step) => {
    date.setTime(+date + step * durationMinute);
  }, (start2, end) => {
    return (end - start2) / durationMinute;
  }, (date) => {
    return date.getUTCMinutes();
  });
  var utcMinutes = utcMinute.range;

  // node_modules/d3-time/src/hour.js
  var timeHour = timeInterval((date) => {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
  }, (date, step) => {
    date.setTime(+date + step * durationHour);
  }, (start2, end) => {
    return (end - start2) / durationHour;
  }, (date) => {
    return date.getHours();
  });
  var timeHours = timeHour.range;
  var utcHour = timeInterval((date) => {
    date.setUTCMinutes(0, 0, 0);
  }, (date, step) => {
    date.setTime(+date + step * durationHour);
  }, (start2, end) => {
    return (end - start2) / durationHour;
  }, (date) => {
    return date.getUTCHours();
  });
  var utcHours = utcHour.range;

  // node_modules/d3-time/src/day.js
  var timeDay = timeInterval(
    (date) => date.setHours(0, 0, 0, 0),
    (date, step) => date.setDate(date.getDate() + step),
    (start2, end) => (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationDay,
    (date) => date.getDate() - 1
  );
  var timeDays = timeDay.range;
  var utcDay = timeInterval((date) => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start2, end) => {
    return (end - start2) / durationDay;
  }, (date) => {
    return date.getUTCDate() - 1;
  });
  var utcDays = utcDay.range;
  var unixDay = timeInterval((date) => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start2, end) => {
    return (end - start2) / durationDay;
  }, (date) => {
    return Math.floor(date / durationDay);
  });
  var unixDays = unixDay.range;

  // node_modules/d3-time/src/week.js
  function timeWeekday(i) {
    return timeInterval((date) => {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setDate(date.getDate() + step * 7);
    }, (start2, end) => {
      return (end - start2 - (end.getTimezoneOffset() - start2.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }
  var timeSunday = timeWeekday(0);
  var timeMonday = timeWeekday(1);
  var timeTuesday = timeWeekday(2);
  var timeWednesday = timeWeekday(3);
  var timeThursday = timeWeekday(4);
  var timeFriday = timeWeekday(5);
  var timeSaturday = timeWeekday(6);
  var timeSundays = timeSunday.range;
  var timeMondays = timeMonday.range;
  var timeTuesdays = timeTuesday.range;
  var timeWednesdays = timeWednesday.range;
  var timeThursdays = timeThursday.range;
  var timeFridays = timeFriday.range;
  var timeSaturdays = timeSaturday.range;
  function utcWeekday(i) {
    return timeInterval((date) => {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, (start2, end) => {
      return (end - start2) / durationWeek;
    });
  }
  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);
  var utcSundays = utcSunday.range;
  var utcMondays = utcMonday.range;
  var utcTuesdays = utcTuesday.range;
  var utcWednesdays = utcWednesday.range;
  var utcThursdays = utcThursday.range;
  var utcFridays = utcFriday.range;
  var utcSaturdays = utcSaturday.range;

  // node_modules/d3-time/src/month.js
  var timeMonth = timeInterval((date) => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setMonth(date.getMonth() + step);
  }, (start2, end) => {
    return end.getMonth() - start2.getMonth() + (end.getFullYear() - start2.getFullYear()) * 12;
  }, (date) => {
    return date.getMonth();
  });
  var timeMonths = timeMonth.range;
  var utcMonth = timeInterval((date) => {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, (start2, end) => {
    return end.getUTCMonth() - start2.getUTCMonth() + (end.getUTCFullYear() - start2.getUTCFullYear()) * 12;
  }, (date) => {
    return date.getUTCMonth();
  });
  var utcMonths = utcMonth.range;

  // node_modules/d3-time/src/year.js
  var timeYear = timeInterval((date) => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setFullYear(date.getFullYear() + step);
  }, (start2, end) => {
    return end.getFullYear() - start2.getFullYear();
  }, (date) => {
    return date.getFullYear();
  });
  timeYear.every = (k) => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };
  var timeYears = timeYear.range;
  var utcYear = timeInterval((date) => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, (start2, end) => {
    return end.getUTCFullYear() - start2.getUTCFullYear();
  }, (date) => {
    return date.getUTCFullYear();
  });
  utcYear.every = (k) => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval((date) => {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };
  var utcYears = utcYear.range;

  // node_modules/d3-time-format/src/locale.js
  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }
  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }
  function newDate(y3, m2, d) {
    return { y: y3, m: m2, d, H: 0, M: 0, S: 0, L: 0 };
  }
  function formatLocale(locale3) {
    var locale_dateTime = locale3.dateTime, locale_date = locale3.date, locale_time = locale3.time, locale_periods = locale3.periods, locale_weekdays = locale3.days, locale_shortWeekdays = locale3.shortDays, locale_months = locale3.months, locale_shortMonths = locale3.shortMonths;
    var periodRe = formatRe(locale_periods), periodLookup = formatLookup(locale_periods), weekdayRe = formatRe(locale_weekdays), weekdayLookup = formatLookup(locale_weekdays), shortWeekdayRe = formatRe(locale_shortWeekdays), shortWeekdayLookup = formatLookup(locale_shortWeekdays), monthRe = formatRe(locale_months), monthLookup = formatLookup(locale_months), shortMonthRe = formatRe(locale_shortMonths), shortMonthLookup = formatLookup(locale_shortMonths);
    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "g": formatYearISO,
      "G": formatFullYearISO,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };
    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "g": formatUTCYearISO,
      "G": formatUTCFullYearISO,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };
    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "g": parseYear,
      "G": parseFullYear,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);
    function newFormat(specifier, formats2) {
      return function(date) {
        var string = [], i = -1, j = 0, n = specifier.length, c2, pad2, format2;
        if (!(date instanceof Date)) date = /* @__PURE__ */ new Date(+date);
        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad2 = pads[c2 = specifier.charAt(++i)]) != null) c2 = specifier.charAt(++i);
            else pad2 = c2 === "e" ? " " : "0";
            if (format2 = formats2[c2]) c2 = format2(date, pad2);
            string.push(c2);
            j = i + 1;
          }
        }
        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }
    function newParse(specifier, Z) {
      return function(string) {
        var d = newDate(1900, void 0, 1), i = parseSpecifier(d, specifier, string += "", 0), week, day;
        if (i != string.length) return null;
        if ("Q" in d) return new Date(d.Q);
        if ("s" in d) return new Date(d.s * 1e3 + ("L" in d ? d.L : 0));
        if (Z && !("Z" in d)) d.Z = 0;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        if (d.m === void 0) d.m = "q" in d ? d.q : 0;
        if ("V" in d) {
          if (d.V < 1 || d.V > 53) return null;
          if (!("w" in d)) d.w = 1;
          if ("Z" in d) {
            week = utcDate(newDate(d.y, 0, 1)), day = week.getUTCDay();
            week = day > 4 || day === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day = week.getDay();
            week = day > 4 || day === 0 ? timeMonday.ceil(week) : timeMonday(week);
            week = timeDay.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
          day = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
        }
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }
        return localDate(d);
      };
    }
    function parseSpecifier(d, specifier, string, j) {
      var i = 0, n = specifier.length, m2 = string.length, c2, parse;
      while (i < n) {
        if (j >= m2) return -1;
        c2 = specifier.charCodeAt(i++);
        if (c2 === 37) {
          c2 = specifier.charAt(i++);
          parse = parses[c2 in pads ? specifier.charAt(i++) : c2];
          if (!parse || (j = parse(d, string, j)) < 0) return -1;
        } else if (c2 != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }
    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }
    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }
    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }
    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }
    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }
    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }
    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }
    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }
    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }
    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }
    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }
    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }
    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }
    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }
    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() {
          return specifier;
        };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", false);
        p.toString = function() {
          return specifier;
        };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() {
          return specifier;
        };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier += "", true);
        p.toString = function() {
          return specifier;
        };
        return p;
      }
    };
  }
  var pads = { "-": "", "_": " ", "0": "0" };
  var numberRe = /^\s*\d+/;
  var percentRe = /^%/;
  var requoteRe = /[\\^$*+?|[\]().{}]/g;
  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }
  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }
  function formatLookup(names) {
    return new Map(names.map((name, i) => [name.toLowerCase(), i]));
  }
  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }
  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }
  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }
  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }
  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2e3), i + n[0].length) : -1;
  }
  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }
  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }
  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }
  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }
  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }
  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }
  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }
  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }
  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }
  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1e3), i + n[0].length) : -1;
  }
  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }
  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }
  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }
  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }
  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }
  function formatDayOfYear(d, p) {
    return pad(1 + timeDay.count(timeYear(d), d), p, 3);
  }
  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }
  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + "000";
  }
  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }
  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }
  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }
  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }
  function formatWeekNumberSunday(d, p) {
    return pad(timeSunday.count(timeYear(d) - 1, d), p, 2);
  }
  function dISO(d) {
    var day = d.getDay();
    return day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
  }
  function formatWeekNumberISO(d, p) {
    d = dISO(d);
    return pad(timeThursday.count(timeYear(d), d) + (timeYear(d).getDay() === 4), p, 2);
  }
  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }
  function formatWeekNumberMonday(d, p) {
    return pad(timeMonday.count(timeYear(d) - 1, d), p, 2);
  }
  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }
  function formatYearISO(d, p) {
    d = dISO(d);
    return pad(d.getFullYear() % 100, p, 2);
  }
  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 1e4, p, 4);
  }
  function formatFullYearISO(d, p) {
    var day = d.getDay();
    d = day >= 4 || day === 0 ? timeThursday(d) : timeThursday.ceil(d);
    return pad(d.getFullYear() % 1e4, p, 4);
  }
  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+")) + pad(z / 60 | 0, "0", 2) + pad(z % 60, "0", 2);
  }
  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }
  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }
  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }
  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }
  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }
  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + "000";
  }
  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }
  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }
  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }
  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }
  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }
  function UTCdISO(d) {
    var day = d.getUTCDay();
    return day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
  }
  function formatUTCWeekNumberISO(d, p) {
    d = UTCdISO(d);
    return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }
  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }
  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }
  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }
  function formatUTCYearISO(d, p) {
    d = UTCdISO(d);
    return pad(d.getUTCFullYear() % 100, p, 2);
  }
  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 1e4, p, 4);
  }
  function formatUTCFullYearISO(d, p) {
    var day = d.getUTCDay();
    d = day >= 4 || day === 0 ? utcThursday(d) : utcThursday.ceil(d);
    return pad(d.getUTCFullYear() % 1e4, p, 4);
  }
  function formatUTCZone() {
    return "+0000";
  }
  function formatLiteralPercent() {
    return "%";
  }
  function formatUnixTimestamp(d) {
    return +d;
  }
  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1e3);
  }

  // node_modules/d3-time-format/src/defaultLocale.js
  var locale2;
  var timeFormat;
  var timeParse;
  var utcFormat;
  var utcParse;
  defaultLocale2({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });
  function defaultLocale2(definition) {
    locale2 = formatLocale(definition);
    timeFormat = locale2.format;
    timeParse = locale2.parse;
    utcFormat = locale2.utcFormat;
    utcParse = locale2.utcParse;
    return locale2;
  }

  // node_modules/d3-scale-chromatic/src/colors.js
  function colors_default(specifier) {
    var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
    while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
    return colors;
  }

  // node_modules/d3-scale-chromatic/src/ramp.js
  var ramp_default = (scheme2) => rgbBasis(scheme2[scheme2.length - 1]);

  // node_modules/d3-scale-chromatic/src/sequential-multi/YlGnBu.js
  var scheme = new Array(3).concat(
    "edf8b17fcdbb2c7fb8",
    "ffffcca1dab441b6c4225ea8",
    "ffffcca1dab441b6c42c7fb8253494",
    "ffffccc7e9b47fcdbb41b6c42c7fb8253494",
    "ffffccc7e9b47fcdbb41b6c41d91c0225ea80c2c84",
    "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea80c2c84",
    "ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58"
  ).map(colors_default);
  var YlGnBu_default = ramp_default(scheme);

  // node_modules/d3-scale-chromatic/src/sequential-multi/viridis.js
  function ramp(range) {
    var n = range.length;
    return function(t) {
      return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
    };
  }
  var viridis_default = ramp(colors_default("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));
  var magma = ramp(colors_default("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));
  var inferno = ramp(colors_default("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));
  var plasma = ramp(colors_default("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

  // node_modules/d3-shape/src/constant.js
  function constant_default5(x3) {
    return function constant() {
      return x3;
    };
  }

  // node_modules/d3-shape/src/math.js
  var sqrt = Math.sqrt;
  var pi2 = Math.PI;
  var halfPi = pi2 / 2;
  var tau2 = 2 * pi2;

  // node_modules/d3-shape/src/path.js
  function withPath(shape) {
    let digits = 3;
    shape.digits = function(_) {
      if (!arguments.length) return digits;
      if (_ == null) {
        digits = null;
      } else {
        const d = Math.floor(_);
        if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
        digits = d;
      }
      return shape;
    };
    return () => new Path(digits);
  }

  // node_modules/d3-shape/src/symbol/circle.js
  var circle_default = {
    draw(context, size) {
      const r = sqrt(size / pi2);
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau2);
    }
  };

  // node_modules/d3-shape/src/symbol/diamond.js
  var tan30 = sqrt(1 / 3);
  var tan30_2 = tan30 * 2;
  var diamond_default = {
    draw(context, size) {
      const y3 = sqrt(size / tan30_2);
      const x3 = y3 * tan30;
      context.moveTo(0, -y3);
      context.lineTo(x3, 0);
      context.lineTo(0, y3);
      context.lineTo(-x3, 0);
      context.closePath();
    }
  };

  // node_modules/d3-shape/src/symbol/square.js
  var square_default = {
    draw(context, size) {
      const w = sqrt(size);
      const x3 = -w / 2;
      context.rect(x3, x3, w, w);
    }
  };

  // node_modules/d3-shape/src/symbol/triangle.js
  var sqrt3 = sqrt(3);
  var triangle_default = {
    draw(context, size) {
      const y3 = -sqrt(size / (sqrt3 * 3));
      context.moveTo(0, y3 * 2);
      context.lineTo(-sqrt3 * y3, -y3);
      context.lineTo(sqrt3 * y3, -y3);
      context.closePath();
    }
  };

  // node_modules/d3-shape/src/symbol.js
  function Symbol2(type2, size) {
    let context = null, path2 = withPath(symbol);
    type2 = typeof type2 === "function" ? type2 : constant_default5(type2 || circle_default);
    size = typeof size === "function" ? size : constant_default5(size === void 0 ? 64 : +size);
    function symbol() {
      let buffer;
      if (!context) context = buffer = path2();
      type2.apply(this, arguments).draw(context, +size.apply(this, arguments));
      if (buffer) return context = null, buffer + "" || null;
    }
    symbol.type = function(_) {
      return arguments.length ? (type2 = typeof _ === "function" ? _ : constant_default5(_), symbol) : type2;
    };
    symbol.size = function(_) {
      return arguments.length ? (size = typeof _ === "function" ? _ : constant_default5(+_), symbol) : size;
    };
    symbol.context = function(_) {
      return arguments.length ? (context = _ == null ? null : _, symbol) : context;
    };
    return symbol;
  }

  // node_modules/d3-zoom/src/transform.js
  function Transform(k, x3, y3) {
    this.k = k;
    this.x = x3;
    this.y = y3;
  }
  Transform.prototype = {
    constructor: Transform,
    scale: function(k) {
      return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
    },
    translate: function(x3, y3) {
      return x3 === 0 & y3 === 0 ? this : new Transform(this.k, this.x + this.k * x3, this.y + this.k * y3);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x3) {
      return x3 * this.k + this.x;
    },
    applyY: function(y3) {
      return y3 * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x3) {
      return (x3 - this.x) / this.k;
    },
    invertY: function(y3) {
      return (y3 - this.y) / this.k;
    },
    rescaleX: function(x3) {
      return x3.copy().domain(x3.range().map(this.invertX, this).map(x3.invert, x3));
    },
    rescaleY: function(y3) {
      return y3.copy().domain(y3.range().map(this.invertY, this).map(y3.invert, y3));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };
  var identity2 = new Transform(1, 0, 0);
  transform.prototype = Transform.prototype;
  function transform(node) {
    while (!node.__zoom) if (!(node = node.parentNode)) return identity2;
    return node.__zoom;
  }

  // src/shared/colour.js
  var LIGHT_BACKGROUND = "#ffffff";
  var DARK_BACKGROUND = "#1a1d22";
  var PALETTES = {
    // Bright, saturated colours
    "Vivid": {
      light: [
        "#1f6fd6",
        "#c25400",
        "#0b8460",
        "#d0305f",
        "#7a52e0",
        "#8f6a00",
        "#0a7fa3",
        "#b0369a",
        "#4a7f12",
        "#d23b3b"
      ],
      dark: [
        "#3d8bfd",
        "#ff8c42",
        "#20c997",
        "#f0507a",
        "#9b7bff",
        "#e9b434",
        "#38c6f4",
        "#e86bd1",
        "#8bd450",
        "#ff6b6b"
      ]
    },
    // Colours that stay distinct for the common kinds of colour blindness: Paul Tol's on the
    // light theme and Okabe and Ito's on the dark
    "Colour-blind safe": {
      light: ["#0077bb", "#cc3311", "#117733", "#882255", "#332288", "#aa4499", "#888888"],
      dark: ["#56b4e9", "#e69f00", "#009e73", "#cc79a7", "#f0e442", "#d55e00", "#bbbbbb", "#7f8ef0"]
    }
  };
  var DEFAULT_PALETTE = "Vivid";
  var SHADE_STEPS = [0.3, -0.3, 0.5, -0.5];
  var MIN_SHADE_DISTANCE = 32;
  function channel(colour, index2) {
    return parseInt(colour.substring(1 + index2 * 2, 3 + index2 * 2), 16);
  }
  function luminance(colour) {
    const linear2 = [0, 1, 2].map((i) => channel(colour, i) / 255).map((c2) => c2 <= 0.03928 ? c2 / 12.92 : Math.pow((c2 + 0.055) / 1.055, 2.4));
    return 0.2126 * linear2[0] + 0.7152 * linear2[1] + 0.0722 * linear2[2];
  }
  function contrast(a2, b) {
    const la = luminance(a2);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }
  function mix(colour, towards2, amount) {
    let result = "#";
    for (let i = 0; i < 3; i++) {
      const from = channel(colour, i);
      const value = Math.round(from + (channel(towards2, i) - from) * amount);
      result += Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0");
    }
    return result;
  }
  function distance(a2, b) {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
      const d = channel(a2, i) - channel(b, i);
      sum += d * d;
    }
    return Math.sqrt(sum);
  }
  function hash(text) {
    let h = 2166136261 | 0;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24) | 0;
    }
    return h >>> 0;
  }
  function withShades(base, background) {
    const colours = [...base];
    for (const step of SHADE_STEPS) {
      for (const colour of base) {
        const shade = step > 0 ? mix(colour, "#ffffff", step) : mix(colour, "#000000", -step);
        if (contrast(shade, background) >= 3 && colours.every((other) => distance(shade, other) >= MIN_SHADE_DISTANCE)) {
          colours.push(shade);
        }
      }
    }
    return colours;
  }
  function paletteColours(name, darkTheme) {
    const palette = PALETTES[name] || PALETTES[DEFAULT_PALETTE];
    const base = darkTheme ? palette.dark : palette.light;
    return { base, all: withShades(base, darkTheme ? DARK_BACKGROUND : LIGHT_BACKGROUND) };
  }
  function colourKey(field, value) {
    return (field === null || field === void 0 ? "" : String(field)) + "\0" + (value === null || value === void 0 ? "" : String(value));
  }
  var ColourList = class {
    constructor() {
      this.positions = /* @__PURE__ */ new Map();
      this.used = /* @__PURE__ */ new Set();
    }
    // The colours of some values of a field, in the order given
    colours(field, values, paletteName, darkTheme) {
      const { base, all } = paletteColours(paletteName, darkTheme);
      return values.map((value) => all[this.position(colourKey(field, value), base.length, all.length) % all.length]);
    }
    position(key, baseSize, size) {
      if (this.positions.has(key)) {
        return this.positions.get(key);
      }
      const preferred = hash(key) % baseSize;
      let position = preferred;
      if (this.used.has(position)) {
        position = -1;
        for (let i = 0; i < size; i++) {
          if (!this.used.has(i)) {
            position = i;
            break;
          }
        }
        if (position < 0) {
          position = preferred;
        }
      }
      this.positions.set(key, position);
      this.used.add(position);
      return position;
    }
  };

  // src/shared/edges.js
  var SHAPE_CONTRAST = 3;
  function readableColour(colour, background, ratio) {
    const towards2 = contrast(background, "#000000") >= contrast(background, "#ffffff") ? "#000000" : "#ffffff";
    for (let amount = 0; amount <= 1; amount += 0.05) {
      const mixed = mix(colour, towards2, Math.min(1, amount));
      if (contrast(mixed, background) >= ratio) {
        return mixed;
      }
    }
    return towards2;
  }
  function edgeColour(fill, background) {
    if (!fill || contrast(fill, background) >= SHAPE_CONTRAST) {
      return null;
    }
    return readableColour(fill, background, SHAPE_CONTRAST);
  }

  // src/shared/motion.js
  function prefersReducedMotion(view = typeof window === "undefined" ? void 0 : window) {
    return Boolean(view && typeof view.matchMedia === "function" && view.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  // src/shared/data.js
  function isNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }
  function isPresent(value) {
    return value !== null && value !== void 0 && value !== "";
  }
  function distinct(values) {
    return [...new Set(values)];
  }

  // src/shared/network.js
  function nodeId(name, group, isGroup) {
    return isGroup ? JSON.stringify(["group", String(name)]) : JSON.stringify(["node", String(name), group === null ? null : String(group)]);
  }
  function groupPairKey(a2, b) {
    return JSON.stringify([String(a2), String(b)].sort());
  }
  function networkOf(rows, {
    isExpanded = () => false,
    isLinkExpanded = () => false,
    hasCount = false,
    maxNodes = Infinity
  } = {}) {
    const nodes = /* @__PURE__ */ new Map();
    const links = /* @__PURE__ */ new Map();
    const groupMembers = /* @__PURE__ */ new Map();
    const rowLinks = [];
    const nodeOf = (name, group, isGroup) => {
      const id2 = nodeId(name, group, isGroup);
      if (!nodes.has(id2)) {
        nodes.set(id2, {
          id: id2,
          name,
          group: isGroup ? null : group,
          isGroup,
          expanded: isGroup && isExpanded(name),
          out: 0,
          in: 0,
          within: 0,
          members: 0,
          memberNames: []
        });
      }
      return nodes.get(id2);
    };
    const linkOf = (a2, b, isMembership) => {
      const [source, target] = a2.id < b.id ? [a2, b] : [b, a2];
      const id2 = JSON.stringify([source.id, target.id]);
      if (!links.has(id2)) {
        links.set(id2, {
          id: id2,
          source: source.id,
          target: target.id,
          forward: 0,
          reverse: 0,
          isMembership,
          groups: null,
          viaGroups: null
        });
      }
      return links.get(id2);
    };
    const endOf = (name, group, asMember) => {
      if (!isPresent(group)) {
        return nodeOf(name, null, false);
      }
      const groupNode = nodeOf(group, null, true);
      if (!groupMembers.has(group)) {
        groupMembers.set(group, /* @__PURE__ */ new Set());
      }
      groupMembers.get(group).add(String(name));
      if (!groupNode.expanded && !asMember) {
        return groupNode;
      }
      const member = nodeOf(name, group, false);
      linkOf(groupNode, member, true);
      return member;
    };
    for (const row of rows) {
      if (!Array.isArray(row) || !isPresent(row[0]) || !isPresent(row[1])) {
        continue;
      }
      const count = hasCount ? Number(row[4]) : 1;
      if (hasCount && (!isPresent(row[4]) || !isNumber(count) || count <= 0)) {
        continue;
      }
      const fromGroup = isPresent(row[2]) ? row[2] : null;
      const toGroup = isPresent(row[3]) ? row[3] : null;
      const viaGroups = fromGroup !== null && toGroup !== null && String(fromGroup) !== String(toGroup) && !isExpanded(fromGroup) && !isExpanded(toGroup) && isLinkExpanded(fromGroup, toGroup) ? groupPairKey(fromGroup, toGroup) : null;
      const from = endOf(row[0], fromGroup, viaGroups !== null);
      const to = endOf(row[1], toGroup, viaGroups !== null);
      if (from === to) {
        from.within += count;
        continue;
      }
      from.out += count;
      to.in += count;
      const link = linkOf(from, to, false);
      if (from.id === link.source) {
        link.forward += count;
      } else {
        link.reverse += count;
      }
      if (viaGroups !== null) {
        link.viaGroups = viaGroups;
      } else if (from.isGroup && to.isGroup && !from.expanded && !to.expanded) {
        link.groups = [from.name, to.name];
      }
      rowLinks.push({ source: from.id, target: to.id });
    }
    for (const [group, members] of groupMembers) {
      const groupNode = nodes.get(nodeId(group, null, true));
      groupNode.members = members.size;
      groupNode.memberNames = [...members].sort();
    }
    const kept = [...nodes.values()].slice(0, Math.max(0, maxNodes));
    const keptIds = new Set(kept.map((node) => node.id));
    const bothKept = (link) => keptIds.has(link.source) && keptIds.has(link.target);
    return {
      nodes: kept,
      links: [...links.values()].filter(bothKept),
      rowLinks: rowLinks.filter(bothKept),
      left: nodes.size - kept.length
    };
  }
  function filterNetwork(network, keep) {
    const kept = network.nodes.filter(keep);
    const keptIds = new Set(kept.map((node) => node.id));
    const bothKept = (link) => keptIds.has(link.source) && keptIds.has(link.target);
    return { ...network, nodes: kept, links: network.links.filter(bothKept), rowLinks: network.rowLinks.filter(bothKept) };
  }
  function activityOf(node) {
    return node.out + node.in + node.within;
  }
  function matchesOf(network, text) {
    const wanted = String(text || "").trim().toLowerCase();
    if (wanted === "") {
      return /* @__PURE__ */ new Set();
    }
    const has = (name) => String(name).toLowerCase().includes(wanted);
    return new Set(network.nodes.filter((node) => has(node.name) || node.isGroup && !node.expanded && node.memberNames.some(has)).map((node) => node.id));
  }
  function roleOf(node) {
    if (node.out > 0 && node.in > 0) {
      return "both";
    }
    if (node.out > 0) {
      return "source";
    }
    return node.in > 0 ? "target" : "none";
  }
  function seededRandom() {
    let seed = 1;
    return () => {
      seed = seed * 16807 % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  // src/shared/colours.js
  function hasHostColours() {
    return typeof stroom !== "undefined" && typeof stroom.colours === "function";
  }
  var Colours = class {
    // `isDarkTheme()` says whether the dashboard has the dark theme, and `onChange()` is called
    // when Stroom's colours differ from those given, or the palette changes, so that the
    // visualisation can redraw
    constructor(isDarkTheme, onChange) {
      this.isDarkTheme = isDarkTheme;
      this.onChange = onChange;
      this.local = new ColourList();
      this.fromHost = /* @__PURE__ */ new Map();
      this.hostTheme = null;
      this.pending = /* @__PURE__ */ new Set();
      if (typeof stroom !== "undefined" && typeof stroom.onColoursChanged === "function") {
        stroom.onColoursChanged(() => {
          this.fromHost.clear();
          this.pending.clear();
          this.onChange();
        });
      }
    }
    // The palette Stroom says colours come from, or the default
    palette() {
      const palette = typeof stroom !== "undefined" && typeof stroom.colourPalette === "function" ? stroom.colourPalette() : null;
      return palette || DEFAULT_PALETTE;
    }
    // The colour of each value of a field, as a function of the value, asking Stroom for those it
    // hasn't given yet
    of(field, values) {
      const dark = this.isDarkTheme();
      if (this.hostTheme !== dark) {
        this.fromHost.clear();
        this.pending.clear();
        this.hostTheme = dark;
      }
      const strings = values.map((value) => value === null || value === void 0 ? "" : String(value));
      const localColours = this.local.colours(field, strings, this.palette(), dark);
      const colours = /* @__PURE__ */ new Map();
      const toAsk = [];
      strings.forEach((value, index2) => {
        const key = colourKey(field, value);
        colours.set(value, this.fromHost.get(key) || localColours[index2]);
        if (!this.fromHost.has(key) && !this.pending.has(key)) {
          toAsk.push(value);
          this.pending.add(key);
        }
      });
      if (toAsk.length > 0 && hasHostColours()) {
        stroom.colours(field, toAsk, (answer) => this.answered(field, toAsk, answer, colours));
      }
      return (value) => colours.get(value === null || value === void 0 ? "" : String(value));
    }
    // The colour of any value of a field, as a function of the value, from the palette the user
    // chose for the theme, by a hash of the field and value (the same each time), without going in
    // the dashboard's colour list: for values too many, and too unlike other visualisations' values,
    // to share it (e.g. a word cloud's words), so that they don't crowd it
    unlisted(field) {
      const colours = paletteColours(this.palette(), this.isDarkTheme()).all;
      return (value) => colours[hash(colourKey(field, value)) % colours.length];
    }
    answered(field, values, answer, given) {
      if (!Array.isArray(answer)) {
        return;
      }
      let changed = false;
      values.forEach((value, index2) => {
        const key = colourKey(field, value);
        this.pending.delete(key);
        if (typeof answer[index2] === "string") {
          this.fromHost.set(key, answer[index2]);
          if (given.get(value) !== answer[index2]) {
            changed = true;
          }
        }
      });
      if (changed) {
        this.onChange();
      }
    }
  };

  // src/shared/time.js
  var MINUTE = 6e4;
  var iso = (ms) => new Date(ms).toISOString();
  var Zone = class {
    constructor({
      offsetMinutes = () => 0,
      format: format2 = iso,
      formatCompact = (ms) => iso(ms).substring(0, 16),
      is12Hour = false
    } = {}) {
      this.offsetMinutes = offsetMinutes;
      this.format = format2;
      this.formatCompact = formatCompact;
      this.is12Hour = is12Hour;
    }
    // An instant's wall clock time in the zone
    toWall(ms) {
      return ms + this.offsetMinutes(ms) * MINUTE;
    }
    // The instant a wall clock time in the zone is (the first, where a clock goes back an hour)
    fromWall(wall) {
      const guess = wall - this.offsetMinutes(wall) * MINUTE;
      return wall - this.offsetMinutes(guess) * MINUTE;
    }
    // The instant the day an instant is in starts, in the zone
    dayStart(ms) {
      return this.fromWall(utcDay.floor(new Date(this.toWall(ms))).getTime());
    }
    // The instant the next day starts, after the day that starts at `dayStart`
    nextDay(dayStart) {
      return this.fromWall(utcDay.offset(new Date(this.toWall(dayStart)), 1).getTime());
    }
    // The instant the hour an instant is in starts, in the zone
    hourStart(ms) {
      return this.fromWall(utcHour.floor(new Date(this.toWall(ms))).getTime());
    }
    // An instant's hour of the day (0 to 23) and day of the week (0 for Monday to 6 for Sunday)
    hourOf(ms) {
      return new Date(this.toWall(ms)).getUTCHours();
    }
    weekdayOf(ms) {
      return (new Date(this.toWall(ms)).getUTCDay() + 6) % 7;
    }
    // An instant's milliseconds since the start of its day, in the zone
    timeOfDay(ms) {
      const wall = this.toWall(ms);
      return wall - utcDay.floor(new Date(wall)).getTime();
    }
    // A d3 time format (e.g. '%a %-d %b') of instants, in the zone
    label(specifier) {
      const format2 = utcFormat(specifier);
      return (ms) => format2(new Date(this.toWall(+ms)));
    }
    // An hour of the day (0 to 24) as a clock with the user's 24- or 12-hour pattern shows it, e.g.
    // '06:00', or '6 AM' (24 is the midnight that ends the day, '24:00' or '12 AM')
    hourLabel(hour) {
      if (!this.is12Hour) {
        return String(hour).padStart(2, "0") + ":00";
      }
      return (hour % 12 || 12) + (hour % 24 < 12 ? " AM" : " PM");
    }
    // The format of an axis's ticks, each as precise as it needs to be (as d3's own is), with a 24-
    // or 12-hour clock as the user's pattern has
    tickFormat() {
      const formats = {
        millisecond: utcFormat(".%L"),
        second: utcFormat(":%S"),
        minute: utcFormat(this.is12Hour ? "%-I:%M %p" : "%H:%M"),
        hour: utcFormat(this.is12Hour ? "%-I %p" : "%H:00"),
        day: utcFormat("%a %-d"),
        week: utcFormat("%-d %b"),
        month: utcFormat("%B"),
        year: utcFormat("%Y")
      };
      return (ms) => {
        const date = new Date(this.toWall(+ms));
        if (second(date) < date) {
          return formats.millisecond(date);
        }
        if (utcMinute(date) < date) {
          return formats.second(date);
        }
        if (utcHour(date) < date) {
          return formats.minute(date);
        }
        if (utcDay(date) < date) {
          return formats.hour(date);
        }
        if (utcMonth(date) < date) {
          return utcSunday(date) < date ? formats.day(date) : formats.week(date);
        }
        return utcYear(date) < date ? formats.month(date) : formats.year(date);
      };
    }
  };
  var UTC = new Zone();
  var hostZone = null;
  var hostSettings;
  function currentZone() {
    const time = typeof stroom !== "undefined" && stroom.time ? stroom.time : null;
    if (time === null) {
      return UTC;
    }
    const settings = time.settings();
    if (hostZone === null || settings !== hostSettings) {
      hostSettings = settings;
      hostZone = new Zone({
        offsetMinutes: (ms) => time.offsetMinutes(ms),
        format: (ms) => time.format(ms),
        formatCompact: (ms) => time.formatCompact(ms),
        is12Hour: time.is12Hour()
      });
    }
    return hostZone;
  }

  // src/shared/format.js
  var formatInteger = format(",");
  var formatDecimal = format(",.3~f");
  function formatNumber(value) {
    if (!isNumber(value)) {
      return value === null || value === void 0 ? "" : String(value);
    }
    return Number.isInteger(value) ? formatInteger(value) : formatDecimal(value);
  }
  function formatDate(value, pattern) {
    if (!isNumber(value)) {
      return value === null || value === void 0 ? "" : String(value);
    }
    const zone = currentZone();
    return pattern ? zone.label(pattern)(value) : zone.format(value);
  }
  function formatKey(key, datePattern) {
    if (datePattern && isNumber(numberOf(key))) {
      return formatDate(numberOf(key), datePattern);
    }
    return key === null || key === void 0 ? "" : String(key);
  }
  function numberOf(value) {
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return value;
  }

  // src/shared/grid.js
  function columnsFor(count) {
    return Math.max(1, Math.ceil(Math.sqrt(count)));
  }
  var ZOOM_IN_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var ZOOM_OUT_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  var Grid = class {
    // `element` is the visualisation's element. `createChart(body)` makes the chart of a cell in
    // its body element, returning {draw(cell), destroy()}.
    constructor(element, createChart) {
      this.createChart = createChart;
      this.container = document.createElement("div");
      this.container.className = "vis-grid";
      element.appendChild(this.container);
      this.cells = /* @__PURE__ */ new Map();
      this.zoomedKey = null;
      this.lastCells = [];
    }
    // Lays out the cells, each {key, label, ...} with whatever its chart needs to draw it, and
    // draws each cell's chart (chart.draw(cell)). Cells are kept, by key, from one call to the next.
    update(cells) {
      this.lastCells = cells;
      if (this.zoomedKey !== null && !cells.some((cell) => cell.key === this.zoomedKey)) {
        this.zoomedKey = null;
      }
      const shown = this.zoomedKey === null ? cells : cells.filter((cell) => cell.key === this.zoomedKey);
      const headed = cells.length > 1;
      this.container.style.gridTemplateColumns = "repeat(" + columnsFor(shown.length) + ", minmax(0, 1fr))";
      this.container.style.gridTemplateRows = "repeat(" + Math.ceil(shown.length / columnsFor(shown.length)) + ", minmax(0, 1fr))";
      this.container.classList.toggle("vis-grid--single", !headed);
      const keys = new Set(shown.map((cell) => cell.key));
      for (const [key, cell] of this.cells) {
        if (!keys.has(key)) {
          cell.chart.destroy();
          cell.element.remove();
          this.cells.delete(key);
        }
      }
      shown.forEach((data, index2) => {
        let cell = this.cells.get(data.key);
        if (!cell) {
          cell = this.createCell();
          this.cells.set(data.key, cell);
        }
        if (this.container.children[index2] !== cell.element) {
          this.container.insertBefore(cell.element, this.container.children[index2] || null);
        }
        cell.header.hidden = !headed;
        cell.name.textContent = data.label;
        cell.name.title = data.label;
        const zoomedIn = this.zoomedKey !== null;
        cell.zoom.innerHTML = zoomedIn ? ZOOM_OUT_ICON : ZOOM_IN_ICON;
        cell.zoom.setAttribute("aria-label", zoomedIn ? "Show all charts" : "Zoom in on " + data.label);
        cell.zoom.title = cell.zoom.getAttribute("aria-label");
        cell.zoom.onclick = () => {
          this.zoomedKey = this.zoomedKey === null ? data.key : null;
          this.update(this.lastCells);
          const again = this.cells.get(data.key);
          if (again) {
            again.zoom.focus();
          }
        };
        if (headed) {
          cell.element.setAttribute("aria-label", data.label);
        } else {
          cell.element.removeAttribute("aria-label");
        }
      });
      shown.forEach((data) => this.cells.get(data.key).chart.draw(data));
    }
    createCell() {
      const element = document.createElement("section");
      element.className = "vis-grid__cell";
      const header = document.createElement("div");
      header.className = "vis-grid__header";
      const name = document.createElement("span");
      name.className = "vis-grid__name";
      const zoom = document.createElement("button");
      zoom.type = "button";
      zoom.className = "vis-grid__zoom";
      header.append(name, zoom);
      const body = document.createElement("div");
      body.className = "vis-grid__body";
      element.append(header, body);
      return { element, header, name, zoom, body, chart: this.createChart(body) };
    }
    // Redraws every chart at its cell's new size
    resize() {
      this.update(this.lastCells);
    }
  };

  // src/shared/legend.js
  var LEGEND_BUTTON = "legend";
  var Legend = class {
    // `element` is the visualisation's element, `toolbar` its Toolbar, and `onChange()` is called
    // when a category is shown or hidden
    constructor(element, toolbar, onChange) {
      this.toolbar = toolbar;
      this.onChange = onChange;
      this.items = [];
      this.hidden = /* @__PURE__ */ new Set();
      this.open = false;
      this.panel = document.createElement("div");
      this.panel.className = "vis-legend";
      this.panel.setAttribute("role", "group");
      this.panel.setAttribute("aria-label", "Legend");
      this.panel.hidden = true;
      this.panel.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          this.setOpen(false);
        }
      });
      element.insertBefore(this.panel, element.firstChild);
      this.updateToolbar();
    }
    // Sets the categories, each {key, label, colour}, and for a line also its dashes (`dash`, see
    // lines.js lineDash). A category hidden before stays hidden.
    setItems(items) {
      this.items = items;
      const keys = new Set(items.map((item) => item.key));
      for (const key of [...this.hidden]) {
        if (!keys.has(key)) {
          this.hidden.delete(key);
        }
      }
      this.render();
    }
    // Whether a category is hidden
    isHidden(key) {
      return this.hidden.has(key);
    }
    // Shows or hides a category, as its button does, e.g. as a setting says
    setHidden(key, hidden) {
      if (hidden) {
        this.hidden.add(key);
      } else {
        this.hidden.delete(key);
      }
      this.render();
    }
    setOpen(open) {
      this.open = open;
      this.panel.hidden = !open;
      this.updateToolbar();
    }
    updateToolbar() {
      this.toolbar.set(
        { id: LEGEND_BUTTON, title: "Show legend", icon: "TAGS", pressed: this.open },
        (pressed) => this.setOpen(pressed)
      );
    }
    render() {
      this.panel.replaceChildren(...this.items.map((item) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "vis-legend__item";
        const shown = !this.hidden.has(item.key);
        button.setAttribute("aria-pressed", String(shown));
        button.classList.toggle("vis-legend__item--hidden", !shown);
        button.title = (shown ? "Hide " : "Show ") + item.label;
        const swatch = document.createElement("span");
        if (item.dash !== void 0) {
          swatch.className = "vis-legend__swatch vis-legend__swatch--line";
          swatch.innerHTML = '<svg viewBox="0 0 24 12" aria-hidden="true"><line x1="0" y1="6" x2="24" y2="6"/></svg>';
          const line = swatch.querySelector("line");
          line.style.stroke = item.colour;
          if (item.dash) {
            line.style.strokeDasharray = item.dash;
          }
        } else {
          swatch.className = "vis-legend__swatch";
          swatch.style.backgroundColor = item.colour;
        }
        const label = document.createElement("span");
        label.className = "vis-legend__label";
        label.textContent = item.label;
        button.append(swatch, label);
        button.addEventListener("click", () => {
          if (this.hidden.has(item.key)) {
            this.hidden.delete(item.key);
          } else {
            this.hidden.add(item.key);
          }
          this.render();
          const again = this.panel.children[this.items.indexOf(item)];
          if (again) {
            again.focus();
          }
          this.onChange();
        });
        return button;
      }));
    }
  };

  // src/shared/look.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  var GLOW_ID = "vis-glow";
  var LINE_GLOW_ID = "vis-glow-line";
  var GLOW_TIGHT_STRENGTH = "0.7";
  var GLOW_WIDE_STRENGTH = "0.7";
  function svgElement(name, attributes) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }
    return element;
  }
  function glowFilter(id2, region, tightBlur, wideBlur) {
    const filter2 = svgElement("filter", { id: id2, "color-interpolation-filters": "sRGB", ...region });
    filter2.appendChild(svgElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: tightBlur, result: "tightBlur" }));
    const tight = svgElement("feComponentTransfer", { in: "tightBlur", result: "tight" });
    tight.appendChild(svgElement("feFuncA", { type: "linear", slope: GLOW_TIGHT_STRENGTH }));
    filter2.appendChild(tight);
    filter2.appendChild(svgElement("feGaussianBlur", { in: "SourceGraphic", stdDeviation: wideBlur, result: "wideBlur" }));
    const wide = svgElement("feComponentTransfer", { in: "wideBlur", result: "wide" });
    wide.appendChild(svgElement("feFuncA", { type: "linear", slope: GLOW_WIDE_STRENGTH }));
    filter2.appendChild(wide);
    const merge = svgElement("feMerge", {});
    for (const input of ["wide", "tight", "SourceGraphic"]) {
      merge.appendChild(svgElement("feMergeNode", { in: input }));
    }
    filter2.appendChild(merge);
    return filter2;
  }
  var Look = class {
    // `element` is the visualisation's element, which the definitions are put in
    constructor(element) {
      const svg = svgElement("svg", { class: "vis-look", width: 0, height: 0, "aria-hidden": "true", focusable: "false" });
      this.defs = svgElement("defs", {});
      svg.appendChild(this.defs);
      this.defs.appendChild(glowFilter(GLOW_ID, { x: "-100%", y: "-40%", width: "300%", height: "180%" }, 2, 6));
      this.defs.appendChild(glowFilter(
        LINE_GLOW_ID,
        { filterUnits: "userSpaceOnUse", x: "-10%", y: "-10%", width: "120%", height: "120%" },
        1.5,
        5
      ));
      element.appendChild(svg);
      this.gradients = /* @__PURE__ */ new Set();
    }
    // The fill of an area of a colour: a gradient from the colour, faint, at the top to almost
    // nothing at the bottom of the area, under a line of the colour that stands out from it. With
    // `upwards`, for an area that hangs down from its line (e.g. below zero), the other way up
    fadeFill(colour, upwards) {
      const id2 = "vis-fade-" + (upwards ? "up-" : "") + String(colour).replace(/[^a-zA-Z0-9]/g, "");
      if (!this.gradients.has(id2)) {
        const gradient = svgElement("linearGradient", { id: id2, x1: "0", y1: upwards ? "1" : "0", x2: "0", y2: upwards ? "0" : "1" });
        gradient.appendChild(svgElement("stop", { offset: "0", "stop-color": colour, "stop-opacity": "0.45" }));
        gradient.appendChild(svgElement("stop", { offset: "1", "stop-color": colour, "stop-opacity": "0.04" }));
        this.defs.appendChild(gradient);
        this.gradients.add(id2);
      }
      return "url(#" + id2 + ")";
    }
    // The fill of a ring's slice of a colour (e.g. a doughnut's), centred on the ring's centre: from
    // almost nothing at the inner radius to the colour, faint, at the outer, under a line of the
    // colour that stands out from it
    ringFadeFill(colour, innerRadius, outerRadius) {
      const r = Math.max(1, Math.round(outerRadius));
      const inner = Math.max(0, Math.min(1, innerRadius / outerRadius));
      const id2 = "vis-ring-" + String(colour).replace(/[^a-zA-Z0-9]/g, "") + "-" + r + "-" + Math.round(inner * 100);
      if (!this.gradients.has(id2)) {
        const gradient = svgElement("radialGradient", { id: id2, gradientUnits: "userSpaceOnUse", cx: "0", cy: "0", r: String(r) });
        gradient.appendChild(svgElement("stop", { offset: String(inner), "stop-color": colour, "stop-opacity": "0.06" }));
        gradient.appendChild(svgElement("stop", { offset: "1", "stop-color": colour, "stop-opacity": "0.5" }));
        this.defs.appendChild(gradient);
        this.gradients.add(id2);
      }
      return "url(#" + id2 + ")";
    }
  };

  // src/shared/selection.js
  function inCell(item, cell) {
    if (!cell || !(cell.gridCellCount > 1)) {
      return item;
    }
    return { ...item, key: cell.key + "~#~" + item.key, gridSeries: cell.key };
  }
  var Selection3 = class {
    // `onChange()` is called when the selection changes, so that the chart can show it
    constructor(onChange) {
      this.onChange = onChange;
      this.items = /* @__PURE__ */ new Map();
      this.drawn = null;
    }
    // Selects an item as a person asked to, by a click or a key (`event`, as stroom.points gives
    // it: {ctrlKey, metaKey, keyboard}): with Ctrl (or Cmd), or from the keyboard, it is added to
    // the selection, or taken out if it is in it already; otherwise it is selected in place of the
    // others, or (if it is all that is selected) taken out. `item` is {key, ...}: the key says
    // which point it is and the rest are the fields Stroom's selection handlers can use
    choose(item, event) {
      const adding = Boolean(event && (event.ctrlKey || event.metaKey || event.keyboard));
      if (adding) {
        this.toggle(item);
      } else if (this.items.size === 1 && this.items.has(item.key)) {
        this.clear();
      } else {
        this.items = /* @__PURE__ */ new Map([[item.key, item]]);
        this.changed();
      }
    }
    // Adds an item, or takes it out if it is already selected (see choose)
    toggle(item) {
      if (this.items.has(item.key)) {
        this.items.delete(item.key);
      } else {
        this.items.set(item.key, item);
      }
      this.changed();
    }
    // Selects nothing, telling Stroom so (an empty selection), if anything was selected
    clear() {
      if (this.items.size > 0) {
        this.items.clear();
        this.changed();
      }
    }
    has(key) {
      if (this.drawn !== null) {
        this.drawn.add(key);
      }
      return this.items.has(key);
    }
    isEmpty() {
      return this.items.size === 0;
    }
    // Starts noting the keys of the points drawn (the chart asks whether each is selected as it
    // shows the selection), before the chart draws new data
    noteDrawn() {
      this.drawn = /* @__PURE__ */ new Set();
    }
    // Once the chart has drawn new data: takes out of the selection the items whose points are no
    // longer drawn (e.g. the data no longer has them, or the legend hides them), telling Stroom.
    // If no point was drawn at all (e.g. the chart had no room to draw in), nothing can be told,
    // and the selection is kept
    keepDrawn() {
      const drawn = this.drawn;
      this.drawn = null;
      if (drawn === null || drawn.size === 0) {
        return;
      }
      const kept = [...this.items.values()].filter((item) => drawn.has(item.key));
      if (kept.length < this.items.size) {
        this.items = new Map(kept.map((item) => [item.key, item]));
        this.changed();
      }
    }
    // Tells Stroom the selection, and the chart to show it
    changed() {
      if (typeof stroom !== "undefined" && typeof stroom.select === "function") {
        stroom.select([...this.items.values()]);
      }
      this.onChange();
    }
  };

  // src/shared/toolbar.js
  function hasHostToolbar() {
    return typeof stroom !== "undefined" && typeof stroom.setToolbarButtons === "function";
  }
  var Toolbar = class {
    constructor() {
      this.buttons = /* @__PURE__ */ new Map();
      this.lastSent = null;
    }
    // Adds a button, or changes one with the same id. `button` is {id, title, icon, pressed,
    // enabled} (pressed only for a toggle; enabled false for one that can't be pressed for now) and `onPress(pressed)` is called when it is pressed.
    set(button, onPress) {
      this.buttons.set(button.id, { button, onPress });
      this.send();
    }
    // Removes a button
    remove(id2) {
      if (this.buttons.delete(id2)) {
        this.send();
      }
    }
    // Tells Stroom the buttons, if they have changed since it was last told
    send() {
      if (!hasHostToolbar()) {
        return;
      }
      const buttons = [...this.buttons.values()].map((entry) => entry.button);
      const json = JSON.stringify(buttons);
      if (json === this.lastSent) {
        return;
      }
      this.lastSent = json;
      stroom.setToolbarButtons(buttons, (id2, pressed) => {
        const entry = this.buttons.get(id2);
        if (entry) {
          entry.onPress(pressed);
        }
      });
    }
    // Tells Stroom again, e.g. once it has been in touch (vis.js only knows where it is then)
    resend() {
      this.lastSent = null;
      this.send();
    }
  };

  // src/shared/chart.js
  var Chart = class {
    // `createCell(body, chart)` makes the chart of a grid cell in its body element, returning
    // {draw(cell), showHighlight(), destroy()}; `seriesField` is the id of the setting that names
    // the series field, e.g. 'lineSeries'
    constructor(createCell, seriesField) {
      this.element = document.createElement("div");
      this.settings = {};
      this.data = null;
      this.seriesField = seriesField;
      this.toolbar = new Toolbar();
      this.colours = new Colours(() => this.isDarkTheme(), () => this.redraw());
      this.look = new Look(this.element);
      this.legend = new Legend(this.element, this.toolbar, () => this.redraw());
      this.selection = new Selection3(() => this.cells.forEach((cell) => {
        cell.showHighlight();
        if (cell.points) {
          cell.points.refresh();
        }
      }));
      this.element.addEventListener("vis-clear-selection", () => this.selection.clear());
      this.cells = /* @__PURE__ */ new Set();
      this.grid = new Grid(this.element, (body) => createCell(body, this));
      new MutationObserver(() => this.redraw()).observe(this.element, { attributes: true, attributeFilter: ["class"] });
      if (typeof stroom !== "undefined" && typeof stroom.onTimeChanged === "function") {
        stroom.onTimeChanged(() => this.redraw());
      }
    }
    // The entry point from Stroom
    setData(context, settings, data) {
      this.settings = settings || {};
      this.data = data;
      this.toolbar.resend();
      this.selection.noteDrawn();
      this.redraw();
      this.selection.keepDrawn();
    }
    resize() {
      this.grid.resize();
    }
    isDarkTheme() {
      return typeof stroom !== "undefined" && typeof stroom.isDarkTheme === "function" ? stroom.isDarkTheme() : this.element.classList.contains("stroom-theme-dark");
    }
    // Whether there is data to draw: Stroom's data has its values and their types
    hasData() {
      const data = this.data;
      return Boolean(data) && Array.isArray(data.values) && Array.isArray(data.types);
    }
    // The name of a series, by its key: e.g. 'No Host' for rows without a value of the series
    // field (Host), or '' if there is no series field
    seriesLabel(key) {
      const label = formatKey(key, this.settings.seriesDateFormat);
      const field = this.settings[this.seriesField];
      return label === "" && field ? "No " + field : label;
    }
    // Draws the data; each chart has its own
    redraw() {
      this.grid.update([]);
    }
  };

  // src/shared/heat.js
  var HEAT_BUCKETS = 9;
  function heatColours(darkTheme) {
    const colours = darkTheme ? quantize_default((t) => inferno(0.3 + t * 0.67), HEAT_BUCKETS) : quantize_default((t) => YlGnBu_default(0.3 + t * 0.7), HEAT_BUCKETS);
    return colours.map((colour) => rgb(colour).formatHex());
  }
  var formatShort = format(".3~s");
  function bucketWords(bucket) {
    return bucket.lo === bucket.hi ? formatShort(bucket.lo) : formatShort(bucket.lo) + " to " + formatShort(bucket.hi);
  }
  function heatScale(min2, max2, colours) {
    if (!isNumber(min2) || !isNumber(max2)) {
      return { buckets: [], bucketOf: () => null };
    }
    if (max2 <= min2) {
      const only = { index: 0, lo: min2, hi: max2, colour: colours[colours.length - 1] };
      return { buckets: [only], bucketOf: () => only };
    }
    const size = (max2 - min2) / colours.length;
    const buckets = colours.map((colour, index2) => ({
      index: index2,
      lo: min2 + index2 * size,
      hi: index2 === colours.length - 1 ? max2 : min2 + (index2 + 1) * size,
      colour
    }));
    return {
      buckets,
      bucketOf: (value) => buckets[Math.max(0, Math.min(buckets.length - 1, Math.floor((value - min2) / size)))]
    };
  }

  // src/shared/searchField.js
  var SearchField = class {
    // `chart` has `element`, `toolbar`, `setSearch(text)` and `cells`, each cell having
    // `focusFirstMatch()` and `focusTabStop()`
    constructor(chart) {
      this.chart = chart;
      this.open = false;
      this.panel = document.createElement("div");
      this.panel.className = "vis-search";
      this.panel.hidden = true;
      const label = document.createElement("label");
      label.className = "vis-search__label";
      label.append("Find nodes ");
      this.input = document.createElement("input");
      this.input.type = "search";
      this.input.className = "vis-search__input";
      this.input.autocomplete = "off";
      label.append(this.input);
      this.count = document.createElement("span");
      this.count.className = "vis-search__count";
      this.count.setAttribute("aria-live", "polite");
      this.panel.append(label, this.count);
      chart.element.append(this.panel);
      this.input.addEventListener("input", () => chart.setSearch(this.input.value));
      this.input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          chart.cells.forEach((cell) => cell.focusFirstMatch());
        } else if (event.key === "Escape") {
          event.preventDefault();
          this.input.value = "";
          chart.setSearch("");
          this.setOpen(false);
          chart.cells.forEach((cell) => cell.focusTabStop());
        }
      });
      this.updateToolbar();
    }
    setOpen(open) {
      this.open = open;
      this.panel.hidden = !open;
      if (open) {
        this.input.focus();
      }
      this.updateToolbar();
    }
    updateToolbar() {
      this.chart.toolbar.set(
        { id: "search", title: "Find nodes", icon: "SEARCH", pressed: this.open },
        (pressed) => this.setOpen(pressed)
      );
    }
    // Says how many nodes match, when something has been typed
    showCount(count) {
      this.count.textContent = this.input.value.trim() === "" ? "" : count + (count === 1 ? " node matches" : " nodes match");
    }
  };

  // src/shared/settings.js
  function isTrue(value, otherwise) {
    if (value === void 0 || value === null || value === "") {
      return otherwise;
    }
    return String(value).toLowerCase() === "true";
  }
  function settingNumber(value, defaultValue, min2, max2) {
    const number = value === null || value === void 0 || value === "" ? NaN : Number(value);
    return Number.isFinite(number) ? Math.max(min2, Math.min(max2, number)) : defaultValue;
  }

  // src/shared/networkChart.js
  var TOOLTIP_LINKS = 5;
  var COLOUR_BY_GROUP = "Group";
  var COLOUR_BY_ACTIVITY = "Activity";
  var NetworkChart = class extends Chart {
    // `createCell(body, chart)` makes the network's drawing, as for Chart; `kind` is what the
    // network is called for a screen reader, e.g. 'Network'
    constructor(createCell, kind) {
      super(createCell, "sourceGroup");
      this.kind = kind;
      this.chosen = /* @__PURE__ */ new Map();
      this.expandedLinks = /* @__PURE__ */ new Set();
      this.searchText = "";
      this.search = new SearchField(this);
    }
    isLinkExpanded(a2, b) {
      return this.expandedLinks.has(groupPairKey(a2, b));
    }
    // Shows the search's matches, and says how many there are
    setSearch(text) {
      this.searchText = text;
      this.cells.forEach((cell) => cell.showHighlight());
      this.search.showCount(this.cells.size > 0 ? [...this.cells][0].matchCount() : 0);
    }
    // What the counts are called, e.g. 'Emails'
    countName() {
      return this.settings.count || "Count";
    }
    hasGroups() {
      return Boolean(this.settings.sourceGroup || this.settings.targetGroup);
    }
    isExpanded(group) {
      return this.chosen.has(group) ? this.chosen.get(group) : isTrue(this.settings.expandGroups, false);
    }
    // How the nodes are coloured: by their group's colour (COLOUR_BY_GROUP), or by how busy they
    // are (COLOUR_BY_ACTIVITY); a network that has no Colour By setting colours by group
    colourBy() {
      return this.settings.colourBy === COLOUR_BY_ACTIVITY ? COLOUR_BY_ACTIVITY : COLOUR_BY_GROUP;
    }
    // The colour key of a node: its group's name, or its own name if it has no group
    colourKeyOf(node) {
      if (node.isGroup) {
        return String(node.name);
      }
      return node.group === null ? String(node.name) : String(node.group);
    }
    // The network of some rows, as the settings and the person's choices say
    networkOf(rows) {
      const maxNodes = Number(this.settings.maxNodes);
      return networkOf(rows, {
        isExpanded: (group) => this.isExpanded(group),
        isLinkExpanded: (a2, b) => this.isLinkExpanded(a2, b),
        hasCount: Boolean(this.settings.count),
        maxNodes: Number.isFinite(maxNodes) && maxNodes > 0 ? maxNodes : this.defaultMaxNodes()
      });
    }
    // How many nodes are drawn at most when the Max Nodes setting doesn't say
    defaultMaxNodes() {
      return Infinity;
    }
    // Works out the network, the legend and each node's colour, and draws it: the cell is
    // {key, label, network, colourOfNode, gridCellCount}
    redraw() {
      if (!this.hasData()) {
        this.grid.update([]);
        return;
      }
      const rows = this.data.values.filter(Array.isArray);
      const { network, colourOfNode } = this.colourBy() === COLOUR_BY_ACTIVITY ? this.byActivity(rows) : this.byGroup(rows);
      this.networkChanged(network);
      this.grid.update([{ key: null, label: "Chart", network, colourOfNode, gridCellCount: 1 }]);
      this.search.showCount(this.cells.size > 0 ? [...this.cells][0].matchCount() : 0);
    }
    // Each group (or, without groups, each node) has the dashboard's colour for it, and the legend
    // can hide it (the rows to or from it)
    byGroup(rows) {
      const settings = this.settings;
      const keyOf = (name, group) => String(isPresent(group) ? group : name);
      const keys = distinct(rows.flatMap((row) => [keyOf(row[0], row[2]), keyOf(row[1], row[3])]));
      const colourOf = this.colours.of(this.hasGroups() ? settings.sourceGroup || settings.targetGroup : settings.source, keys);
      this.legend.setItems(keys.map((key) => ({ key, label: key, colour: colourOf(key) })));
      const shownRows = rows.filter((row) => !this.legend.isHidden(keyOf(row[0], row[2])) && !this.legend.isHidden(keyOf(row[1], row[3])));
      return { network: this.networkOf(shownRows), colourOfNode: (node) => colourOf(this.colourKeyOf(node)) };
    }
    // Each node is coloured by how busy it is (activityOf), from cold to hot in the heat colours of
    // the theme, the legend the key of them, which can hide the nodes of each colour
    byActivity(rows) {
      const all = this.networkOf(rows);
      const values = all.nodes.map(activityOf);
      const scale = values.length === 0 ? heatScale(null, null, []) : heatScale(Math.min(...values), Math.max(...values), heatColours(this.isDarkTheme()));
      this.legend.setItems(scale.buckets.slice().reverse().map((bucket) => ({
        key: String(bucket.index),
        label: bucketWords(bucket) + " " + this.countName(),
        colour: bucket.colour
      })));
      const bucketOf = (node) => scale.bucketOf(activityOf(node));
      return {
        network: filterNetwork(all, (node) => !this.legend.isHidden(String(bucketOf(node).index))),
        colourOfNode: (node) => bucketOf(node).colour
      };
    }
    // Called with the network about to be drawn, e.g. to change the toolbar's buttons for it
    networkChanged() {
    }
    // A click on a node (or Enter on it): a group expands or collapses, and any other node, or a
    // Ctrl+Click or Space on any node, selects it
    activateNode(node, event, cell) {
      const keyboard = Boolean(event && event.keyboard);
      const space = keyboard && event.key === " ";
      if (event && (event.ctrlKey || event.metaKey) && !keyboard || space || !node.isGroup) {
        this.selection.choose(this.selectionItem(node, cell), event);
        return;
      }
      this.chosen.set(String(node.name), !node.expanded);
      this.redraw();
    }
    // A click on a line (or Enter on it): a line between two collapsed groups shows the members it
    // joins, and a line between members shown so goes back to the groups' line. Returns whether it
    // did either
    activateLine(link, event) {
      if (event && event.keyboard && event.key === " ") {
        return false;
      }
      if (link.groups !== null) {
        this.expandedLinks.add(groupPairKey(link.groups[0], link.groups[1]));
      } else if (link.viaGroups !== null) {
        this.expandedLinks.delete(link.viaGroups);
      } else {
        return false;
      }
      this.redraw();
      return true;
    }
    // What Stroom is told of a selected node (as the legacy network told it), in its cell
    selectionItem(node, cell) {
      if (node.isGroup) {
        return inCell({ key: "Group: " + node.name, name: node.name, group: node.name }, cell);
      }
      const item = { key: node.name + " (" + node.group + ")", name: node.name };
      if (node.group !== null && node.group !== void 0) {
        item.group = node.group;
      }
      return inCell(item, cell);
    }
    // A node's name for people to read, e.g. 'alice' or 'Ops (group)'
    nameOf(node) {
      return node.isGroup ? node.name + " (group)" : String(node.name);
    }
    // The tooltip of a node of a network (whose nodes `byId` has): its group or members, its counts
    // out, in and within, and its biggest links, e.g. 'To bob: 12'
    nodeTooltip(node, network, byId) {
      const count = this.countName();
      const rows = [];
      if (node.isGroup) {
        rows.push(["Members", formatNumber(node.members) + (node.expanded ? ", shown" : ", hidden")]);
      } else if (node.group !== null) {
        rows.push([this.settings.sourceGroup || "Group", String(node.group)]);
      }
      if (node.out > 0) {
        rows.push([count + " out", formatNumber(node.out)]);
      }
      if (node.in > 0) {
        rows.push([count + " in", formatNumber(node.in)]);
      }
      if (node.within > 0) {
        rows.push([count + " within", formatNumber(node.within)]);
      }
      const flows = network.links.filter((link) => !link.isMembership && (link.source === node.id || link.target === node.id)).flatMap((link) => {
        const fromMe = link.source === node.id ? link.forward : link.reverse;
        const toMe = link.source === node.id ? link.reverse : link.forward;
        const other = byId.get(link.source === node.id ? link.target : link.source);
        return [["To " + this.nameOf(other), fromMe], ["From " + this.nameOf(other), toMe]];
      }).filter(([, value]) => value > 0).sort((a2, b) => b[1] - a2[1]);
      flows.slice(0, TOOLTIP_LINKS).forEach(([name, value]) => rows.push([name, formatNumber(value)]));
      if (flows.length > TOOLTIP_LINKS) {
        rows.push(["And", flows.length - TOOLTIP_LINKS + " more"]);
      }
      return { title: this.nameOf(node), rows };
    }
    // The tooltip of a line: its two ends, and the counts each way, e.g. 'Ops (group) to Dev
    // (group): 8', and what Enter (or a click) does to it, if anything
    lineTooltip(link, byId) {
      const source = byId.get(link.source);
      const target = byId.get(link.target);
      const rows = [];
      if (link.forward > 0) {
        rows.push([this.nameOf(source) + " to " + this.nameOf(target), formatNumber(link.forward)]);
      }
      if (link.reverse > 0) {
        rows.push([this.nameOf(target) + " to " + this.nameOf(source), formatNumber(link.reverse)]);
      }
      if (link.groups !== null) {
        rows.push(["Click or Enter", "shows the members it joins"]);
      } else if (link.viaGroups !== null) {
        rows.push(["Click or Enter", "shows their groups' line again"]);
      }
      return { title: this.nameOf(source) + " and " + this.nameOf(target), rows };
    }
    // The network for a screen reader, e.g. 'Network of Emails between From and To: 3 nodes, 3 of
    // them groups (2 collapsed), 3 links'
    describe(network) {
      const settings = this.settings;
      let text = this.kind + " of " + this.countName() + " between " + (settings.source || "Source") + " and " + (settings.target || "Target");
      if (network.nodes.length === 0) {
        return text + ": no data";
      }
      const nodes = network.nodes.length;
      const groups = network.nodes.filter((node) => node.isGroup);
      const collapsed = groups.filter((node) => !node.expanded).length;
      const links = network.links.filter((link) => !link.isMembership).length;
      text += ": " + nodes + (nodes === 1 ? " node" : " nodes");
      if (groups.length > 0) {
        text += ", " + groups.length + (groups.length === 1 ? " of them a group" : " of them groups") + " (" + collapsed + " collapsed)";
      }
      text += ", " + links + (links === 1 ? " link" : " links");
      if (network.left > 0) {
        text += ", " + network.left + " more nodes left out by Max Nodes";
      }
      return text;
    }
    // The nodes and lines kept bright when something is shown (hovered or focused: a node, or a
    // line when `isLine`), or else the search's `matches`, as {keepNode(node), keepLine(link)}:
    // those joined to what is shown, or the matches and their lines
    kept(network, shown, isLine, matches) {
      if (shown !== null && isLine) {
        return {
          keepNode: (node) => node.id === shown.source || node.id === shown.target,
          keepLine: (link) => link === shown
        };
      }
      if (shown !== null) {
        const near = /* @__PURE__ */ new Set([shown.id]);
        for (const link of network.links) {
          if (link.source === shown.id) {
            near.add(link.target);
          }
          if (link.target === shown.id) {
            near.add(link.source);
          }
        }
        return {
          keepNode: (node) => near.has(node.id),
          keepLine: (link) => link.source === shown.id || link.target === shown.id
        };
      }
      if (matches.size > 0) {
        return {
          keepNode: (node) => matches.has(node.id),
          keepLine: (link) => matches.has(link.source) || matches.has(link.target)
        };
      }
      if (this.searchText.trim() !== "") {
        return { keepNode: () => false, keepLine: () => false };
      }
      return { keepNode: () => true, keepLine: () => true };
    }
    // The nodes in the order the keyboard goes through them: a group's nodes together, the groups in
    // the order they are first seen
    keyboardOrder(network) {
      const firstSeen = /* @__PURE__ */ new Map();
      network.nodes.forEach((node, index2) => {
        const key = this.colourKeyOf(node);
        if (!firstSeen.has(key)) {
          firstSeen.set(key, index2);
        }
      });
      return network.nodes.slice().sort((a2, b) => firstSeen.get(this.colourKeyOf(a2)) - firstSeen.get(this.colourKeyOf(b)));
    }
  };

  // src/shared/canvasNetwork.js
  var ROUND_SHAPES = /* @__PURE__ */ new Set(["Sphere", "Circle"]);
  var MAX_LABELLED_NODES = 60;
  var SHOW_NAMES_ALL = "All";
  var SHOW_NAMES_NONE = "None";
  var LINE_WIDTH_SAME = "Same";
  var SHADING_FLAT = "Flat";
  var FLOW_DOTS = 3;
  var FLOW_SPEEDS = { Slow: 0.15, Medium: 0.35, Fast: 0.7 };
  var ZOOM_STEP = 1.25;
  var FADED_OPACITY = 0.15;
  var LINE_FADE = 0.45;
  var DRAG_THRESHOLD = 3;
  var HANDLE_REACH = 8;
  var MIN_POINT_RADIUS = 4;
  var CanvasNetworkChart = class extends NetworkChart {
    constructor(createCell, kind) {
      super(createCell, kind);
      this.playChosen = null;
    }
    // Whether the lines are all the same width (Line Width: Same) rather than as thick as their counts
    sameLineWidths() {
      return this.settings.lineWidth === LINE_WIDTH_SAME;
    }
    // Whether the lines have arrowheads (the Show Arrows setting)
    showsArrows() {
      return isTrue(this.settings.showArrows, true);
    }
    // Whether the nodes are each one plain colour (Shading: Flat) rather than lit
    isFlat() {
      return this.settings.shading === SHADING_FLAT;
    }
    // Whether dots flow along the lines (the Show Flow setting)
    showsFlow() {
      return isTrue(this.settings.flow, true);
    }
    // Whether the dots are moving: as the person chose, or else unless they have asked their system
    // for less motion (WCAG 2.3.3). Paused, they stay where they are, still showing which way
    isPlaying() {
      if (!this.showsFlow()) {
        return false;
      }
      return this.playChosen !== null ? this.playChosen : !prefersReducedMotion();
    }
    // How fast the dots flow, in lines a second
    flowSpeed() {
      return Object.hasOwn(FLOW_SPEEDS, this.settings.flowSpeed) ? FLOW_SPEEDS[this.settings.flowSpeed] : FLOW_SPEEDS.Medium;
    }
    // The shape a node is drawn as: by what it does (see roleOf: 'source', 'target', 'both' or
    // 'none'), or with a round Node Shape round ('target'; an expanded group 'globe', see-through)
    shapeOf(node) {
      if (ROUND_SHAPES.has(this.settings.nodeShape)) {
        return node.expanded ? "globe" : "target";
      }
      return roleOf(node);
    }
    // The nodes whose names are written beside them (see MAX_LABELLED_NODES)
    labelledNodes(network) {
      const names = this.settings.showNames;
      if (names === SHOW_NAMES_NONE) {
        return [];
      }
      if (names === SHOW_NAMES_ALL || network.nodes.length <= MAX_LABELLED_NODES) {
        return network.nodes;
      }
      const matches = matchesOf(network, this.searchText);
      return network.nodes.filter((node) => node.isGroup || matches.has(node.id));
    }
    // How thick a line is between the thinnest and the thickest, 0 to 1: as its counts, out of the
    // `most` any line has; with Line Width: Same, null
    lineWeight(link, most) {
      return this.sameLineWidths() ? null : Math.sqrt((link.forward + link.reverse - 1) / Math.max(1, most - 1));
    }
    // The layout's settings, which each network has its own of
    layoutOptions() {
      return {};
    }
    networkChanged() {
      this.updateButtons();
    }
    // The buttons in Stroom's toolbar: Pause or Play the flow (when it is shown, so that the moving
    // dots can always be stopped, WCAG 2.2.2), and zoom in, out and back to the start
    updateButtons() {
      if (this.showsFlow()) {
        const playing = this.isPlaying();
        this.toolbar.set({
          id: "flow",
          title: playing ? "Pause the flow" : "Play the flow",
          icon: playing ? "PAUSE" : "PLAY",
          pressed: playing
        }, () => {
          this.playChosen = !this.isPlaying();
          this.updateButtons();
          this.cells.forEach((cell) => cell.animate());
        });
      } else {
        this.toolbar.remove("flow");
      }
      this.toolbar.set(
        { id: "zoomIn", title: "Zoom in", icon: "ADD" },
        () => this.cells.forEach((cell) => cell.zoom(ZOOM_STEP))
      );
      this.toolbar.set(
        { id: "zoomOut", title: "Zoom out", icon: "REMOVE" },
        () => this.cells.forEach((cell) => cell.zoom(1 / ZOOM_STEP))
      );
      this.toolbar.set(
        { id: "resetView", title: "Reset the view", icon: "UNDO" },
        () => this.cells.forEach((cell) => cell.resetView())
      );
    }
  };
  var CanvasNetworkCell = class {
    // `keysDescription` is what a screen reader is told of the keys that move the view, and
    // `unavailableWords` what is said when the browser can't draw (createSurface returns false)
    constructor(body, chart, { keysDescription, unavailableWords }) {
      this.chart = chart;
      this.unavailableWords = unavailableWords;
      chart.cells.add(this);
      this.element = document.createElement("div");
      this.element.className = "vis-network";
      body.append(this.element);
      this.probe = document.createElement("div");
      this.probe.className = "vis-network__probe";
      this.element.append(this.probe);
      this.available = this.createSurface();
      this.svg = select_default2(this.element).append("svg").attr("class", "vis-chart vis-network__overlay").attr("aria-description", keysDescription);
      this.labelsGroup = this.svg.append("g").attr("class", "vis-network__labels").attr("aria-hidden", "true");
      this.nodesGroup = this.svg.append("g").attr("class", "vis-network__nodes");
      this.handlesGroup = this.svg.append("g").attr("class", "vis-network__handles");
      this.emptyText = this.svg.append("text").attr("class", "vis-empty").attr("aria-hidden", "true");
      this.places = /* @__PURE__ */ new Map();
      this.laidOut = null;
      this.view = null;
      this.goal = null;
      this.size = null;
      this.placedView = null;
      this.pointsStale = true;
      this.highlighted = null;
      this.summary = chart.kind;
      this.frame = null;
      this.flowTime = 0;
      this.lastFrameTime = null;
      this.drag = null;
      this.dragged = false;
      const overlay = this.svg.node();
      overlay.addEventListener("keydown", (event) => this.onKey(event));
      overlay.addEventListener("pointerdown", (event) => this.onPointerDown(event));
      overlay.addEventListener("pointermove", (event) => this.onPointerMove(event));
      overlay.addEventListener("pointerup", (event) => this.onPointerUp(event));
      overlay.addEventListener("pointercancel", (event) => this.onPointerUp(event));
      overlay.addEventListener("pointerleave", () => this.onPointerLeave());
      overlay.addEventListener("wheel", (event) => this.onWheel(event), { passive: false });
      overlay.addEventListener("dblclick", (event) => {
        event.preventDefault();
        this.resetView();
      });
      overlay.addEventListener("click", (event) => this.onClick(event), true);
      this.points = typeof stroom !== "undefined" && typeof stroom.points === "function" ? stroom.points(overlay, {
        selector: ".vis-network__node, .vis-network__handle",
        // A group's nodes at a time, then the lines
        group: (element) => isHandle(element) ? "\0lines" : chart.colourKeyOf(element.__data__),
        tooltip: (element) => isHandle(element) ? this.chart.lineTooltip(element.__data__, this.byId) : this.chart.nodeTooltip(element.__data__, this.cell.network, this.byId),
        highlight: (element) => {
          this.highlighted = element;
          if (element !== null && element === document.activeElement) {
            this.bringIntoView(element);
          }
          this.showHighlight();
        },
        select: (element, event) => isHandle(element) ? this.activateLine(element.__data__, event) : this.chart.activateNode(element.__data__, event, this.cell),
        summary: () => this.summary
      }) : null;
    }
    draw(cell) {
      this.cell = cell;
      const width = this.element.clientWidth || this.element.parentNode.clientWidth;
      const height = this.element.clientHeight || this.element.parentNode.clientHeight;
      if (width <= 0 || height <= 0) {
        return;
      }
      const network = cell.network;
      this.byId = new Map(network.nodes.map((node) => [node.id, node]));
      let empty2 = "";
      if (network.nodes.length === 0) {
        empty2 = "No data";
      } else if (!this.available) {
        empty2 = this.unavailableWords;
      }
      this.emptyText.attr("x", width / 2).attr("y", height / 2).text(empty2);
      const options = this.chart.layoutOptions();
      const shape = network.nodes.map((node) => node.id).join("|") + "#" + network.links.map((link) => link.id).join("|") + "#" + JSON.stringify(options);
      const relaidOut = shape !== this.laidOut;
      if (relaidOut) {
        this.places = this.layOut(network, options, this.places);
        this.laidOut = shape;
      }
      this.size = { width, height };
      this.resize(width, height);
      this.fit(relaidOut);
      this.colours = this.themeColours();
      this.build(network);
      this.drawPoints(network);
      this.pointsStale = true;
      this.summary = this.chart.describe(network);
      this.showHighlight();
      if (this.points) {
        this.points.refresh();
      }
      this.animate();
    }
    // The theme's colours as '#rrggbb', for a canvas: the background's, the text's, the lines' (a
    // little toward the background) and the flowing dots'. With forced colours (a high contrast
    // theme), the system's, as CSS has them then
    themeColours() {
      const forced = typeof window.matchMedia === "function" && window.matchMedia("(forced-colors: active)").matches;
      const read = (expression, fallback) => {
        this.probe.style.color = "";
        this.probe.style.color = expression;
        const parsed = color(getComputedStyle(this.probe).color);
        return parsed && parsed.opacity > 0 ? parsed.formatHex() : fallback;
      };
      const dark = this.chart.isDarkTheme();
      const background = forced ? read("Canvas", "#000000") : read("var(--vis__background-color)", dark ? DARK_BACKGROUND : LIGHT_BACKGROUND);
      const text = forced ? read("CanvasText", "#ffffff") : read("var(--vis-text__color)", dark ? "#ffffff" : "#000000");
      const line = read("var(--vis-axis__color)", text);
      return {
        forced,
        background,
        text,
        line: forced ? text : readableColour(mix(line, background, LINE_FADE), background, SHAPE_CONTRAST),
        // On the lines in the text's colour, the dots are in the background's (a light pulse
        // along a dark line, or a dark one along a light)
        dot: forced ? background : text
      };
    }
    // The points over the nodes and lines, and the names beside the nodes
    drawPoints(network) {
      this.nodesGroup.selectAll("circle.vis-network__node").data(this.chart.keyboardOrder(network), (node) => node.id).join("circle").attr("class", "vis-network__node").classed("vis-network__node--group", (node) => node.isGroup).classed("vis-network__node--expanded", (node) => node.expanded).attr("data-shape", (node) => this.chart.shapeOf(node)).order();
      this.handlesGroup.selectAll("circle.vis-network__handle").data(network.links.filter((link) => !link.isMembership), (link) => link.id).join("circle").attr("class", "vis-network__handle").classed("vis-network__handle--expandable", (link) => link.groups !== null || link.viaGroups !== null);
      this.labelsGroup.selectAll("text.vis-network__label").data(this.chart.labelledNodes(network), (node) => node.id).join("text").attr("class", "vis-network__label").classed("vis-network__label--group", (node) => node.isGroup).attr("dy", "0.35em").text((node) => String(node.name));
    }
    // Moves the flow on and the view toward its goal, draws the network as the view sees it, and
    // keeps the points over it; asks for another frame while anything is still moving
    animate() {
      if (this.frame === null) {
        this.frame = requestAnimationFrame((time) => this.onFrame(time));
      }
    }
    onFrame(time) {
      this.frame = null;
      if (!this.cell || this.view === null) {
        return;
      }
      const playing = this.chart.isPlaying();
      if (playing && this.lastFrameTime !== null) {
        this.flowTime += Math.min(0.1, (time - this.lastFrameTime) / 1e3);
        this.placeDots();
      }
      this.lastFrameTime = playing ? time : null;
      const moving = this.stepView();
      this.render();
      if (playing || moving) {
        this.animate();
      }
    }
    // Draws the network, and moves the points over it if the view has moved (not just for the flow,
    // which would move every point every frame for nothing)
    render() {
      if (this.available) {
        this.paint();
      }
      if (this.pointsStale || this.view !== this.placedView) {
        this.placePoints();
        this.placedView = this.view;
        this.pointsStale = false;
      }
    }
    // How far along its line a flowing dot is now, 0 to 1, from where it started (its `phase`)
    flowShare(phase) {
      return (phase + this.flowTime * this.chart.flowSpeed()) % 1;
    }
    // Keeps the points and names over the nodes and lines as the view sees them
    placePoints() {
      if (!this.size) {
        return;
      }
      this.nodesGroup.selectAll("circle.vis-network__node").each((node, index2, elements) => {
        const place = this.screenPlace(this.places.get(node.id));
        elements[index2].setAttribute("cx", place.x);
        elements[index2].setAttribute("cy", place.y);
        elements[index2].setAttribute("r", Math.max(MIN_POINT_RADIUS, this.screenRadius(node) + 2));
      });
      this.handlesGroup.selectAll("circle.vis-network__handle").each((link, index2, elements) => {
        const place = this.screenPlace(this.middleOf(link));
        elements[index2].setAttribute("cx", place.x);
        elements[index2].setAttribute("cy", place.y);
        elements[index2].setAttribute("r", HANDLE_REACH - 1);
      });
      this.labelsGroup.selectAll("text.vis-network__label").each((node, index2, elements) => {
        const place = this.screenPlace(this.places.get(node.id));
        elements[index2].setAttribute("x", place.x + this.screenRadius(node) + 4);
        elements[index2].setAttribute("y", place.y);
        elements[index2].style.display = place.behind ? "none" : null;
      });
    }
    setGoal(goal) {
      if (this.goal === null) {
        return;
      }
      this.goal = goal;
      this.animate();
    }
    // The view's keys, wherever the focus is among the points (which don't use them): Shift and the
    // arrow keys move it, + and − zoom and 0 goes back to the start
    onKey(event) {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || this.goal === null) {
        return;
      }
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
      if (event.shiftKey && Object.hasOwn(moves, event.key)) {
        this.keyMove(...moves[event.key]);
      } else if (event.key === "+" || event.key === "=") {
        this.zoom(ZOOM_STEP);
      } else if (event.key === "-" || event.key === "_" || event.key === "\u2212") {
        this.zoom(1 / ZOOM_STEP);
      } else if (event.key === "0") {
        this.resetView();
      } else {
        return;
      }
      event.preventDefault();
    }
    onPointerDown(event) {
      if (event.button !== 0 || this.goal === null) {
        return;
      }
      this.drag = {
        x: event.clientX,
        y: event.clientY,
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
        shift: event.shiftKey
      };
      this.dragged = false;
      try {
        this.svg.node().setPointerCapture(event.pointerId);
      } catch (error) {
      }
    }
    // Dragging moves the view; otherwise the node or line under the mouse shows its tooltip
    onPointerMove(event) {
      const drag = this.drag;
      if (drag === null) {
        this.hover(event);
        return;
      }
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) {
        return;
      }
      if (!drag.moved) {
        drag.moved = true;
        this.svg.classed("vis-network__overlay--dragging", true);
        if (this.points) {
          this.points.hide();
        }
      }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      drag.x = event.clientX;
      drag.y = event.clientY;
      this.dragBy(dx, dy, drag.shift);
    }
    onPointerUp(event) {
      if (this.drag === null) {
        return;
      }
      this.dragged = this.drag.moved;
      this.drag = null;
      this.svg.classed("vis-network__overlay--dragging", false);
      if (this.svg.node().hasPointerCapture(event.pointerId)) {
        this.svg.node().releasePointerCapture(event.pointerId);
      }
    }
    onPointerLeave() {
      if (this.drag === null && this.points && this.highlighted !== null && this.highlighted !== document.activeElement) {
        this.points.hide();
      }
    }
    onWheel(event) {
      if (this.goal === null) {
        return;
      }
      event.preventDefault();
      this.zoom(event.deltaY < 0 ? 1.1 : 1 / 1.1, this.pointerPlace(event));
    }
    // Where the mouse is in the visualisation, in pixels from its top left
    pointerPlace(event) {
      const bounds = this.svg.node().getBoundingClientRect();
      return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    }
    // A click: on a node or line, what a click on its point does (and not what a click on nothing
    // does, which stroom.points would otherwise take it for, as the points let clicks through); the
    // end of a drag, nothing
    onClick(event) {
      if (this.dragged) {
        this.dragged = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (event.target instanceof Element && event.target.closest(".vis-network__node, .vis-network__handle")) {
        return;
      }
      const hit = this.hitTest(event);
      if (hit === null) {
        return;
      }
      event.preventDefault();
      if (hit.node) {
        this.chart.activateNode(hit.node, event, this.cell);
      } else {
        this.activateLine(hit.link, event);
      }
    }
    // Shows the tooltip of the node or line under the mouse, if any
    hover(event) {
      if (!this.points) {
        return;
      }
      const hit = this.hitTest(event);
      const point = hit === null ? null : this.pointOf(hit);
      this.svg.classed("vis-network__overlay--over-point", point !== null);
      if (point !== null) {
        if (point !== this.highlighted) {
          this.points.show(point);
        }
      } else if (this.highlighted !== null && this.highlighted !== document.activeElement) {
        this.points.hide();
      }
    }
    // The point over a node or line ({node} or {link})
    pointOf(hit) {
      const selector = hit.node ? "circle.vis-network__node" : "circle.vis-network__handle";
      const wanted = hit.node || hit.link;
      return this.svg.selectAll(selector).nodes().find((element) => element.__data__ === wanted) || null;
    }
    // What is under the mouse: the node drawn there (the nearest, if one is in front of another), as
    // {node}; or else the middle of a line it is near, as {link}; or null
    hitTest(event) {
      if (!this.size || this.cell === void 0) {
        return null;
      }
      const { x: x3, y: y3 } = this.pointerPlace(event);
      const node = this.available ? this.nodeAt(x3, y3) : null;
      if (node !== null) {
        return { node };
      }
      let nearest = null;
      let nearestDistance = HANDLE_REACH;
      for (const link of this.cell.network.links) {
        if (link.isMembership) {
          continue;
        }
        const place = this.screenPlace(this.middleOf(link));
        const distance2 = Math.hypot(place.x - x3, place.y - y3);
        if (!place.behind && distance2 <= nearestDistance) {
          nearest = link;
          nearestDistance = distance2;
        }
      }
      return nearest === null ? null : { link: nearest };
    }
    // A click on a line or its point (or Enter on it): see NetworkChart.activateLine
    activateLine(link, event) {
      if (link.groups !== null || link.viaGroups !== null) {
        this.highlighted = null;
      }
      this.chart.activateLine(link, event);
    }
    // Moves the view to a node (or a line's middle) reached from the keyboard, if it is out of view,
    // so that it is in the middle
    bringIntoView(element) {
      const data = element.__data__;
      const place = isHandle(element) ? this.middleOf(data) : this.places.get(data.id);
      if (!place || !this.size || this.goal === null) {
        return;
      }
      const screen = this.screenPlace(place);
      if (screen.behind || screen.x < 0 || screen.x > this.size.width || screen.y < 0 || screen.y > this.size.height) {
        this.centreOn(place);
      }
    }
    // The search's matches: how many there are, and the first, to move the focus to
    matchCount() {
      return this.cell ? matchesOf(this.cell.network, this.chart.searchText).size : 0;
    }
    focusFirstMatch() {
      const matches = this.cell ? matchesOf(this.cell.network, this.chart.searchText) : /* @__PURE__ */ new Set();
      const first = this.nodesGroup.selectAll("circle.vis-network__node").nodes().find((element) => matches.has(element.__data__.id));
      if (first) {
        first.focus();
      }
    }
    // Gives the focus back to the network's tab stop (e.g. when the search field closes)
    focusTabStop() {
      const stop = this.svg.node().querySelector("[tabindex='0']");
      if (stop) {
        stop.focus();
      }
    }
    // Fades the nodes and lines not joined to the node (or line) shown, hovered or focused, or else
    // those the search doesn't match: only the nodes and lines fade, never the names. Rings the
    // search's matches and the selected nodes
    showHighlight() {
      if (!this.cell) {
        return;
      }
      const network = this.cell.network;
      const selection2 = this.chart.selection;
      const highlighted = this.highlighted !== null && document.contains(this.highlighted) ? this.highlighted : null;
      const matches = matchesOf(network, this.chart.searchText);
      const { keepNode, keepLine } = this.chart.kept(
        network,
        highlighted === null ? null : highlighted.__data__,
        highlighted !== null && isHandle(highlighted),
        matches
      );
      this.nodesGroup.selectAll("circle.vis-network__node").each((node, index2, elements) => {
        elements[index2].classList.toggle("vis-network__node--faded", !keepNode(node));
        elements[index2].classList.toggle("vis-network__node--match", matches.has(node.id));
        elements[index2].classList.toggle(
          "vis-network__node--selected",
          selection2.has(this.chart.selectionItem(node, this.cell).key)
        );
      });
      this.handlesGroup.selectAll("circle.vis-network__handle").each((link, index2, elements) => {
        elements[index2].classList.toggle("vis-network__handle--faded", !keepLine(link));
      });
      this.fade(keepNode, keepLine);
      this.animate();
    }
    destroy() {
      if (this.frame !== null) {
        cancelAnimationFrame(this.frame);
        this.frame = null;
      }
      if (this.points) {
        this.points.destroy();
      }
      this.disposeSurface();
      this.chart.cells.delete(this);
      this.element.remove();
    }
  };
  function isHandle(element) {
    return element.classList.contains("vis-network__handle");
  }

  // src/shared/fit.js
  function fitOf(bounds, width, height, minScale, maxScale = 1) {
    const contentWidth = Math.max(1, bounds.right - bounds.left);
    const contentHeight = Math.max(1, bounds.bottom - bounds.top);
    const k = Math.max(minScale, Math.min(maxScale, width / contentWidth, height / contentHeight));
    return {
      k,
      x: width / 2 - k * (bounds.left + bounds.right) / 2,
      y: height / 2 - k * (bounds.top + bounds.bottom) / 2
    };
  }

  // src/shared/forceLayout.js
  var DEFAULT_CHARGE = 240;
  var DEFAULT_LINK_DISTANCE = 80;
  var DEFAULT_DAMPING = 0.6;
  var DAMPINGS = { Low: 0.8, Medium: DEFAULT_DAMPING, High: 0.4 };
  var NODE_ROOM = 14;
  var GROUP_ROOM = 22;
  function dampingOf(choice) {
    return Object.hasOwn(DAMPINGS, choice) ? DAMPINGS[choice] : DEFAULT_DAMPING;
  }
  function layOut(network, previous = /* @__PURE__ */ new Map(), {
    charge = DEFAULT_CHARGE,
    linkDistance = DEFAULT_LINK_DISTANCE,
    damping = DEFAULT_DAMPING
  } = {}) {
    const nodes = network.nodes.map((node) => {
      const was = previous.get(node.id);
      return was ? { id: node.id, isGroup: node.isGroup, x: was.x, y: was.y } : { id: node.id, isGroup: node.isGroup };
    });
    const links = network.links.map((link) => ({ source: link.source, target: link.target, isMembership: link.isMembership }));
    const simulation = simulation_default(nodes).randomSource(seededRandom()).force("link", link_default(links).id((node) => node.id).distance((link) => link.isMembership ? linkDistance / 2 : linkDistance)).force("charge", manyBody_default().strength(-charge)).force("collide", collide_default((node) => node.isGroup ? GROUP_ROOM : NODE_ROOM)).velocityDecay(1 - damping).force("centre", center_default(0, 0)).stop();
    simulation.tick(300);
    return new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
  }

  // src/visualisations/Force2D/view.js
  var MIN_ZOOM_SHARE = 0.1;
  var MAX_ZOOM_SHARE = 10;
  function toScreen(view, place) {
    return { x: place.x * view.k + view.x, y: place.y * view.k + view.y };
  }
  function zoomedAbout(view, factor, at, fittedScale) {
    const k = Math.max(fittedScale * MIN_ZOOM_SHARE, Math.min(fittedScale * MAX_ZOOM_SHARE, view.k * factor));
    const ratio = k / view.k;
    return { k, x: at.x - (at.x - view.x) * ratio, y: at.y - (at.y - view.y) * ratio };
  }
  function moved(view, dx, dy) {
    return { k: view.k, x: view.x + dx, y: view.y + dy };
  }
  function centredOn(view, place, size) {
    return { k: view.k, x: size.width / 2 - place.x * view.k, y: size.height / 2 - place.y * view.k };
  }
  function towards(view, goal, share) {
    const between = (a2, b) => a2 + (b - a2) * share;
    return { k: between(view.k, goal.k), x: between(view.x, goal.x), y: between(view.y, goal.y) };
  }
  function isSameView(a2, b) {
    return Math.abs(a2.k - b.k) <= 1e-4 * b.k && Math.abs(a2.x - b.x) <= 0.1 && Math.abs(a2.y - b.y) <= 0.1;
  }

  // src/visualisations/Force2D/index.js
  var DEFAULT_MAX_NODES = 2e3;
  var SHAPES = {
    source: triangle_default,
    target: circle_default,
    both: diamond_default,
    none: square_default,
    globe: circle_default
  };
  var NODE_SIZE = 140;
  var GROUP_SIZE = 420;
  var NODE_RADIUS = 8;
  var GROUP_RADIUS = 14;
  var MIN_LINE_WIDTH = 1.5;
  var MAX_LINE_WIDTH = 8;
  var SAME_LINE_WIDTH = 2;
  var ARROW_LENGTH = 10;
  var ARROW_WIDTH = 4;
  var MARGIN = 24;
  var LABEL_ROOM = 60;
  var MIN_FIT_SCALE = 0.05;
  var MAX_FIT_SCALE = 1.5;
  var KEY_MOVE = 50;
  var EASE = 0.25;
  var Force2D = class extends CanvasNetworkChart {
    constructor() {
      super((body, chart) => new Force2DCell(body, chart), "2D network");
    }
    defaultMaxNodes() {
      return DEFAULT_MAX_NODES;
    }
    // The layout's settings
    layoutOptions() {
      const settings = this.settings;
      return {
        charge: settingNumber(settings.charge, DEFAULT_CHARGE, 10, 1e3),
        linkDistance: settingNumber(settings.linkDistance, DEFAULT_LINK_DISTANCE, 10, 400),
        damping: dampingOf(settings.damping)
      };
    }
  };
  function radiusOf(node) {
    return node.isGroup ? GROUP_RADIUS : NODE_RADIUS;
  }
  var Force2DCell = class extends CanvasNetworkCell {
    constructor(body, chart) {
      super(body, chart, {
        keysDescription: "Shift and the arrow keys move it, plus and minus zoom in and out, and 0 fits it to the visualisation",
        unavailableWords: "This browser can't draw the network (it has no canvas)"
      });
      this.fittedScale = 1;
    }
    // The canvas, if the browser can draw on one, and what it draws
    createSurface() {
      this.canvas = document.createElement("canvas");
      this.canvas.className = "vis-network__canvas";
      this.canvas.setAttribute("aria-hidden", "true");
      this.element.append(this.canvas);
      this.context = this.canvas.getContext("2d");
      this.ratio = Math.min(window.devicePixelRatio || 1, 2);
      this.drawnNodes = [];
      this.drawnLinks = [];
      this.drawnLinkById = /* @__PURE__ */ new Map();
      this.keepNode = () => true;
      this.keepLine = () => true;
      return this.context !== null;
    }
    layOut(network, options, previous) {
      return layOut(network, previous, options);
    }
    // Fitted to the network when it is laid out again, or first drawn
    fit(relaidOut) {
      const fitted = this.fittedView();
      this.fittedScale = fitted.k;
      if (this.view === null || relaidOut) {
        this.goal = fitted;
        this.view = this.view === null || prefersReducedMotion() ? this.goal : this.view;
      }
    }
    // The view that fits the network to the visualisation
    fittedView() {
      const places = this.cell.network.nodes.map((node) => this.places.get(node.id));
      if (places.length === 0) {
        return { k: 1, x: this.size.width / 2, y: this.size.height / 2 };
      }
      const bounds = {
        left: Math.min(...places.map((place) => place.x)) - MARGIN,
        right: Math.max(...places.map((place) => place.x)) + MARGIN + LABEL_ROOM,
        top: Math.min(...places.map((place) => place.y)) - MARGIN,
        bottom: Math.max(...places.map((place) => place.y)) + MARGIN
      };
      return fitOf(bounds, this.size.width, this.size.height, MIN_FIT_SCALE, MAX_FIT_SCALE);
    }
    resize(width, height) {
      this.canvas.width = Math.round(width * this.ratio);
      this.canvas.height = Math.round(height * this.ratio);
      this.canvas.style.width = width + "px";
      this.canvas.style.height = height + "px";
    }
    // Works out what is drawn of the network: each node in its shape and colour with an edge round it
    // (a group's in the text's colour), and each line with its arrowheads and flowing dots
    build(network) {
      const colours = this.colours;
      this.drawnNodes = network.nodes.map((node) => {
        const fill = this.cell.colourOfNode(node);
        let edge = colours.forced ? colours.text : edgeColour(fill, colours.background) || colours.background;
        let edgeWidth = 1.5;
        if (node.expanded) {
          edge = fill;
          edgeWidth = 3;
        } else if (node.isGroup) {
          edge = colours.text;
          edgeWidth = 2.5;
        }
        return { node, shape: this.chart.shapeOf(node), fill, edge, edgeWidth };
      });
      const most = Math.max(1, ...network.links.map((link) => link.forward + link.reverse));
      const flow = this.chart.showsFlow();
      const arrows = this.chart.showsArrows();
      this.drawnLinks = network.links.map((link) => {
        const a2 = this.places.get(link.source);
        const b = this.places.get(link.target);
        const length = Math.max(1e-6, Math.hypot(b.x - a2.x, b.y - a2.y));
        const direction = { x: (b.x - a2.x) / length, y: (b.y - a2.y) / length };
        const along = (place, distance2) => ({ x: place.x + direction.x * distance2, y: place.y + direction.y * distance2 });
        const start2 = along(a2, radiusOf(this.byId.get(link.source)) + 2);
        const end = along(b, -(radiusOf(this.byId.get(link.target)) + 2));
        const drawn = { link, start: start2, end, lineStart: start2, lineEnd: end, width: 1, arrows: [], dots: [] };
        if (link.isMembership) {
          return drawn;
        }
        const weight = this.chart.lineWeight(link, most);
        drawn.width = weight === null ? SAME_LINE_WIDTH : MIN_LINE_WIDTH + (MAX_LINE_WIDTH - MIN_LINE_WIDTH) * weight;
        if (arrows && link.forward > 0) {
          drawn.arrows.push({ tip: end, direction });
          drawn.lineEnd = along(end, -ARROW_LENGTH);
        }
        if (arrows && link.reverse > 0) {
          drawn.arrows.push({ tip: start2, direction: { x: -direction.x, y: -direction.y } });
          drawn.lineStart = along(start2, ARROW_LENGTH);
        }
        if (flow) {
          const ways = [[link.forward, start2, end], [link.reverse, end, start2]];
          for (const [count, from, to] of ways) {
            for (let index2 = 0; count > 0 && index2 < FLOW_DOTS; index2++) {
              drawn.dots.push({ from, to, phase: index2 / FLOW_DOTS });
            }
          }
        }
        return drawn;
      });
      this.drawnLinkById = new Map(this.drawnLinks.map((drawn) => [drawn.link.id, drawn]));
    }
    // The view moves part of the way to its goal each frame
    stepView() {
      if (isSameView(this.view, this.goal)) {
        this.view = this.goal;
        return false;
      }
      this.view = prefersReducedMotion() ? this.goal : towards(this.view, this.goal, EASE);
      return this.view !== this.goal;
    }
    // The dots are put in place as they are drawn
    placeDots() {
    }
    paint() {
      const context = this.context;
      const colours = this.colours;
      const { k, x: x3, y: y3 } = this.view;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      context.setTransform(this.ratio * k, 0, 0, this.ratio * k, this.ratio * x3, this.ratio * y3);
      context.lineCap = "round";
      for (const drawn of this.drawnLinks) {
        context.globalAlpha = this.keepLine(drawn.link) ? 1 : FADED_OPACITY;
        context.strokeStyle = colours.line;
        context.fillStyle = colours.line;
        context.lineWidth = drawn.width;
        context.setLineDash(drawn.link.isMembership ? [3, 3] : []);
        context.beginPath();
        context.moveTo(drawn.lineStart.x, drawn.lineStart.y);
        context.lineTo(drawn.lineEnd.x, drawn.lineEnd.y);
        context.stroke();
        for (const { tip, direction } of drawn.arrows) {
          const half = drawn.width / 2 + ARROW_WIDTH;
          const baseX = tip.x - direction.x * ARROW_LENGTH;
          const baseY = tip.y - direction.y * ARROW_LENGTH;
          context.beginPath();
          context.moveTo(tip.x, tip.y);
          context.lineTo(baseX - direction.y * half, baseY + direction.x * half);
          context.lineTo(baseX + direction.y * half, baseY - direction.x * half);
          context.closePath();
          context.fill();
        }
        context.fillStyle = colours.dot;
        for (const dot of drawn.dots) {
          const share = this.flowShare(dot.phase);
          context.beginPath();
          context.arc(
            dot.from.x + (dot.to.x - dot.from.x) * share,
            dot.from.y + (dot.to.y - dot.from.y) * share,
            2 + drawn.width * 0.35,
            0,
            2 * Math.PI
          );
          context.fill();
        }
      }
      context.setLineDash([]);
      const path2 = Symbol2().context(context);
      const flat = this.chart.isFlat();
      for (const { node, shape, fill, edge, edgeWidth } of this.drawnNodes) {
        const place = this.places.get(node.id);
        context.globalAlpha = this.keepNode(node) ? 1 : FADED_OPACITY;
        context.save();
        context.translate(place.x, place.y);
        context.beginPath();
        path2.type(SHAPES[shape]).size(node.isGroup ? GROUP_SIZE : NODE_SIZE)();
        if (node.expanded) {
          context.fillStyle = colours.background;
        } else if (flat) {
          context.fillStyle = fill;
        } else {
          const radius = radiusOf(node);
          const gradient = context.createRadialGradient(
            -radius * 0.35,
            -radius * 0.35,
            radius * 0.1,
            0,
            0,
            radius * 1.2
          );
          gradient.addColorStop(0, mix(fill, "#ffffff", 0.45));
          gradient.addColorStop(0.55, fill);
          gradient.addColorStop(1, mix(fill, "#000000", 0.3));
          context.fillStyle = gradient;
        }
        context.fill();
        context.strokeStyle = edge;
        context.lineWidth = edgeWidth;
        context.stroke();
        context.restore();
      }
      context.globalAlpha = 1;
    }
    screenPlace(place) {
      return { ...toScreen(this.view, place), behind: false };
    }
    screenRadius(node) {
      return radiusOf(node) * this.view.k;
    }
    // The middle of a line, between the edges of its nodes
    middleOf(link) {
      const drawn = this.drawnLinkById.get(link.id);
      return drawn ? { x: (drawn.start.x + drawn.end.x) / 2, y: (drawn.start.y + drawn.end.y) / 2 } : { x: 0, y: 0 };
    }
    // The node drawn at a point of the screen: the last drawn (on top) of those there
    nodeAt(x3, y3) {
      for (let index2 = this.drawnNodes.length - 1; index2 >= 0; index2--) {
        const node = this.drawnNodes[index2].node;
        const place = this.screenPlace(this.places.get(node.id));
        if (Math.hypot(place.x - x3, place.y - y3) <= this.screenRadius(node) + 2) {
          return node;
        }
      }
      return null;
    }
    // Zooms in or out about a point of the screen (the middle if not given), or back to the start
    zoom(factor, at) {
      const about = at || { x: this.size.width / 2, y: this.size.height / 2 };
      this.setGoal(zoomedAbout(this.goal, factor, about, this.fittedScale));
    }
    resetView() {
      if (this.cell) {
        this.setGoal(this.fittedView());
      }
    }
    // Shift and the arrow keys move the view (to see more of the network that way)
    keyMove(dx, dy) {
      this.setGoal(moved(this.goal, -dx * KEY_MOVE, dy * KEY_MOVE));
    }
    // Dragging moves the network with the mouse, straight there, rather than smoothly, so that it
    // keeps up
    dragBy(dx, dy) {
      this.goal = moved(this.goal, dx, dy);
      this.view = this.goal;
      this.animate();
    }
    centreOn(place) {
      this.setGoal(centredOn(this.goal, place, this.size));
    }
    fade(keepNode, keepLine) {
      this.keepNode = keepNode;
      this.keepLine = keepLine;
    }
    disposeSurface() {
      this.drawnNodes = [];
      this.drawnLinks = [];
    }
  };
  window.visualisations = window.visualisations || {};
  window.visualisations.Force2D = Force2D;
})();
