var sail = require('./js/sail.js/sail.node.server.js');
var url = require('url');

sail.server.proxyMap.unshift({
    name: "Roadshow Session",
    match: function(req) { return url.parse(req.url).path.match(/^\/s.+/); },
    proxy: function(req, res) {
        req.addListener('end', function(){ 
            var u = url.parse(req.url);
            redirectTo = req.url.replace(/^\/.*/, 'participant.html?s=roadshow_'+u.path.match(/^\/s(.+)/)[1]);
            console.log("REDIRECT ==> "+req.url);

            res.setHeader('Location', redirectTo);
            res.statusCode = 302;
            res.end();
        });
    }
});

sail.server.start(8888);
