/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";
  var Washago = this.Washago || {};
  this.Washago.Mobile = this.Washago.Mobile || {};
  var app = this.Washago.Mobile;

  app.keyCount = 0;
  app.autoSaveTimer = window.setTimeout(function() { console.log("timer activated"); } ,10);
  app.user = 'TODO';
  app.username = null;

  app.runState = null;
  app.userState = null;

  app.indexView = null;     // TODO - think about how necessary making these global is going to be

  app.setup = function() {
    /* CONFIG */

    // retrieve user name from cookie if possible otherwise ask user to choose name
    app.username = jQuery.cookie('washago_mobile_username');

    if (app.username) {
      console.log('We found user: '+app.username);
      jQuery('.username-display a').text(app.username);

      hideLogin();
      showUsername();
    } else {
      console.log('No user found so prompt for username');
      hideUsername();
    }

    jQuery('#login-button').click(function() {
      app.username = jQuery('#username').val();
      if (app.username && app.username !== '') {
        jQuery.cookie('washago_mobile_username', app.username, { expires: 1, path: '/' });
        jQuery('.username-display a').text(app.username);

        hideLogin();
        showUsername();
      } else {
        console.error('Username invalid');
      }
    });

    /* VIEW/MODEL SETUP */
    // run
    // user
    // mobile
    app.indexView = new app.View.IndexView({
      el: jQuery('#index-screen')
    });

    /* MISC */
    jQuery().toastmessage({
      position : 'middle-center'
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