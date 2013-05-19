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
    Washago.Mobile.username = jQuery.cookie('washago_mobile_username');

    if (Washago.Mobile.username) {
      console.log('We found user: '+Washago.Mobile.username);
      jQuery('.username-display a').text(Washago.Mobile.username);

      hideLogin();
      showUsername();
    } else {
      console.log('No user found so promt for username');
    }

    jQuery('#login-button').click(function() {
      Washago.Mobile.username = jQuery('#username').val();
      if (Washago.Mobile.username && Washago.Mobile.username !== '') {
        jQuery.cookie('washago_mobile_username', Washago.Mobile.username, { expires: 1, path: '/' });
        jQuery('.username-display a').text(Washago.Mobile.username);

        hideLogin();
        showUsername();
      } else {
        console.error('Username invalid');
      }
    });
  };

  var hideLogin = function () {
    jQuery('#login-button').attr('disabled','disabled');
    jQuery('#username').attr('disabled','disabled');
  };

  var showUsername = function () {
    jQuery('.username-display').removeClass('hide');
  };

  this.Washago = Washago;

}).call(this);