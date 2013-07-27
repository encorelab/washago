/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";
  var Washago = this.Washago || {};
  this.Washago.Mobile = this.Washago.Mobile || {};
  var app = this.Washago.Mobile;

  app.keyCount = 0;
  app.autoSaveTimer = window.setTimeout(function() { console.log("timer activated"); } ,10);
  // Mozilla Persona stuff that is needed when navigator.id.request() is called
  app.currentUser = null;
  app.user = 'TODO';
  app.username = null;

  app.runState = null;
  app.userState = null;

  app.indexView = null;     // TODO - think about how necessary making these global is going to be

  app.setup = function() {
    /* CONFIG */

    /* Setup Mozilla's Persona */
    // app.setupPersona();
    app.setupPersonaButtons();

    // hide all rows initially
    app.hideAllRows();
    jQuery('#dashboard-screen').removeClass('hidden');

    // retrieve user name from cookie if possible otherwise ask user to choose name
    // app.username = jQuery.cookie('washago_mobile_username');

    // if (app.username) {
    //   // We have a user in cookies so we show stuff
    //   console.log('We found user: '+app.username);
    //   jQuery('.username-display a').text(app.username);

    //   // show index-screen aka home
    //   jQuery('#index-screen').removeClass('hidden');

    //   // hideLogin();
    //   showUsername();
    // } else {
    //   console.log('No user found so prompt for username');
    //   // hideUsername();
    // }

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

    // click listener that log user ou
    jQuery('.logout-user').click(function() {
      jQuery.removeCookie('washago_mobile_username',  { path: '/' });
      window.location.reload();
    });

    // Show home / input screen
    jQuery('.home').click(function() {
      app.hideAllRows();
      jQuery('#index-screen').removeClass('hidden');
    });

    // Show dashboard
    jQuery('.dashboard').click(function() {
      app.hideAllRows();
      jQuery('#dashboard-screen').removeClass('hidden');
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

  // var hideLogin = function () {
  //   jQuery('#login-button').attr('disabled','disabled');
  //   jQuery('#username').attr('disabled','disabled');
  // };

  // var showUsername = function () {
  //   jQuery('.username-display').removeClass('hide');
  // };

  // var hideUsername = function() {
  //   jQuery('.username-display').addClass('hide');
  // };

  app.hideAllRows = function () {
    jQuery('.row-fluid').each(function (){
      jQuery(this).addClass('hidden');
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

  // app.setupPersona = function () {
    
  //   navigator.id.watch({
  //     loggedInUser: app.currentUser,
  //     onlogin: function(assertion) {
  //       // A user has logged in! Here you need to:
  //       // 1. Send the assertion to your backend for verification and to create a session.
  //       // 2. Update your UI.
  //       jQuery.ajax({ /* <-- This example uses jQuery, but you can use whatever you'd like */
  //         type: 'POST',
  //         url: '/login', // This is a URL on your website.
  //         data: {assertion: assertion},
  //         success: function(res, status, xhr) {
  //           console.log('login success');
  //           window.location.reload();
  //         },
  //         error: function(xhr, status, err) {
  //           navigator.id.logout();
  //           alert("Login failure: " + err);
  //         }
  //       });
  //     },
  //     onlogout: function() {
  //       // A user has logged out! Here you need to:
  //       // Tear down the user's session by redirecting the user or making a call to your backend.
  //       // Also, make sure loggedInUser will get set to null on the next page load.
  //       // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
  //       jQuery.ajax({
  //         type: 'POST',
  //         url: '/logout', // This is a URL on your website.
  //         success: function(res, status, xhr) {
  //           console.log('logout success');
  //           window.location.reload();
  //         },
  //         error: function(xhr, status, err) { alert("Logout failure: " + err); }
  //       });
  //     }
  //   });
  // };

  app.setupPersonaButtons = function() {
    // var signinLink = document.getElementById('signin');
    // if (signinLink) {
    // signinLink.onclick = function() { navigator.id.request(); };
    // }
    jQuery("#signin").click(function() {
      console.log('Signin button clicked');
      navigator.id.request();
    });

    // var signoutLink = document.getElementById('signout');
    // if (signoutLink) {
    // signoutLink.onclick = function() { navigator.id.logout(); };
    // }
    jQuery("#signout").click(function() {
      console.log('Signout button clicked');
      navigator.id.logout();
    });
  };

  this.Washago = Washago;

}).call(this);