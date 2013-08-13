/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";
  var Washago = this.Washago || {};
  this.Washago.Mobile = this.Washago.Mobile || {};
  var Model = this.Washago.Model;
  var app = this.Washago.Mobile;

  app.config = null;
  app.requiredConfig = {
    drowsy: {
      url: 'string',
      db: 'string'
    },
    wakeful: {
      url: 'string'
    },
    curnit:'string'
  };

  app.keyCount = 0;
  app.autoSaveTimer = window.setTimeout(function() { console.log("timer activated"); } ,10);
  app.user = 'TODO';
  app.username = null;

  app.runState = null;
  app.userState = null;

  // app.indexModel = null;
  app.indexView = null;     // TODO - think about how necessary making these global is going to be

  app.init = function() {
    /* CONFIG */
    Washago.loadConfig();
    Washago.verifyConfig(app.config, this.requiredConfig);

    // TODO: should ask at startup
    var DATABASE = app.config.drowsy.db;

    // hide all rows initially
    app.hideAllRows();

    /* initialize the model and wake it up */
    Washago.Model.init(app.config.drowsy.url, DATABASE)
    .then(function () {
      console.log('model initialized - now waking up');
      return Washago.Model.wake(app.config.wakeful.url);
    }).done(function () {
      console.log('model awake - now calling setup');
      app.setup();
    });
  };

  app.setup = function() {
    // retrieve user name from cookie if possible otherwise ask user to choose name
    app.username = jQuery.cookie('washago_mobile_username');

    if (app.username) {
      // We have a user in cookies so we show stuff
      console.log('We found user: '+app.username);
      jQuery('.username-display a').text(app.username);

      // show index-screen aka home
      jQuery('#index-screen').removeClass('hidden');

      hideLogin();
      showUsername();

      app.ready();
    } else {
      console.log('No user found so prompt for username');
      hideUsername();
    }

    // click listener that sets username
    jQuery('#login-button').click(function() {
      app.username = jQuery('#username').val();
      if (app.username && app.username !== '') {
        jQuery.cookie('washago_mobile_username', app.username, { expires: 1, path: '/' });
        jQuery('.username-display a').text(app.username);

        // show index-screen aka home
        jQuery('#index-screen').removeClass('hidden');

        hideLogin();
        showUsername();
      } else {
        console.error('Username invalid');
      }
    });

    // click listener that log user out
    jQuery('.logout-user').click(function() {
      jQuery.removeCookie('washago_mobile_username',  { path: '/' });
      window.location.reload();
    });

    // Show home / input screen
    jQuery('.home').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#index-screen').removeClass('hidden');
      }
    });

    // Show dashboard
    jQuery('.dashboard').click(function() {
      if (app.username) {
        app.hideAllRows();
        jQuery('#dashboard-screen').removeClass('hidden');
      }
    });


    /* MISC */
    jQuery().toastmessage({
      position : 'middle-center'
    });

  };

  app.ready = function() {
    /* VIEW/MODEL SETUP */
    // run
    // user
    // mobile
    
    if (app.indexView === null) {
      app.indexView = new app.View.IndexView({
        el: jQuery('#index-screen')
      });
    }

    app.inputView = new app.View.InputView({
      el: '#input-screen'
    });
  };

  var hideLogin = function () {
    jQuery('#login-button').attr('disabled','disabled');
    jQuery('#username').attr('disabled','disabled');
  };

  var showUsername = function () {
    jQuery('.username-display').removeClass('hide');
  };

  var hideUsername = function() {
    jQuery('.username-display').addClass('hide');
  };

  app.hideAllRows = function () {
    jQuery('.row-fluid').each(function (){
      jQuery(this).addClass('hidden');
    });
  };

  app.createNewNote = function (note) {
    note.created_at = new Date();
    var noteModel = new Model.Note(note);
    noteModel.save();
    noteModel.wake(app.config.wakeful.url);

    return Model.awake.notes.add(noteModel);
  };

  app.autoSave = function(model, inputKey, inputValue, instantSave) {
    app.keyCount++;
    //console.log("saving stuff as we go at", app.keyCount);

    // if (model.kind === 'buildOn') {
    //   if (instantSave || app.keyCount > 9) {
    //     // save to buildOn model to stay current with view
    //     // app.buildOn = inputValue;
    //     // save to contribution model so that it actually saves
    //     // var buildOnArray = app.contribution.get('build_ons');
    //     // var buildOnToUpdate = _.find(buildOnArray, function(b) {
    //     //   return b.author === app.userData.account.login && b.published === false;
    //     // });
    //     // buildOnToUpdate.content = inputValue;
    //     // app.contribution.set('build_ons',buildOnArray);
    //     // app.contribution.save(null, {silent:true});
    //     // app.keyCount = 0;
    //   }
    // } else {
      if (instantSave || app.keyCount > 9) {
        console.log('Saved');
        //model.set(inputKey, inputValue);
        //model.save(null, {silent:true});
        app.keyCount = 0;
      }
    //}
  };

  this.Washago = Washago;

}).call(this);