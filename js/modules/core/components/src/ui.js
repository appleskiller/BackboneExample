define(function (require, exports, module) {
	var $ = require("jquery");
	var Backbone = require("backbone");

	var Mustache = require("../lib/mustache.min");

	var display = require("display");
	var datatype = require("datatype");

	var Display = display.Display;
	var DataItem = datatype.DataItem;
	var ArrayList = datatype.ArrayList;
	var HierarchyData = datatype.HierarchyData;

	var UI = Display.extend({
		uievents: null ,
		skins: null , 
		initialize: function () {
			Display.prototype.initialize.apply(this, arguments);
			if (this.uievents) {
				var handle, self = this;
				for (var eventType in this.uievents){
					handle = this.uievents[eventType];
					this.on(eventType , (function (handle) {
						if (typeof handle === "function"){
							return function () {
								handle.apply(self , arguments);
							};
						} else if (typeof handle === "string"){
							return function () {
								if (typeof self[handle] === "function")
									self[handle].apply(self , arguments);
							};
						}else{
							return function(){};
						}
					})(handle));
				}
			}
		} ,
		renderTemplate: function () {
			var self = this;
			if (typeof this.template === "string")
				this.$el.html(Mustache.render(this.template , this.serialize()));
			else if (_.isElement(this.template) && this.template.localName === "template"){
				var attrs = this.template.attributes;
				for (var i = 0; i < attrs.length; i++){
					if (attrs[i].name != "id")
						this.$el.attr(attrs[i].name , attrs[i].value);
				}
				this.$el.html(Mustache.render(this.template.innerHTML , this.serialize()));
			}else
				Display.prototype.renderTemplate.apply(this , arguments);
		} ,
		render: function () {
			if (this.skins){
				var skin;
				for (var selector in this.skins){
					skin = this.skins[selector];
					if (typeof skin === "string"){
						if (typeof this[skin] === "function")
							this.$(selector).append(this[skin].apply(this , selector));
						else
							this.$(selector).innerHTML = skin;
					}else if (_.isElement(skin)){
						this.$(selector).append(skin);
					}else if (typeof skin === "function"){
						this.$(selector).append(this[skin].apply(this , selector));
					}
				}
			}
			Display.prototype.render.apply(this , arguments);
		} ,
		getContainer: function () {
			return this.$el;
		}
	});

	var DomHelper = function (option) {
		option = option || {};
		this.$el = option.dom ? $(option.dom) : $("<div/>");
		this.events = option.events || {};
		this._delegateEvents(this.events);
		this.data = option.data;
	};
	DomHelper.prototype = {
		$el: null ,
		events: null ,
		$: function (dom) {
			return !this.$el ? null : this.$el.find(dom);
		} ,
		setElement: function (dom) {
			if (dom){
				this.$el = $(dom);
				this._delegateEvents(this.events);
			}
		} ,
		delegate: function (selector , eventType , handle) {
			if (arguments.length < 2)
				return;
			else if (arguments.length == 2){
				handle = eventType;
				eventType = selector;
				selector = this.$el;
			}
			selector = selector || this.$el;
			var self = this;
			this.$el.delegate(selector , eventType , function () {
				handle.apply(self , arguments);
			});
		} ,
		_delegateEvents: function (events) {
			if (events){
				var arr , eventType , selector;
				for (var type in events){
					arr = $.trim(type).split(" ");
					if (arr.length < 1)
						continue;
					else if (arr.length == 1){
						eventType = $.trim(arr[0]);
						selector = this.$el;
					}else{
						eventType = $.trim(arr.shift());
						selector = arr.join(" ");
					}
					this.delegate(selector , eventType , events[type]);
				}
			}
		}
	};

	var TemplateRenderer = function (option) {
		this.prefix = option.prefix || "";
		this.template = option.template || "";
		this.engine = option.engine || Mustache;
	};

	TemplateRenderer.prototype = {
		template: null , 
		engine: null ,
		render: function (data) {
			var url = this.prefix + "/" + this.template;
			data = data || {};
			var defer = $.Deferred();
			$.get(url , function (result) {
				defer.resolve(Mustache.render(result , data));
			} , "text");
			return defer.promise();
		}
	};

	var ItemRenderer = UI.extend({
		data: null ,
		itemIndex: -1 , 
		selected: false ,
		commitProps: function () {
			if (this.hasChanged("data"))
				this.invalidateRender();
			if (this.hasChanged("selected"))
				this.invalidateDisplay();
		} ,
		updateDisplay: function () {
			if (this.hasChanged("selected"))
				this._selectionChanged();
		} , 
		_selectionChanged: function () {
			if (this.selected)
				this.$el.attr("selected" , "selected");
			else
				this.$el.removeAttr("selected");
		}
	});
	var List = UI.extend({
		dataProvider: null ,
		itemRenderer: null ,
		_indexToRenderers: null , 
		selected: -1 , 
		selectedItem: null , 
		attributes: {
			style: "position: absolute; width: 100%; overflow: auto; height: 100%;"
		} ,
		initialize: function () {
			UI.prototype.initialize.apply(this , arguments);
			this._indexToRenderers = [];
		} ,
		set$dataProvider: function (value) {
			if (this.dataProvider)
				this.stopListening(this.dataProvider);
			if (!value)
				this.dataProvider = new ArrayList([]);
			else if (value instanceof ArrayList)
				this.dataProvider = value;
			else if (_.isArray(value))
				this.dataProvider = new ArrayList(value);
			else
				this.dataProvider = new ArrayList([value]);
			this.invalidateDisplay();
		} ,
		set$itemRenderer: function (value) {
			this.itemRenderer = value || ItemRenderer;
			this.invalidateDisplay();
		} ,
		set$selectedItem: function (value) {
			var oldIndex = -1 , index = -1 , oldSelected;
			if (this.selectedItem){
				oldIndex = this.dataProvider.index(this.selectedItem);
				oldSelected = this.selectedItem;
			}
			index = this.dataProvider.index(value);
			this.selectedItem = value;

			if (index != oldIndex){
				if (this._indexToRenderers[oldIndex])
					this._indexToRenderers[oldIndex].set("selected" , false);
				if (this._indexToRenderers[index])
					this._indexToRenderers[index].set("selected" , true);
				this.trigger("selection_changed" , {target: this , oldSelected: oldSelected , newSelected: value});
			}
		} ,
		get$selectedIndex: function () {
			return this.dataProvider ? this.dataProvider.index(this.selectedItem) : -1;
		} , 
		set$selectedIndex: function (value) {
			if (!this.dataProvider || value < 0 || value >= this.dataProvider.length)
				this.set("selectedItem" , null);
			else
				this.set("selectedItem" , this.dataProvider.at(value));
		} , 
		updateDisplay: function () {
			if (this.hasChanged("dataProvider" , "itemRenderer")){
				this._removeAllRenderers();
				if (this.dataProvider && this.itemRenderer){
					if (this.dataProvider)
						this.listenTo(this.dataProvider , "list_changed" , this._listChangedHandle);
					this._createAllViews();
				}
			}
		} , 
		getItemIndex: function (data) {
			if (data && this.dataProvider)
				return this.dataProvider.index(data);
			return -1;
		} , 
		_removeAllRenderers: function () {
			var renderer , container = this.getContainer();
			for (var i = this._indexToRenderers.length - 1; i >= 0 ; i--){
				this._rendererRemoved(renderer , i);
				renderer = this.removeView(container , i);
			}
		} , 
		_createAllViews: function () {
			var container = this.getContainer();
			var item , renderer;
			for (var i = 0; i < this.dataProvider.length; i++){
				item = this.dataProvider.at(i);
				renderer = this._getItemRenderer(item , i);
				this.addView(container , renderer);
				this._rendererAdded(renderer , i);
			}
		} ,
		_rendererAdded: function (renderer , index) {
			this._indexToRenderers.splice(index , 0 , renderer);
			var self = this;
			renderer.$el.click(function (e) {
				if (e.isDefaultPrevented())
					return;
				var oldIndex = -1 , oldSelected;
				if (self.selectedItem){
					oldIndex = self.dataProvider.index(self.selectedItem);
					oldSelected = self.selectedItem;
				}
				self.selectedItem = renderer.data;
				if (index != oldIndex){
					if (self._indexToRenderers[oldIndex])
						self._indexToRenderers[oldIndex].set("selected" , false);
					renderer.set("selected" , true);
					self.trigger("selection_changed" , {target: self , oldSelected: oldSelected , newSelected: renderer.data});
				}
				self.trigger("item_click" , {target: self , renderer: renderer , data: renderer.data , itemIndex: index});
			}).dblclick(function (e) {
				if (e.isDefaultPrevented())
					return;
				self.trigger("item_dblclick" , {target: self , renderer:renderer , data: renderer.data , itemIndex: self.getItemIndex(renderer.data)});
			});
		} , 
		_rendererRemoved: function (renderer , index) {
			this._indexToRenderers.splice(index , 1);
			renderer.$el.off("click").off("dblclick");
		} , 
		_getItemRenderer: function (data , itemIndex) {
			if (this.itemRenderer)
				return new this.itemRenderer({data:data , selected: this.selectedItem === data});
			return null;
		} ,
		_listChangedHandle: function (e) {
			var kind = e.kind;
			var oldIndex = e.oldIndex;
			var newIndex = e.newIndex;
			var item = e.item;
			var renderer;
			if (kind === "add"){
				renderer = this._getItemRenderer(item , newIndex);
				if (renderer){
					this.addView(this.getContainer() , renderer , newIndex);
					this._rendererAdded(renderer , newIndex);
				}
			}else if (kind === "remove"){
				renderer = this._indexToRenderers[oldIndex];
				if (item === this.selectedItem){
					renderer.set("selected" , false);
					var index = oldIndex == this.dataProvider.length ? oldIndex - 1 : oldIndex;
					this.selectedItem = index < 0 ? null : this.dataProvider.at(index);
					if (this._indexToRenderers[index])
						this._indexToRenderers[index].set("selected" , true);
					this.trigger("selection_changed" , {target: this , oldSelected: item , newSelected: this.selectedItem});
				}
				this._rendererRemoved(renderer , oldIndex);
				this.removeView(this.getContainer() , oldIndex);
			}else if (kind === "update"){
				renderer = this.getViews(this.getContainer())[oldIndex];
				renderer.set("data" , item.target);
			}else if (kind === "refresh"){
				this.setChanged("dataProvider");
				this.invalidateDisplay();
			}
		}
	});

	TreeItemRenderer = ItemRenderer.extend({
		depth: 0 ,
		indent: 0
	});
	var Tree = List.extend({
		descriptor: null ,
		indent: 10 , 
		hierarchyData: null ,
		set$dataProvider: function (value) {
			if (this.dataProvider)
				this.stopListening(this.dataProvider);
			if (!value)
				this.hierarchyData = new HierarchyData([] , this.descriptor);
			else if (value instanceof HierarchyData)
				this.hierarchyData = value;
			else if (value instanceof ArrayList)
				this.hierarchyData = new HierarchyData(value.source , this.descriptor);
			else if (_.isArray(value))
				this.hierarchyData = new HierarchyData(value , this.descriptor);
			else if (typeof value === "object")
				this.hierarchyData = new HierarchyData(value , this.descriptor);
			else
				this.hierarchyData = new HierarchyData([value] , this.descriptor);
			this.hierarchyData.setDescriptor(this.descriptor);
			List.prototype["set$dataProvider"].call(this , this.hierarchyData.collection)
		} , 
		set$itemRenderer: function (value) {
			var renderer = value || TreeItemRenderer;
			List.prototype["set$itemRenderer"].call(this , renderer);
		} ,
		set$descriptor: function (value) {
			this.descriptor = value
			if (this.hierarchyData){
				this.set("dataProvider" , this.hierarchyData);
			}
		} ,
		_getItemRenderer: function (data , itemIndex) {
			if (this.itemRenderer){
				var depth = this.hierarchyData.getParentStack(data).length - 1;
				return new this.itemRenderer({data:data , depth: depth , indent: this.indent});
			}else
				return null;
		} ,
		isOpenItem: function (item) {
			if (!item)
				return false;
			return this.hierarchyData.isOpen(item);
		} ,
		expand: function (item , open) {
			if (open)
				this.hierarchyData.open(item);
			else
				this.hierarchyData.close(item);
		}
	})
	
	module.exports = {
		UI: UI ,
		ItemRenderer: ItemRenderer ,
		List: List ,
		Tree: Tree ,
		TreeItemRenderer: TreeItemRenderer ,
		DomHelper: DomHelper ,
		TemplateRenderer: TemplateRenderer
	}
})