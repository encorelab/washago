/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:false */
/*global Backbone, _, jQuery, Sail */

(function() {
  "use strict";
  var Washago = this.Washago || {};
  this.Washago.Mobile = this.Washago.Mobile || {};
  var app = this.Washago.Mobile;
  app.View = {};

  /**
    MobileView
  **/
  app.View.IndexView = Backbone.View.extend({
    events: {
      'keyup :input': function(ev) {
        var view = this,
          field = ev.target.name,
          input = jQuery('#'+ev.target.id).val();
        // clear timer on keyup so that a save doesn't happen while typing
        window.clearTimeout(app.autoSaveTimer);

        // save after 10 keystrokes
        app.autoSave(view.model, field, input, false);

        // setting up a timer so that if we stop typing we save stuff after 5 seconds
        app.autoSaveTimer = setTimeout(function(){
          app.autoSave(view.model, field, input, true);
        }, 5000);
      }
    },

    initialize: function () {
      console.log("Initializing IndexView...",this.el);
    }
  });

  /**
    ListView
  **/
  app.View.ListView = Backbone.View.extend({

  });

  /**
    DetailsView
  **/
  app.View.DetailsView = Backbone.View.extend({

  });

  /**
    InputView
  **/
  app.View.InputView = Backbone.View.extend({

  });


  this.Washago = Washago;
}).call(this);
