/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    var self = {};

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        Sail.modules
            .load('Strophe.AutoConnector')
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Participant);
                jQuery(Sail.app).trigger('initialized');
                return true;
            });
    };

    self.authenticate = function () {
        // TODO: implement anon auth in autoconnector?
        Sail.Strophe.jid = "";
        Sail.Strophe.password = "";
    };

    self.events = {
        initialized: function(ev) {
            // TODO: implement anon auth in autoconnector?
            Washago.Participant.authenticate();
            Sail.Strophe.connect();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            Washago.Participant.bindEventTriggers();
            
            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
        }
    };

    return self;
})();