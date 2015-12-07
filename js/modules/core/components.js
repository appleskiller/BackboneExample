define(function(require , exports , module){
	var ui = require("components/src/ui");

	module.exports = {
		UI: ui.UI ,
		ItemRenderer: ui.ItemRenderer ,
		List: ui.List ,
		Tree: ui.Tree ,
		TreeItemRenderer: ui.TreeItemRenderer ,
		DomHelper: ui.DomHelper ,
		TemplateRenderer: ui.TemplateRenderer
	}
})