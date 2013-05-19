/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:false */
/*global Backbone, _, jQuery, Sail */

(function() {
  "use strict";
    
  var Mobile.View = (function() {
    var app = {};

    app.something = function() {
    };

    return app;
  });
}).call(this);





  /**
    MobileView
  **/
  app.MobileView = Backbone.View.extend({
    events: {
      'keyup :input': function (ev) {
        var view = this,
          inputKey = ev.target.name,
          userValue = jQuery('#'+ev.target.id).val();
        // If we hit a key clear intervals so that during typing intervals don't kick in
        window.clearTimeout(Sail.app.autoSaveTimer);

        // save after 10 keystrokes
        Washago.Mobile.autoSave(view.model, inputKey, userValue, false);

        // setting up a timer so that if we stop typing we save stuff after 5 seconds
        Washago.Mobile.autoSaveTimer = setTimeout( function(){
          Sail.app.autoSave(view.model, inputKey, userValue, true);
        }, 5000);
      }
  });

  /**
    ListView
  **/
  app.ListView = Backbone.View.extend({

  });

  /**
  	DetailsView
  **/
  app.DetailsView = Backbone.View.extend({

  });

  /**
  	InputView
  **/
  app.InputView = Backbone.View.extend({

  });