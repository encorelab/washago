(function () {
  "use strict";

  var smartboard = new this.Washago.App();
  var Model = this.Washago.Model;


  smartboard.init = function() {
    _.extend(this, Backbone.Events);

    var requiredConfig = {
      drowsy: {
        url: 'string',
        db: 'string'
      },
      wakeful: {
        url: 'string'
      },
      curnit:'string'
    };

    // TODO: load this from config.json
    smartboard.loadConfig();
    smartboard.verifyConfig(smartboard.config, requiredConfig);

    // TODO: should ask at startup
    var DATABASE = smartboard.config.drowsy.db;

    Washago.Model.init(smartboard.config.drowsy.url, DATABASE)
    .then(function () {
      return Washago.Model.wake(smartboard.config.wakeful.url);
    }).done(function () {
      smartboard.ready();
    });
  };

  smartboard.ready = function() {
    smartboard.runState = Washago.getState('RUN');
    if (!smartboard.runState) {
      smartboard.runState = Washago.setState('RUN', {
        phase: 'brainstorm'
      });
    }
    smartboard.runState.wake(smartboard.config.wakeful.url);

    smartboard.wall = new smartboard.View.Wall({
      el: '#wall'
    });

    smartboard.wall.on('ready', function () { 
      smartboard.trigger('ready');
    });

    smartboard.wall.ready();
  };

  smartboard.createNewTag = function (tagName) {
    var tag = new Model.Tag({
      name: tagName,
      created_at: new Date()
    });
    tag.wake(smartboard.config.wakeful.url);

    return Model.awake.tags.add(tag);
  };

  this.Washago.Smartboard = smartboard;

}).call(this);