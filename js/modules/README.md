目录规范
=============================================================================================

模块分级
---------------------------------------------------------------------------------------------
按分级层次向下依赖，向上聚合。同级依赖应尽量避免。

* app             - 顶级模块。他们在功能上更接近应用的最终形态，但有相对明确而独立的功能区隔。
* functional      - 业务模块。支撑应用功能的业务级模块，被顶级模块所复用。
* core            - 核心模块。他们是单一业务功能的基础模块。
* common           - 通用模块。跟应用业务无关，他们可以被其他系统所复用。

模块目录布局
---------------------------------------------------------------------------------------------
出现在此处的目录和文件有既定含义，所要求的文件或代码必须置于其中，其他目录及文件根据需要定义，但要求结构清晰。

* mymodule.js - 模块主文件，与源码目录同名
* mymodule - 模块名称
  * docs/ - 技术文档目录
  * api/ - api输出目录
  * build/ - 各种打包方式输出目录
  * test/ - 单元测试
  * resources/ - 资源文件目录
  * theme/ - 样式主题
    * default.css - 默认样式文件
  * lib/ - 第三方库目录，如果需要从外部依赖第三方，请在package.json中的dependencies中描述清楚
  * templates/ - 模板目录
    * tmpl_xxx.html - 模板文件
  * package.json - 包描述
  * README.md - 说明文档
  * History.md - 版本变更历史

mymodule.js 编码示例
```javascript
// 模块命名须带命名空间，以分级名称作为命名空间
define("mymodule" , function (require, exports, module) {
  // 依赖引入
  var $ = require("jquery");
  // 引入依赖模块
  var somemodule = require("functional.somemodule");
  // 内部依赖使用此方式require
  var inner = require("mymodule/src/inner");
  // 构造函数
  function Xxxxx () {
  }
  Xxxxx.prototype = {
  }
  // 导出
  module.exports = {
    // 单例形式导出
    singleton: new Xxxxx() ,
    // 构造函数导出
    Xxxxx: Xxxxx
  }
});
```
package.json 编码示例
借鉴node.js的module标准
```javascript
{
  "name": "mymodule",
  "version": "0.1.0",
  "author" : "simple",
  "description" : "package json介绍",
  "dependencies": {
    // ~指不低于某版本的最新版本，不加则为指定版本
    "jquery": "~1.9.0",
    "backbone": "~1.8.1",
  },
  "config": {
    "paths": {
    // 第一方和第二方依赖
      "functional.somemodule": "functional/somemodule/index"
    }
  }
}
```

文件命名
---------------------------------------------------------------------------------------------
* 文件及文件夹命名为全小写

编码规范
=============================================================================================

* 模块命名须为全小写，类命名使用大写开头驼峰式，变量及函数名为小写开头驼峰式
* 模块要求使用require进行依赖管理，建议使用兼容CommonJS的AMD规范，如上述index.js中的示例代码
* 模块内部所有需要对外暴露的类、对象、函数、属性，统一在模块主文件中导出，大型模块允许分块导出，按需加载
* 类实例外发事件，须使用全大写命名规则定义为类静态成员
* 未完成部分的代码块标示TODO
* 编写完整的块注释
  * 模块和类注释要求有@archor项
  * 事件注释要求有@event项，并描述派发时机与携带对象
  * 使用@public、@protected、@private标示访问控制
  * 详细的注释规范请学习JsDoc
* 对于有serviceapi需求的类须导出service interface，并注释注入方式
```javascript
define("mymodule" , function(require , exports , module){
  /**
   * Tree组件的服务代理，Tree通过构造函数option.delegate注入
   */
  var IServiceDelegate = {
    /**
     * 获取资源
     * @param  {string} path 资源路径
     * @return {JQueryPromise} promise对象 (我忘了这个对象类型是什么了^_^);
     */
    getFile: function (path) {}
  }
  /**
   * Tree组件服务的默认实现，用于测试
   */
  var delegate = {
    getFile: function (path) {
      var defer = $.defer();
      setTimeout(function () {
        defer.resove("sample data")
      } , 0)
      return defer.promise();
    }
  }
  var Tree = Backbone.View.extend({
    initialize: function(){
      this.delegate = this.delegate || delegate;
    }
  })
  module.exports = {
    Tree: Tree ,
    IServiceDelegate: IServiceDelegate
  }
})

```

Tips
=============================================================================================

关于require
---------------------------------------------------------------------------------------------
**文件即模块**
每个Javascript文件应该只定义一个模块，这是模块名-至-文件名查找机制的自然要求。

**文件名即模块名**
理解这一点并遵守这个约定，即可以让你更快的学习别人的模块代码，也会让别人很自然的使用你的模块。还有就是，你可以不必显式的在模块的define部分声明一个特殊的模块名称。

**相对路径**
require中可以使用相对路径，这对模块复用非常有价值。
然而，需要注意的是，对于对外导出的那个模块文件中，使用相对路径，诸如require("./src/xx.js")可能会带来麻烦，在“文件名即模块名”的约定下，这个问题会很自然的得以解决: require("mymodule/src/xx.js")————mymodule的使用者会为你的mymodule.js(拷贝或源码)配置路径，剩下的事情require会处理好。
在模块源码的内部依赖文件中，可以放心的使用相对路径，但需要知道，是相对于自身文件的所在位置的路径。

**AMD还是CommonJS**
```javascript
define(["x"] , function(x){})
```
————这样的写法CommonJS并不支持, 他只适用于浏览器环境。
还好AMD标准允许这样
```javascript
define(function(require , exports , module){})
```
这个写法前后台通吃。这意味着，如果希望前台代码可以跑在node环境，请坚持这样使用。同理，对于基于node的模块，这样书写亦有机会使代码运行于浏览器环境。
这一切，都需要感谢require和localrequire: 发明require的这伙人看来并不是废柴。

关于sublime
--------------------------------------------------------------------------------------------
**想让sublime检查你愚蠢的js编码错误么？**
install package -> SublimeLinter; install package -> SublimeLinter-jslint;（需要node环境）
安装后，设置linter为jslint，开启普通模式，设置为jshint，开启噩梦模式
**想让sublime自动产生块注释么？**
install package -> DocBlockr
输入"/**"回车，不错吧，到处去试试。
**想让sublime美化js代码么？**
install package -> jsFormat
**想让sublime把css整成一行么？**
install package -> CSS Format
**觉得sublime侧边栏右键菜单功能太少？**
install package -> Side Bar

关于此demo
---------------------------------------------------------------------------------------------
它仅仅演示了我们系统中的模块切分、目录布局、耦合/聚合关系、依赖、写法。

关于.md文档 
---------------------------------------------------------------------------------------------
[.md文档教程](http://blog.csdn.net/kaitiren/article/details/38513715 "一看就会")
