(function () {
  "use strict";

  this.Washago = this.Washago || {};
  this.Washago.Smartboard = this.Washago.Smartboard || {};
  var Smartboard = this.Washago.Smartboard;
  var Model = this.Washago.Model;

  Smartboard.init = function() {
    _.extend(this, Backbone.Events);

    // TODO: load this from config.json
    Smartboard.config = {
      drowsy: {url: "http://drowsy.badger.encorelab.org"},
      wakeful: {url: "http://wakeful.badger.encorelab.org:7777/faye"}
    };

    // TODO: should ask at startup
    var DATABASE = "washago-dev";

    Washago.Model.init(Smartboard.config.drowsy.url, DATABASE)
    .then(function () {
      return Washago.Model.wake(Smartboard.config.wakeful.url);
    }).done(function () {
      Smartboard.ready();
    });
  };

  Smartboard.ready = function() {
    Smartboard.runState = Washago.getState('RUN');
    if (!Smartboard.runState) {
      Smartboard.runState = Washago.setState('RUN', {
        phase: 'brainstorm'
      });
    }
    Smartboard.runState.wake(Smartboard.config.wakeful.url);

    Smartboard.wall = new Smartboard.View.Wall({
      el: '#wall'
    });

    Smartboard.wall.on('ready', function () { 
      Smartboard.trigger('ready');
    });

    Smartboard.wall.ready();
  };

  Smartboard.createNewTag = function (tagName) {
    var tag = new Model.Tag({
      name: tagName,
      created_at: new Date()
    });
    tag.wake(Smartboard.config.wakeful.url);

    return Model.awake.tags.add(tag);
  };

}).call(this);