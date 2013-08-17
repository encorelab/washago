(function () {
  "use strict";

  this.Washago = {};

  Washago = this.Washago;

  Washago.getState = function(forEntity) {
    var state;
    state = Washago.Model.awake.states.findWhere({
      entity: forEntity
    });
    if (!state) {
      console.warn("There is no state data for entity '" + forEntity + "'!");
    }
    return state;
  };

  Washago.setState = function(forEntity, values) {
    var state;
    state = Washago.getState(forEntity);
    if (!state) {
      state = new Washago.Model.State();
      state.set('entity', forEntity);
      Washago.Model.awake.states.add(state);
    }
    state.set(values);
    state.set('modified_at', new Date());
    state.save();
    return state;
  };

  /**
  Retrieves a JSON config file from "/config.json" and configures
  the given Sail app accordingly.
  */
  Washago.loadConfig = function() {
    var configUrl = '../config.json';
    jQuery.ajax(
      {
        url: configUrl, 
        dataType: 'json',
        async: false,
        cache: false,
        success: function(data) {
          Washago.Mobile.config = data;
        },
        error: function(xhr, code, error) {
          console.error("Couldn't load `"+configUrl+"`: ", code, error, xhr);
          alert("Couldn't load `"+configUrl+"` because:\n\n"+error+" ("+code+")");
        }
      }
    );
  };

  Washago.verifyConfig = function(config, required, path) {
    var curPath = path || null;

    _.each(_.keys(required), function (req) {
      if (typeof required[req] == 'object') {
        Washago.verifyConfig(config[req], required[req], (curPath ? curPath + "." : "") + req);
      } else {
        var err;
        if (!config) {
          err = "Missing configuration value for key '"+curPath+"'! Check your config.json";
        } else if (!config[req]) {
          err = "Missing configuration value for key '"+curPath+"."+req+"'! Check your config.json";
        } else if (typeof config[req] != required[req]) {
          err = "Configuration value for '"+req+"' must be a "+(typeof required[req])+" but is a "+(typeof config[req])+"! Check your config.json";
        }

        if (err) {
          console.error(err);
          throw err;
        }
      }
    });
  };

}).call(this);