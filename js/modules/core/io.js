define(function(require , exports , module){
	var $ = require("jquery");
	
	module.exports = {
		getFileInfo: function (path) {
			path = path || "/"
			var defer = $.Deferred();
			setTimeout(function () {
				var result = {
					"preference":{},"openFiles":[],"lastFile":"/","fileTree":{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716611,"size":0,"atime":"2015-05-30T13:00:53.502Z","mtime":"2015-03-02T15:17:18.913Z","ctime":"2015-03-02T15:17:18.913Z","birthtime":"2015-01-01T04:55:49.870Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"/","name":"","files":[{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716614,"size":0,"atime":"2015-05-30T12:54:17.585Z","mtime":"2015-03-02T14:03:03.193Z","ctime":"2015-03-02T14:03:03.193Z","birthtime":"2015-02-01T15:24:58.961Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\.bak","name":".bak","files":[]},{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":395753817255284100,"size":0,"atime":"2015-05-30T12:54:17.585Z","mtime":"2015-03-02T15:17:18.898Z","ctime":"2015-03-02T15:17:18.898Z","birthtime":"2015-02-24T09:17:17.012Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\.recycle","name":".recycle","files":[]},{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716616,"size":0,"atime":"2015-05-30T13:01:04.588Z","mtime":"2015-02-07T08:01:02.810Z","ctime":"2015-02-07T08:01:02.810Z","birthtime":"2015-01-30T15:13:43.084Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\attachment","name":"attachment","files":[]},{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":2533274790435268,"size":0,"atime":"2015-05-30T12:54:17.586Z","mtime":"2015-03-02T14:11:40.604Z","ctime":"2015-03-02T14:11:40.604Z","birthtime":"2015-02-27T14:35:40.720Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\iotest","name":"iotest","files":[]},{"dev":603546,"mode":33206,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716612,"size":37,"atime":"2015-05-30T07:06:17.639Z","mtime":"2015-03-22T12:08:55.631Z","ctime":"2015-03-22T12:08:55.631Z","birthtime":"2015-02-01T14:32:48.504Z","isFile":true,"isDirectory":false,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\launcher - 副本.js","name":"launcher - 副本.js"},{"dev":603546,"mode":33206,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":100486566685712960,"size":496,"atime":"2015-05-30T13:00:25.741Z","mtime":"2015-02-17T17:51:46.865Z","ctime":"2015-02-17T17:51:46.927Z","birthtime":"2015-01-02T06:46:24.824Z","isFile":true,"isDirectory":false,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\launcher.js","name":"launcher.js"},{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716618,"size":0,"atime":"2015-05-30T13:00:25.875Z","mtime":"2015-03-02T14:12:40.849Z","ctime":"2015-03-02T14:12:40.849Z","birthtime":"2015-01-01T06:26:52.689Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\service","name":"service","files":[]},{"dev":603546,"mode":16822,"nlink":1,"uid":0,"gid":0,"rdev":0,"ino":281474976716622,"size":0,"atime":"2015-05-30T13:01:04.587Z","mtime":"2015-03-22T12:04:43.593Z","ctime":"2015-03-22T12:04:43.593Z","birthtime":"2015-01-01T15:49:06.519Z","isFile":false,"isDirectory":true,"isBlockDevice":false,"isFIFO":false,"isSocket":false,"path":"\\www","name":"www","files":[]}]}
				};
				if (path !== "/"){
					result.fileTree.path = path;
					for (var i = 0; i < result.fileTree.files.length; i++){
						result.fileTree.files[i].path = path + "\\" + result.fileTree.files[i].name;
					}
				}
				defer.resolve(result);
			} , 0);
			return defer.promise();
		} ,
		getFileContent: function (path) {
			return $.get("/fileio/content" , {path: path})
		} ,
		saveFile: function (path , content) {
			return $.post("/fileio/content" , {path: path , content:content})
		} ,
		writeFile: function (path , content) {
			return $.post("/fileio/fs" , {method: "writeFile" , path: path , content: content});
		} ,
		unlink: function (path) {
			return $.post("/fileio/fs" , {method: "unlink" , path: path});
		} ,
		rename: function (oldPath , newPath) {
			return $.post("/fileio/fs" , {method: "rename" , oldPath: oldPath , newPath: newPath});
		} ,
		mkdir: function (path) {
			return $.post("/fileio/fs" , {method: "mkdir" , path: path});
		} ,
		rmdir: function (path) {
			return $.post("/fileio/fs" , {method: "rmdir" , path: path});
		} ,
		move: function (from , to) {
			return $.post("/fileio/fs" , {method: "move" , from: from , to: to});
		} ,
		copy: function (from , to) {
			return $.post("/fileio/fs" , {method: "copy" , from: from , to: to});
		}
	}
})