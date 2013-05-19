(function () {
  "use strict";

  this.Washago = this.Washago || {};
  this.Washago.Smartboard = this.Washago.Smartboard || {};
  var Smartboard = this.Washago.Smartboard;

  Smartboard.init = function () {
    Smartboard.wall = new Smartboard.View.Wall({el: '#wall'});
  };

}).call(this);