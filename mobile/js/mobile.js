/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";

  var Mobile = {};
 
  Mobile.setup = function () {
     /* setup function */

     /* loading config.json should go here */
  };

  Mobile.setupPersonaButtons = function() {
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

  this.Mobile = Mobile;

}).call(this);