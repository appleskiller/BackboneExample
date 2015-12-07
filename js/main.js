//配置
requirejs.config({
	baseUrl: "js",
	paths: {
		"jquery": "lib/jquery-2.1.1.min",
		"underscore": "lib/underscore-min",
		"backbone": "lib/backbone-min" ,
		"bootstrap": "lib/bootstrap.min" ,
		"text": "lib/text" ,
		// common
		"datatype": "modules/common/datatype" ,
		"display": "modules/common/display" ,
		// core
		"io": "modules/core/io" ,
		"model": "modules/core/model" ,
		"components": "modules/core/components" ,
		// functional
		"filetree": "modules/functional/filetree" ,
		// app
		"leftview": "modules/app/leftview" ,
	} ,
	shim: {
		"underscore": {
			exports: "_"
		} ,
		"backbone": {
			deps: ["underscore" , "jquery"] ,
			exports: "Backbone"
		} ,
		"bootstrap": {
			deps: ["jquery"]
		} ,
	} 
});

requirejs([
	"jquery" , 
	"bootstrap" ,
	"leftview"
] , function ($ , bs , leftview) {
	$(document).ready(function () {
		var view = new leftview.LeftView();
		$("body").append(view.$el);
	});
});