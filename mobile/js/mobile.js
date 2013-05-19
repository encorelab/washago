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

  app.runState = null;
  app.userState = null;

  app.indexView = null;     // TODO - think about how necessary making these global is going to be

  app.setup = function() {
    /* setup function */

    /* loading config.json should go here */

    /* view/model setup */
    // RUN
    // USER
    // MOBILE
    app.indexView = new app.View.IndexView({
      el: jQuery('#index-screen')
    });

    /* misc setup stuff */
    jQuery().toastmessage({
      position : 'middle-center'
    });
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