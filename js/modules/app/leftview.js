define(function(require , exports , module){
	var display = require("display");
	var components = require("components");
	var io = require("io");
	var filetree = require("filetree");
	var tmpl = require("text!leftview/templates/tmpl.html");

	var LeftView = components.UI.extend({
		template: display.pickTemplate(tmpl , "left_view") ,
		initialize: function () {
			components.UI.prototype.initialize.apply(this , arguments);
			this.addView(new filetree.FileTree({
				delegate: io
			}));
		}
	});

	module.exports = {
		LeftView: LeftView
	}
})