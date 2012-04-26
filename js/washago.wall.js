/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var self = {};

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        Sail.modules
            .load('Strophe.AutoConnector')
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Wall);
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
            Washago.Wall.authenticate();
            Sail.Strophe.connect();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            Washago.Wall.bindEventTriggers();
            
            Sail.app.groupchat.addWallJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
        }
    };

    return self;
})();