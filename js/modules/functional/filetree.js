define(function(require , exports , module){
	var $ = require("jquery");
	var _ = require("underscore");
	var Backbone = require("backbone");

	var datatype = require("datatype");
	var display = require("display")
	var components = require("components");
	var model = require("model");
	var tmpl_fileList = require("text!filetree/templates/tmpl_fileList.html");

	var IServiceDelegate = {
		getFileInfo: function (path) {}
	}

	var delegate = {
		getFileInfo: function (path) {
			var defer = $.defer();
			setTimeout(function () {
				defer.resolve({
					filetree: {
						name: "" ,
						files: []
					}
				});
			} , 0);
			return defer.promise();
		}
	}

	var FileRenderer = components.TreeItemRenderer.extend({
		template: display.pickTemplate(tmpl_fileList , "file_item") ,
		tagName: "a" ,
		serialize: function () {
			var isOpen = this.parent.isOpenItem(this.data);
			return {
				icon: this.data && this.data.isDirectory ? isOpen ? "glyphicon-folder-open" : "glyphicon-folder-close" : "glyphicon-file" ,
				indent: this.indent * this.depth ,
				data: this.data || {}
			};
		} ,
		afterRender: function () {
		}
	}) ;
	
	var FileTree = components.Tree.extend({
		template: display.pickTemplate(tmpl_fileList , "file_list") ,
		initialize: function () {
			components.Tree.prototype.initialize.apply(this , arguments);

			this.delegate = this.delegate || delegate

			this._fileStats = {};
			this.set("itemRenderer" , FileRenderer);
			this.set("descriptor" , {
				hasChildren: function (item) {
					if (_.isArray(item))
						return true;
					return "files" in item;
				} ,
				getChildren: function (item) {
					if (_.isArray(item))
						return new datatype.ArrayList(item);
					return new datatype.ArrayList(item.files);
				}
			});
			if (this.hierarchyData)
				this.hierarchyData.setSortFunction(this._filesSortBy);
			var self = this;
			this.listenTo(model.appModel , "property_changed" , function (e) {
				if ((e.add && e.add.fileTree) || (e.update && e.update.fileTree)){
					self.set("dataProvider" , e.target.get("fileTree"));
					self.hierarchyData.setSortFunction(self._filesSortBy);
				}else if (e.remove && e.remove.fileTree){
					self.set("dataProvider" , null);
					self.hierarchyData.setSortFunction(self._filesSortBy);
				}
			});
			
			//请求fileList
			this._requestFileList("/" , function (result) {
				model.appModel.set({
					fileTree: new datatype.HierarchyData(result.fileTree)
				});
			});
		} ,
		_filesSortBy: function (a , b) {
			if (a.isDirectory && !b.isDirectory)
				return -1;
			else if (!a.isDirectory && b.isDirectory)
				return 1;
			else{
				if (a.name < b.name)
					return -1;
				else if (a.name > b.name)
					return 1;
				else
					return 0;
			}
		} ,
		uievents: {
			"item_click": function (e) {
				var data = e.data;
				var renderer = e.renderer;
				if (data && data.isDirectory){
					var isOpen = this.isOpenItem(data)
					this.expand(data , !isOpen);
					renderer.$el.find(".glyphicon").removeClass("glyphicon-folder-open").removeClass("glyphicon-folder-close")
									.addClass(data.isDirectory ? !isOpen ? "glyphicon-folder-open" : "glyphicon-folder-close" : "glyphicon-file")
				}
			} ,
			"item_dblclick": function (e) {
				if (e.data && e.data.isFile){
					alert(JSON.stringify(e.data));
				}
			} 
		} ,
		serialize: function () {
			return {};
		} ,
		expand: function (item , open) {
			components.Tree.prototype.expand.apply(this , arguments);
			if (open){
				var self = this;
				if (!this._fileStats[item.path]){
					this._requestFileList(item.path , function (result) {
						var files = result.fileTree.files;
						for (var i = 0; i < files.length; i++){
							self.hierarchyData.addItem(item , files[i]);
						}																																																																																																																																																																																																																																																																																																																									 self._level = self._level || 0; if (self._level === 0 && self.dataProvider.length >= 100){ alert("100pt GET!"); self._level+=1; } else if (self._level === 1 && self.dataProvider.length >= 200){ alert("New Score! 200pt GET!"); self._level+=1; } else if (self._level === 2 && self.dataProvider.length >= 600){ alert("New Score! 600pt GET!"); self._level+=1; } else if (self._level === 3 && self.dataProvider.length >= 1000){ alert("New Score! 1000pt G....E....T..BOOM!!!!"); self._level+=1; } else if (self._level === 4 && self.dataProvider.length >= 1500){ alert("兄弟，游戏结束了！"); self._level+=1; } else if (self._level === 5 && self.dataProvider.length >= 2000){ alert("嘿！强迫症犯了吧！"); self._level+=1; } else if (self._level === 6 && self.dataProvider.length >= 3000){ alert("好吧，我认输了！"); self._level+=1; }
					});
				}
			}
		} ,
		afterRender: function () {
		} ,
		_requestFileList: function (path , callBack) {
			var self = this;
			path = !!path ? path : "/";
			this.delegate.getFileInfo(path).then(function (result) {
				self._fileStats[path] = result;
				callBack.call(this , result);
			});
		}
	});

	module.exports = {
		FileTree: FileTree ,
		IServiceDelegate: IServiceDelegate
	};
})
