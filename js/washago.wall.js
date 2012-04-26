/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var self = {};

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        Sail.modules
            .load('Strophe.AutoConnector', {anonymous: true})
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Wall);
                jQuery(Sail.app).trigger('initialized');
                return true;
            });
    };

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
    };

    self.events = {
        initialized: function(ev) {
            Washago.Wall.authenticate();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            
            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
        }
    };

    return self;
})();