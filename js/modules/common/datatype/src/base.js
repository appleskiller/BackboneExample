define(function(require , exports , module){
	var $ = require("jquery");
	var _ = require("underscore");
	var Backbone = require("backbone");
	
	//----------------------------------------------------
	// 数据对象
	//====================================================
	var DataItem = function (source) {
		if (source && typeof source !== "object")
			throw new Error("DataItem.source - 要求为object类型");
		this.source = source || {};
		this._penddingChanged = {add: {} , remove: {} , update: {}};
		var def = this.getDefault();
		if (def)
			this.source = $.extend(true , def , this.source);
		if (this.initialize)
			this.initialize();
	};
	_.extend(DataItem.prototype , Backbone.Events , {
		getDefault: function () {
			return null;
		} ,
		unwarp: function () {
			var result = {};
			for (var prop in this.source){
				if (this.source[prop] instanceof ArrayList || this.source[prop] instanceof DataItem)
					result[prop] = this.source[prop].unwarp();
				else
					result[prop] = this.source[prop];
			}
			return result;
		} ,
		get: function (prop) {
			return this.source[prop];
		} ,
		set: function () {
			if (!arguments[0])
				return this;
			var attr , prop , oldValue , newValue;
			if (arguments.length === 2 && typeof arguments[0] === "string"){
				attr = {};
				attr[arguments[0]] = arguments[1];
			}else if (arguments.length === 1 && typeof arguments[0] === "object"){
				attr = arguments[0];
			};
			if (attr){
				for (var prop in attr){
					newValue = attr[prop];
					if (prop in this.source){
						oldValue = this.source[prop];
						this.source[prop] = attr[prop];
						this._penddingUpdate(prop , oldValue , newValue); //update
					}else{
						this.source[prop] = attr[prop];
						this._penddingAdd(prop , newValue); //add
					}
				}
				this._invalidateCommit();
			}
			return this;
		} ,
		del: function (prop) {
			var oldValue
			if (prop in this.source){
				oldValue = this.source[prop];
				delete this.source[prop];
				this._penddingRemove(prop , oldValue);
			}
			return this;
		} ,
		_penddingReset: function () {
			this._penddingChanged = {add: {} , remove: {} , update: {}};
		} ,
		_penddingAdd: function (prop , newValue) {
			if (this._sourceReseted)
				return;
			var pendding = this._penddingChanged , oldValue;
			var add = pendding.add , remove = pendding.remove , update = pendding.update;
			if (add[prop]){
				add[prop].newValue = newValue;
			}else if (update[prop]){
				update[prop].newValue = newValue;
			}else if (remove[prop]){
				oldValue = remove[prop].oldValue;
				update[prop] = {oldValue: oldValue , newValue: newValue};
			}else
				add[prop] = {newValue: newValue};
		} ,
		_penddingRemove: function (prop , oldValue) {
			if (this._sourceReseted)
				return;
			var pendding = this._penddingChanged;
			var add = pendding.add , remove = pendding.remove , update = pendding.update;
			if (add[prop]){
				delete add[prop];
			}else if (update[prop]){
				oldValue = update[prop].oldValue;
				delete update[prop];
				remove[prop] = {oldValue: oldValue};
			}else if (remove[prop]){
			}else
				remove[prop] = {oldValue: oldValue};
		} ,
		_penddingUpdate: function (prop , oldValue , newValue) {
			if (this._sourceReseted)
				return;
			var pendding = this._penddingChanged;
			var add = pendding.add , remove = pendding.remove , update = pendding.update;
			if (update[prop]){
				update[prop].newValue = newValue;
			}else if (add[prop]){
				oldValue = add[prop].oldValue;
				delete add[prop];
				update[prop] = {oldValue: oldValue , newValue: newValue};
			}else if (remove[prop]){
			}else
				update[prop] = {oldValue: oldValue , newValue: newValue};
		} ,
		_invalidateCommit: function () {
			// add , remove , update
			if (!this._commitFlag){
				var self = this;
				this._commitFlag = true;
				setTimeout(function () {
					self._commitChanged();
					self._commitFlag = false;
				} , 0)
			}
		} ,
		_commitChanged: function () {
			if (this._sourceReseted){
				this.trigger("property_changed" , {target: this , "reset": null});
				this._sourceReseted = false;
			}else{
				var param , dic;
				var pendding = this._penddingChanged.add;
				var add , remove , update;
				for (var prop in pendding){
					add = pendding;
					break;
				};
				pendding = this._penddingChanged.remove;
				for (var prop in pendding){
					remove = pendding;
					break;
				};
				pendding = this._penddingChanged.update;
				for (var prop in pendding){
					update = pendding;
					break;
				};
				this.trigger("property_changed" , {target: this , "add": add , "remove": remove , "update": update});
			}
		}
	});
	//----------------------------------------------------
	// 数据集合
	//====================================================
	var ArrayList = function (source) {
		if (source && !_.isArray(source))
			throw new Error("DataItem.source - 要求为array类型");
		this.source = source || [];
		this.length = this.source.length;
		this._sortFunction = null;
		for (var i = 0; i < this.source.length; i++){
			if (this.source[i] && this.source[i] instanceof DataItem){
				this.listenTo(this.source[i] , "property_changed" , this._itemUpdate);
			}
		}
	};
	_.extend(ArrayList.prototype , Backbone.Events , {
		length: 0 ,
		source: null ,
		unwarp: function () {
			var result = [];
			for (var i = 0; i < this.source.length; i++){
				if (this.source[i] instanceof ArrayList || this.source[i] instanceof DataItem)
					result.push(this.source[i].unwarp);
				else
					result.push(this.source[i]);
			}
			return result;
		} ,
		add: function (value) {
			var index = this._getSortedIndex(value , this.source.length)
			this.source.splice(index , 0 , value);
			this._itemAdded(index , value);
			return value ;
		} ,
		addAt: function (value , index) {
			if (index < 0 || index > this.source.length)
				return null;
			index = this._getSortedIndex(value , index);
			this.source.splice(index , 0 , value);
			this._itemAdded(index , value);
			return value;
		} ,
		remove: function (value) {
			var index = this.source.indexOf(value);
			if (index == -1)
				return null;
			this.source.splice(index , 1);
			this._itemRemoved(index , value);
			return value;
		} , 
		removeAt: function (index) {
			if (index < 0 || index >= this.source.length)
				return null;
			var item = this.source.splice(index , 1)[0];
			this._itemRemoved(index , item);
			return item;
		} ,
		at: function (index) {
			return this.source[index];
		} ,
		index: function (item) {
			return this.source.indexOf(item);
		} ,
		setSortFunction: function (sortBy) {
			this._sortFunction = sortBy;
			this.source.sort(this._sortFunction);
			this._commitChanged("refresh");
		} , 
		itemUpdated: function (item , prop , oldValue , newValue) {
			var index = this.source.indexOf(item);
			if (index != -1){
				var ind = this._getSortedIndex(item , index);
				if (ind != index){
					this.addAt(this.removeAt(item , index));
					index = ind;
				}
				var update = {};
				if (prop)
					update[prop] = {oldValue: oldValue , newValue: newValue}
				this._commitChanged("update" , index , index , {target: item , update: update});
			}
		} ,
		_getSortedIndex: function (item , index) {
			if (this._sortFunction){
				for (var i = 0; i < this.source.length; i++){
					if (this._sortFunction(item , this.source[i]) < 0){
						index = i;
						break;
					}
					if (i == this.source.length - 1)
						index = this.source.length;
				}
			}
			return index;
		} ,
		_itemAdded: function (index , value) {
			if (value && value instanceof DataItem){
				this.listenTo(value , "property_changed" , this._itemUpdate);
			}
			this.length = this.source.length;
			this._commitChanged("add" , -1 , index , value)
		} ,
		_itemRemoved: function (index , value) {
			if (value && value instanceof DataItem){
				this.stopListening(value , "property_changed" , this._itemUpdate);
			}
			this.length = this.source.length;
			this._commitChanged("remove" , index , -1 , value)
		} ,
		_itemUpdate: function (e) {
			var index = this.source.indexOf(e.target);
			this._commitChanged("update" , index , index , e);
		} ,
		_commitChanged: function (kind , oldIndex , newIndex , item) {
			this.trigger("list_changed" , {target: this , kind: kind , oldIndex: oldIndex , newIndex: newIndex , item: item})
		}
	});

	var HierarchyData = function () {
		this.initialize.apply(this , arguments);
	};
	_.extend(HierarchyData.prototype , Backbone.Events , {
		initialize: function (source , descriptor) {
			this.source = source || [];
			this.descriptor = descriptor || TreeDataDescriptor;
			this.stopListening();
			this.parentMap = new Dictionary();
			this.childrenMap = new Dictionary();
			this.openItems = new Dictionary();
			var rootModel = this._getChildren(this.source);
			this.collection = new ArrayList();
			this._sortFunction = null;
			for (var i = 0; i < rootModel.length; i++){
				this.collection.add(rootModel.at(i))
			}
			this.openItems.put(this.source , true);
		} ,
		setDescriptor: function (value) {
			this.initialize(this.source , value);
		} ,
		setSortFunction: function (sortBy) {
			this._sortFunction = sortBy;
			this.childrenMap.each(function (key , value) {
				value.setSortFunction(sortBy);
			});
		} , 
		addItem: function (parent , item) {
			this.parentMap.put(item , parent);
			var collection = this._getChildren(parent);
			collection.add(item);
		} ,
		addItemAt: function (parent , item , index) {
			if (index > collection.length || index < 0)
				return;
			this.parentMap.put(item , parent);
			var collection = this._getChildren(parent);
			collection.addAt(item , index);
		} ,
		removeItem: function (parent , item) {
			this.parentMap.del(item);
			var collection = this._getChildren(parent);
			collection.remove(item);
		} ,
		removeItemAt: function (parent , index) {
			var collection = this._getChildren(parent);
			var item = collection.removeAt(index);
			this.parentMap.del(item);
			return item;
		} ,
		getItemAt: function (parent , index) {
			var collection = this._getChildren(parent)
			return collection.at(index);
		} ,
		getItemIndex: function (parent , item) {
			var collection = this._getChildren(parent)
			return collection.index(item);
		} ,
		getItemParent: function (item) {
			return this.parentMap.get(item);
		} ,
		getParentStack: function (item) {
			var stack = [];
			var parent = this.getItemParent(item);
			while(parent){
				stack.unshift(parent);
				parent = this.getItemParent(parent);
			}
			return stack;
		} ,
		open: function (item) {
			if (this.isOpen(item))
				return this;
			this.openItems.put(item , true);
			var index = (item === this.source) ? 0 : this.collection.index(item);
			if (index != -1 && this._hasChildren(item)){
				var collection = this._getChildren(item);
				index = (item === this.source) ? -1 : index;
				for (var i = 0; i < collection.length; i++){
					index = this._addToCollection(collection.at(i) , index+1);
				}
			}
			return this;
		} ,
		close: function (item) {
			var index = item === this.source ? 0 : this.collection.index(item);
			if (index != -1 && this.isOpen(item) && this._hasChildren(item)){
				item === this.source ? index = 0 : index += 1;
				var collection = this._getChildren(item);
				for (var i = 0; i < collection.length; i++){
					index = this._removeFromCollection(index);
				}
			}
			this.openItems.del(item);
			return this;
		} ,
		isOpen: function (item) {
			return this.openItems.has(item);
		} ,
		_getChildren: function (item) {
			if (this.childrenMap.has(item))
				return this.childrenMap.get(item);
			var self = this;
			var list = this.descriptor.getChildren(item);

			if (this._sortFunction)
				list.setSortFunction(this._sortFunction);

			for (var i = 0; i < list.length; i++){
				//缓存parentmap
				this.parentMap.put(list.at(i) , item);
			}
			//缓存childrenMap
			this.childrenMap.put(item , list);
			//监听
			this.listenTo(list , "list_changed" , function (e) {
				self._collectionChanged.call(self , e);
			})
			return list;
		} ,
		_hasChildren: function (item) {
			return this.descriptor.hasChildren(item);
		} ,
		_calcVisibleChildCount: function (item) {
			if (!this.isOpen(item) || !this._hasChildren(item))
				return 0;
			var collection = this._getChildren(item);
			var len = collection.length;
			for (var i = 0; i < collection.length; i++){
				len += this._calcVisibleChildCount(collection.at(i));
			}
			return len;
		} ,
		_addToCollection: function (item , index) {
			this.collection.addAt(item , index);
			if (this.isOpen(item) && this._hasChildren(item)){
				var collection = this._getChildren(item);
				for (var i = 0; i < collection.length; i++){
					index = this._addToCollection(collection.at(i) , index+1);
				}
			}
			return index;
		} ,
		_removeFromCollection: function (index) {
			var item = this.collection.removeAt(index);
			if (this.isOpen(item) && this._hasChildren(item)){
				var collection = this._getChildren(item);
				for (var i = 0; i < collection.length; i++){
					index = this._removeFromCollection(index);
				}
			}
			return index;
		} ,
		_collectionChanged: function (e) {
			var kind = e.kind;
			var oldIndex = e.oldIndex;
			var newIndex = e.newIndex;
			var item = e.item;
			var parent , indexInList , beforeItem;
			if (kind === "add"){
				parent = this.getItemParent(item);
				if (parent && this.isOpen(parent)){
					if (newIndex == 0)
						indexInList = parent === this.source ? 0 : this.collection.index(parent) + 1;
					else if (newIndex > 0){
						beforeItem = this._getChildren(parent).at(newIndex - 1);
						indexInList = this.collection.index(beforeItem) + this._calcVisibleChildCount(beforeItem) + 1;
					};
					this._addToCollection(item , indexInList);
				}
			}else if (kind === "remove"){
				indexInList = this.collection.index(item);
				if (indexInList != -1)
					this._removeFromCollection(indexInList);
			}else if (kind === "update"){
				// TODO
			}else if (kind === "refresh"){
				this._resetChildCollection(e.target);
			}else if (kind === "reset"){
				this._resetChildCollection(e.target);
			};
		} ,
		_resetChildCollection: function (collection) {
			for (var i = 0; i < collection.length; i++){
				parent = this.getItemParent(collection.at(i));
				break;
			}
			if (parent && this.isOpen(parent))
				this.close(parent).open(parent);
		}
	});

	var TreeDataDescriptor = {
		hasChildren: function (item) {
			if (_.isArray(item))
				return true;
			return "children" in item;
		} ,
		getChildren: function (item) {
			if (_.isArray(item))
				return new ArrayList(item);
			return new ArrayList(item.children);
		}
	}

	var Dictionary = function () {
		this._keys = [];
		this._values = [];
	};
	Dictionary.prototype = {
		length: 0 , 
		_keys: null , 
		_values: null , 
		put: function (key , value) {
			if (this._keys.indexOf(key) == -1){
				this._keys.push(key);
				this._values.push(value);
				this.length++;
			};
		} , 
		del: function (key) {
			var ind = this._keys.indexOf(key);
			if (ind != -1){
				this._keys.splice(ind , 1);
				this._values.splice(ind , 1);
				this.length--;
			};
		} , 
		get: function (key) {
			var ind = this._keys.indexOf(key);
			if (ind != -1)
				return this._values[ind];
			return null;
		} , 
		has: function (key) {
			return this._keys.indexOf(key) != -1;
		} ,
		each: function (fn , thisObject) {
			if (!fn || typeof fn !== "function")
				return;
			for (var i = 0; i < this.length; i++){
				if (thisObject)
					fn.apply(thisObject , this._keys[i] , this._values[i] , i);
				else
					fn(this._keys[i] , this._values[i] , i);
			};
		} , 
		clear: function () {
			this._keys = [];
			this._values = [];
			this.length = 0;
		}
	};
	DataItem.extend = ArrayList.extend = HierarchyData.extend = Backbone.Model.extend;

	module.exports = {
		DataItem: DataItem ,
		ArrayList: ArrayList ,
		HierarchyData: HierarchyData ,
		Dictionary: Dictionary ,
		TreeDataDescriptor: TreeDataDescriptor
	}
})