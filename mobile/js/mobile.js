/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";

  var Washago = this.Washago || {};

  Washago.Mobile = {};
 
  Washago.Mobile.setup = function () {
     /* setup function */

     /* loading config.json should go here */

     // Mozilla Persona stuff that is needed when navigator.id.request() is called
    Washago.Mobile.currentUser = null;

    navigator.id.watch({
      loggedInUser: Washago.Mobile.currentUser,
      onlogin: function(assertion) {
        // A user has logged in! Here you need to:
        // 1. Send the assertion to your backend for verification and to create a session.
        // 2. Update your UI.
        jQuery.ajax({ /* <-- This example uses jQuery, but you can use whatever you'd like */
          type: 'POST',
          url: '/mobile/auth/login.html', // This is a URL on your website.
          data: {assertion: assertion},
          success: function(res, status, xhr) { window.location.reload(); },
          error: function(xhr, status, err) {
            navigator.id.logout();
            alert("Login failure: " + err);
          }
        });
      },
      onlogout: function() {
        // A user has logged out! Here you need to:
        // Tear down the user's session by redirecting the user or making a call to your backend.
        // Also, make sure loggedInUser will get set to null on the next page load.
        // (That's a literal JavaScript null. Not false, 0, or undefined. null.)
        jQuery.ajax({
          type: 'POST',
          url: '/auth/logout', // This is a URL on your website.
          success: function(res, status, xhr) { window.location.reload(); },
          error: function(xhr, status, err) { alert("Logout failure: " + err); }
        });
      }
    });

  };

  Washago.Mobile.setupPersonaButtons = function() {
    // var signinLink = document.getElementById('signin');
    // if (signinLink) {
    //   signinLink.onclick = function() { navigator.id.request(); };
    // }
    jQuery("#signin").click(function() {
      console.log('Signin button clicked');
      navigator.id.request();
    });

    // var signoutLink = document.getElementById('signout');
    // if (signoutLink) {
    //   signoutLink.onclick = function() { navigator.id.logout(); };
    // }
    jQuery("#signout").click(function() {
      console.log('Signout button clicked');
      navigator.id.logout();
    });
  };

  this.Washago = Washago;

}).call(this);