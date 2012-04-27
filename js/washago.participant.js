/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    "use strict";
    var self = {};

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        Sail.modules
            .load('Strophe.AutoConnector', {anonymous: true})
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Participant);
                jQuery(Sail.app).trigger('initialized');
                return true;
            });
    };

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
    };

    self.events = {
        initialized: function(ev) {
            Washago.Participant.authenticate();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            jQuery("#participant-ui").fadeIn(250);
            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
        },

        'ui.initialized': function(ev) {
            console.log("UI initialized, doing bindings...");
            
            // binding for submit button - TODO: all of the sev hashes need to be dynamically filled with jQuery etc.
            jQuery("#submit-button").click(function () {
                var sev = new Sail.Event('contribution', {
                    author:"conferenceJoe",
                    text:"loriddy ipsumius bling la",
                    tags:["alpha", "beta"],
                    id:"7582975289532",
                    about:"poster_A",
                    discourse_type:"question"
                });
                Sail.app.groupchat.sendEvent(sev);
            });
        }
    };

    // click even to place the tag as a button over the tag text box

    jQuery('#tag-list li a').click(function(){
        var tagText = jQuery(this).text();
        var tagButton;
        tagButton = '<a href="#" class="tag_button" data-role="button" data-icon="delete" >' + tagText +'</a>';
        jQuery('#chosen-tags').append( tagButton );
        jQuery('.tag_button').button();
        jQuery('.tag_button').click(function(){
            jQuery(this).remove();
            console.log('remove');
        });
        jQuery('.tag_button').buttonMarkup({inline: "true"});
    });

    self.getLocations = function() {
        var dataStr ='{"tags":["collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
        var data = jQuery.parseJSON(dataStr);
        //jQuery.post();
        
    };
    
    self.getTags = function() {
        
    };
    
    return self;
})();