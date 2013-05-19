/*jshint debug:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true, undef:true, curly:true, browser: true, devel: true, jquery:true, strict:true */
/*global  Backbone, _, jQuery */

(function() {
  "use strict";

  var Washago = this.Washago || {};

  Washago.Mobile = {};
  Washago.Mobile.username = null;
 
  Washago.Mobile.setup = function () {
    /* setup function */

    /* loading config.json should go here */     

    // retrieve user name from cookie if possible otherwise ask user to choose name
    Washago.Mobile.username = jQuery.cookie('washago_mobile_user_name');

    if (Washago.Mobile.username) {
      console.log('We found user: '+Washago.Mobile.username);
    } else {
      console.log('No user found so promt for username');
    }
  };

  this.Washago = Washago;

}).call(this);