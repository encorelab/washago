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
    template: "#list-view-template",

    initialize: function () {
      var view = this;

      console.log('Initializing InputView...', this.el);

      Washago.Model.awake.notes.on('add', function(n) {
        console.log('Note added...');
        // wall.registerBalloon(n, Smartboard.View.NoteBalloon, wall.balloons);
      });

      // find the list where items are rendered into
      var list = this.$el.find('ul');

      Washago.Model.awake.notes.each(function(n) {
        console.log('Show each note...');
        // wall.registerBalloon(n, Smartboard.View.NoteBalloon, wall.balloons);
        // var listItem = jQuery('<li>');
        // listItem.text(n.get('headline'));
        var data = n.toJSON();
        // _.extend(data, viewHelpers);

        var listItem = _.template(jQuery(view.template).text(), data);
        // list.html(listItem);

        list.append(listItem);
      });

      return view;
    },

    events: {
      'click #new-note-btn': 'createNewNote'
    },

    createNewNote: function() {
      console.log('New note clicked');
    },

    render: function () {
      console.log('Rendering InputView');
    }
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
