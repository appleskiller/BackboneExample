define(function (require, exports, module) {
	var $ = require("jquery");
	var _ = require("underscore");
	var Backbone = require("backbone");

	var datatype = require("datatype");

	//----------------------------------------------------
	//扩展Backbone.View
	//====================================================
	var Display = Backbone.View.extend({
		constructor: function Display(options) {
			options = options || {};
			this.__changed = {};
			this._views = new datatype.Dictionary();
			this.parent = null;
			this.parentSelector = null;
			this.viewIndex = null;
			this.set(options);
			Backbone.View.call(this , options);
			this.invalidateProps();
			this.invalidateRender();
			this.invalidateDisplay();
		} ,
		invalidateProps: function () {
			if (!this.__propChangeFlag){
				this.__propChangeFlag = true;
				this._invalidateUpdate();
			}
			return this;
		} ,
		invalidateDisplay: function () {
			if (!this.__updateDisplayFlag){
				this.__updateDisplayFlag = true;
				this._invalidateUpdate();
			}
			return this;
		} ,
		invalidateRender: function () {
			if (!this.__reRenderFlag){
				this.__reRenderFlag = true;
				this._invalidateUpdate();
			}
		} ,
		_invalidateUpdate: function (argument) {
			if (!this.__updateFlag){
				this.__updateFlag = true;
				var self = this;
				setTimeout(function () {
					self._updateNow();
					self.__updateFlag = false;
				} , 0);
			}
		} , 
		serialize: function () {
			return {};
		} ,
		commitProps: function () {
			return this;
		} ,
		beforeRender: function () {
			// body...
		} ,
		renderTemplate: function () {
			// if (this.template === null || this.template === undefined)
			// 	this.$el.html('');
			// else 
			if (typeof this.template === "function")
				this.$el.html(this.template(this.serialize()));
			return this;
		} ,
		render: function () {
			var self = this;
			this._views.each(function (selector , views) {
				var dom = selector == "__el__" ? self.$el : 
						typeof selector === "string" ? self.$(selector) : 
						$(selector);
				for (var i = 0; i < views.length; i++){
					dom.append(views[i].$el);
				}
			});
			return this;
		} ,
		afterRender: function () {
			// body...
		} ,
		updateDisplay: function () {
			return this;
		} ,
		_updateNow: function () {
			if (this.__propChangeFlag){
				if (this.hasChanged("template"))
					this.__reRenderFlag = true;
				this.commitProps();
				this.__propChangeFlag = false;
			}
			if (this.__reRenderFlag){
				this.beforeRender();
				this.renderTemplate();
				this.render();
				this.afterRender();
				this.__reRenderFlag = false;
			}
			if (this.__updateDisplayFlag){
				this.updateDisplay();
				this.__updateDisplayFlag = false;
			}
			this.__changed = {};
		} ,
		set: function () {
			if (!arguments[0])
				return this;
			var attr;
			if (arguments.length == 2 && typeof arguments[0]  == "string"){
				attr = {};
				attr[arguments[0]] = arguments[1];
			}else if (arguments.length === 1 && typeof arguments[0] === "object"){
				attr = arguments[0];
			}
			if (attr){
				for (var prop in attr){
					if (this["set$"+prop])
						this["set$"+prop](attr[prop]);
					else
						this[prop] = attr[prop];
					this.__changed[prop] = true;
				}
				this.invalidateProps();
			}
			return this;
		} ,
		get: function (prop) {
			if (this["get$"+prop])
				return this["get$"+prop](this , prop);
			return this[prop];
		} ,
		hasChanged: function () {
			var change = false;
			for (var i = 0; i < arguments.length; i++){
				if (this.__changed[arguments[i]])
					return true;
			}
			return false;
		} ,
		setChanged: function () {
			for (var i = 0; i < arguments.length; i++){
				this.__changed[arguments[i]] = true;
			}
		} ,
		unsetChanged: function () {
			for (var i = 0; i < arguments.length; i++){
				delete this.__changed[arguments[i]];
			}
		} ,
		addView: function (selector , view , index) {
			if (arguments.length <= 0){
				return;
			}else if (arguments.length == 1){
				view = selector;
				selector = "__el__";
			}else if (arguments.length == 2 && selector instanceof Display){
				view = selector;
				selector = "__el__";
				index = view;
			}
			if (!(view instanceof Display))
				return;
			
			if (!this._views.get(selector))
				this._views.put(selector , []);
			if (view.parent){
				view.parent.removeView(view);
			}
			var len = this._views.get(selector).length;
			index = (index === undefined || index > len) ? len : 
					index < 0 ? 0 : 
					index;
			this._views.get(selector).splice(index , 0 , view);
			var dom = selector == "__el__" ? this.$el : 
						typeof selector === "string" ? this.$(selector) : 
						$(selector);
			if (index === 0)
				dom.prepend(view.$el);
			else{
				prechild = dom.children()[index-1];
				view.$el.insertAfter(prechild);
			}
			this._viewAdded(selector , view , index);
		} ,
		getViews: function (selector , index) {
			if (arguments.length === 0)
				return null;
			else if (arguments.length == 1 && typeof selector === "number"){
				index = selector;
				selector = "__el__";
			}
			if (index !== undefined){
				return this._views.get(selector)[index];
			}else{
				return this._views.get(selector);
			}
		} ,
		removeView: function (selector , view) {
			var index;
			if (arguments.length === 0) {
				return;
			}else if (arguments.length == 1){
				if (selector instanceof Display){
					view = selector;
					selector = "__el__";
				}else if (typeof selector === "number"){
					index = selector;
					selector = "__el__";
				}
			}else if (arguments.length == 2 && typeof view === "number"){
				index = view;
				view = undefined;
			}
			if (view !== undefined){
				index = this._views.get(selector).indexOf(view);
			}
			if (index !== undefined && index >= 0 && index < this._views.get(selector).length){
				view = this._views.get(selector).splice(index , 1)[0];
				view.$el.remove();
				this._viewRemoved(selector , view , index);
			}
		} ,
		removeAllViews: function () {
			var view , index , selector , dom;
			this._views.each(function (selector , views) {
				for (var i = views.length - 1; i >= 0; i--){
					view = views.pop();
					this._viewRemoved(selector , view , i);
				}
				dom = selector == "__el__" ? this.$el : 
						typeof selector === "string" ? this.$(selector) : 
						$(selector);
				dom.empty();
			});
			this._views.clear();
		} ,
		_viewAdded: function (selector , view , index) {
			view.parent = this;
			view.viewIndex = index;
			view.trigger("add_to_display");
		} ,
		_viewRemoved: function (selector , view , index) {
			view.parent = null;
			view.viewIndex = -1;
			view.trigger("remove_from_display");
		}
	});

	module.exports = {
		Display: Display ,
		pickTemplate: function (template , id) {
			if (!id)
				return template;
			else{
				var tmpl;
				for (var i = 0; i < $(template).length; i++){
					tmpl = $(template)[i];
					if (tmpl["id"] === id)
						return tmpl;
				}
			}
			return null;
		}
	}
})