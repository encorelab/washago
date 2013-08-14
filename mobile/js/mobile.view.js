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
    initialize: function () {
      console.log('Initializing InputView...', this.el);
    },

    events: {
      'click #share-note-btn': 'shareNewNote'
    },

    shareNewNote: function () {
      var newHeadline = this.$el.find('#note-headline-entry').val();
      var newNoteText = this.$el.find('#note-body-entry').val();
      var newNote = {};
      newNote.headline = newHeadline;
      newNote.body = newNoteText;
      // if (jQuery.trim(newTag).length < 2) {
      //   return; // don't allow tags shorter than 2 characters
      // }
      Washago.Mobile.createNewNote(newNote);
      
      this.$el.find('#note-headline-entry').val('');
      this.$el.find('#note-body-entry').val('');
    },

    render: function () {
      console.log('Rendering InputView');
    }


  });


  this.Washago = Washago;
}).call(this);
