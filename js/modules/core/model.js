define(function(require , exports , module){
	var $ = require("jquery");
	var Backbone = require("backbone");

	var datatype = require("datatype");

	var AppModel = datatype.DataItem.extend({
		getDefault: function () {
			return {
				preference: {} ,
				fileTree: null ,
				openFiles: new FileList() ,
				lastFile: null ,
			}
		}
	});

	var FileList = datatype.ArrayList.extend({
		constructor: function (source) {
			var s = source , fileItem;
			if (source){
				s = [];
				for (var i = 0; i < source.length; i++){
					if (!(source[i] instanceof FileItem)){
						fileItem = new FileItem(source[i]);
						if (!(fileItem.fileInfo instanceof FileInfo))
							fileItem.fileInfo = new FileInfo(fileItem.fileInfo);
						s.push(fileItem);
					}
				}
			}
			datatype.ArrayList.call(this , s);
		} ,
		createFile: function (fileInfo) {
			var fileItem;
			if (fileInfo instanceof FileInfo){
				fileItem = new FileItem({fileInfo: fileInfo});
			}else if (typeof fileInfo == "object"){
				fileItem = new FileItem({fileInfo: new FileInfo(fileInfo)})
			}else {
				fileItem = new FileItem();
			}
			this.add(fileItem);
			return fileItem;
		} , 
		editFile: function (fileItem) {
			if (!fileItem)
				return fileItem;
			this.itemUpdated(fileItem);
		} , 
		swapFile: function (ind1 , ind2) {
			if (!this.source[ind1] || !this.source[ind2] || ind1 == ind2)
				return ;
			var tmp = this.source[ind1];
			this.source[ind1] = this.source[ind2];
			this.source[ind2] = tmp;
			this.triger("swap" , {target: this , index1: ind1 , index2: ind2});
		} ,
		hasFile: function (fileInfo) {
			for (var i = 0; i < this.source.length; i++){
				if (this.source[i].get("fileInfo").get("path") == fileInfo.path)
					return true;
			}
			return false;
		} , 
		getFile: function (fileInfo) {
			for (var i = 0; i < this.source.length; i++){
				if (this.source[i].get("fileInfo").get("path") == fileInfo.path)
					return this.source[i];
			}
			return null;
		}
	})

	var FileItem = datatype.DataItem.extend({
		getDefault: function () {
			return {
				fileInfo: new FileInfo() ,
				session: null 
			}
		}
	});

	var FileInfo = datatype.DataItem.extend({
		getDefault: function () {
			return {
				name: 'untitled' ,
				path: null ,
			}
		}
	});

	// -----------------------------------------------------------------------------
	// 初始化dashboard
	// =============================================================================
	var appModel = new AppModel();

	module.exports = {
		appModel: appModel ,
		FileList: FileList
	}
})
