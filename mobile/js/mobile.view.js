/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:false */
/*global Backbone, _, jQuery, Sail */

(function() {
  "use strict";

  var Washago = this.Washago || {};
    
  Washago.Mobile.View.setup = function() {
  }

  /**
    MobileView
  **/
  Washago.Mobile.View.MobileView = Backbone.View.extend({
    events: {
      'keyup :input': function(ev) {
        var view = this,
          field = ev.target.name,
          input = jQuery('#'+ev.target.id).val();
        // if we hit a key clear intervals so that during typing intervals don't kick in
        window.clearTimeout(Washago.Mobile.autoSaveTimer);

        // save after 10 keystrokes
        Washago.Mobile.autoSave(view.model, field, input, false);

        // setting up a timer so that if we stop typing we save stuff after 5 seconds
        Washago.Mobile.autoSaveTimer = setTimeout(function(){
          Washago.Mobile.autoSave(view.model, field, input, true);
        }, 5000);
      }
  });

  /**
    ListView
  **/
  Washago.Mobile.View.ListView = Backbone.View.extend({

  });

  /**
  	DetailsView
  **/
  Washago.Mobile.View.DetailsView = Backbone.View.extend({

  });

  /**
  	InputView
  **/
  Washago.Mobile.View.InputView = Backbone.View.extend({

  });


  this.Washago = Washago;
}).call(this);
