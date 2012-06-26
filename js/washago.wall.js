/*jshint browser: true, devel: true, forin: false */
/*globals Sail, Strophe, jQuery, _, MD5 */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var app = {};

    app.name = "Washago.Wall";

    app.cumulativeTagArray = [];

    app.configDB = 'roadshow_config';

    // this function returns an (unflattened) array that contain all of the (non-unique) tags to be turned on or off   // this isn't quite working... TODO
    var activeKeywordClasses = function (type) {
        return jQuery('.filter-list-container li.selected').map(function() {
            return _.select(jQuery(this).attr('class').split(' '), function(klass) {
                return klass.match(type+"-");
            });
        }).toArray();
    };

    var inactiveKeywordClasses = function (type) {
        return jQuery('.filter-list-container li').not('.selected').map(function() {
            return _.select(jQuery(this).attr('class').split(' '), function(klass) {
                return klass.match(type+"-");
            });
        }).toArray();
    };

    //"author-1c206b0a8f48aef1217f6e004f10e106"
    //"author-698d51a19d8a121ce581499d7b701668"
    var filterBalloons = function () {
        var types = ['tags','about','discourse'];
        var actives = _.map(types, function (type) {
            var active = activeKeywordClasses(type);
            var inactive = inactiveKeywordClasses(type);

            if (active.length === 0)
                return inactive;
            else
                return active;
        });
        console.log(actives);

        // form the query by getting all combinations of the different active filters
        var combos = [];
        var recurseCombos = function(out, i) {
            if (i == actives.length) {
                combos.push(out);
            } else {
                if (actives[i] && actives[i].length > 0) {
                    _.each(actives[i], function (a) {
                        recurseCombos(_.union(out,[a]), i+1);
                    });    
                } else {
                    recurseCombos(out, i+1);
                }
            }
        }
        recurseCombos([], 0); 
        
        var selector = _.map(combos, function (combo) {
            return '.'+combo.join('.')
        }).join(', ');

        console.log(selector);

        jQuery('.balloon').addClass('blurred');
        jQuery(selector).removeClass('blurred');
    };

    // this is kinda sloppy, but it should work
    var toggleFilterOption = function (criteria, keyword) {
        var li = jQuery('#' + keyword + '-filter li.' + keyword + '-' + criteria);
        if (li.is('.selected')) {
            li.removeClass('selected');
            filterBalloons();
        } else {
            li.addClass('selected');
            filterBalloons();
        }
    };

    var sortList = function (list) {
        var items = jQuery(list).children('li').get();
        items.sort(function(a, b) {
           return jQuery(a).text().toUpperCase().localeCompare(jQuery(b).text().toUpperCase());
        });
        jQuery.each(items, function(idx, itm) { list.append(itm); });
    };
    
    var addTagToList = function (contribution) {
        var none_yet = jQuery('#tags-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }

        var list = jQuery('#tags-filter ul');
        _.each(contribution.get('tags'), function (tag) {
            var li = list.find('.tags-' + MD5.hexdigest(tag));
            if (li.length === 0) {
                li = jQuery('<li />');
                li.text(tag);
                li.addClass("tags-" + MD5.hexdigest(tag));
                li.click(function() {
                    toggleFilterOption(MD5.hexdigest(tag), "tags");
                });
                list.append(li);
            }
        });

        sortList(list);
    };

    var addAboutToList = function (contribution) {
        var none_yet = jQuery('#about-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }

        var about = contribution.get('about');

        var list = jQuery('#about-filter ul');
        var li = list.find('.about-' + MD5.hexdigest(about));
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(about);
            li.addClass("about-" + MD5.hexdigest(about));
            li.click(function() {
                toggleFilterOption(MD5.hexdigest(about), "about");
            });
            list.append(li);
        }

        sortList(list);
    };

    var addTypeToList = function (contribution) {
        var none_yet = jQuery('#discourse-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }
        
        var discourse = contribution.get('discourse');

        var list = jQuery('#discourse-filter ul');
        var li = list.find('.discourse-' + discourse.toLowerCase());
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(discourse);
            li.addClass("discourse-" + discourse.toLowerCase());
            li.click(function() {
                toggleFilterOption(discourse.toLowerCase(), "discourse");
            });
            list.append(li);
        }

        sortList(list);
    };

    var addAuthorToList = function (jid) {
        console.log(jid + " joined...");

        var nickname = Strophe.getResourceFromJid(jid);

        var li = jQuery("<li />");
        li.text(nickname);
        li.addClass("author-"+MD5.hexdigest(nickname));
        li.click(function() {
            toggleFilterOption(MD5.hexdigest(nickname), "author");
        });
        
        jQuery("#author-filter .none-yet").remove('.none-yet');
        jQuery("#author-filter ul").append(li);

        // jQuery("#author-filter .filter-list-container")
        //     .css('overflow-y', 'auto')
        //     .css('height', '90%');
    };

    var removeAuthorFromList = function (jid) {
        console.log(jid + " left...");

        var nickname = Strophe.getResourceFromJid(jid);

        jQuery("#author-filter .author-"+MD5.hexdigest(nickname))
            .hide('fade', 'fast', function () {jQuery(this).remove();});
    };

    var writeToDB = function (contribution) {
        console.log("Attempting to store contribution in database");

        // TODO: might need to clone contribution to avoid modifying the original object
        contribution._id = contribution.id;
        delete contribution.id;

        // sleepy mongoose requires date being submitted in docs=[{"x":1,"y":2}]
        var postData = JSON.stringify(contribution);

        jQuery.ajax({
            type: "POST",
            url: app.config.mongo.url + '/roadshow/contributions',
            dataType: 'json',
            // do a feeble attempt at checking for uniqueness
            data: postData,
            context: this,
            success: function(data) {
                console.log("Contribution with id '" +contribution.id+ "' posted to database");
            },
            error: function(data) {
                console.warn("Error writing contribution to database. Possible reason: " +data.responseText);
            }
        });
    };

    var participantUrl = function () {
        var host = window.location.host;
        return "http://"+host+"/s"+app.run.name.replace('roadshow_','');
    };


    app.requestNickname = function (haveNickname) {
        haveNickname(app.run.name);
    };

    app.restoreState = function () {
        app.contributions = new app.model.Contributions();

        app.contributions.on('add', function (contrib) {
            addTagToList(contrib);
            addTypeToList(contrib);
            addAboutToList(contrib);
        });

        app.contributions.on('reset', function (collection) {
            collection.each(function (contrib) {
                addTagToList(contrib);
                addTypeToList(contrib);
                addAboutToList(contrib);
            });
        });

        app.restoreContributions();
    };

    app.restoreContributions = function () {
        this.contributions.fetch({
            data: { 
                selector: JSON.stringify({
                    session: app.run.name
                }) 
            },
            success: function (contributions) {
                contributions.each(function (contrib) {
                    new app.view.ContributionView({model: contrib})
                        .render();
                });
            }
        });
    };

    app.init = function() {
        //Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        // TODO: move this out to config.json
        Sail.app.username = "roadshow";
        Sail.app.password = "roadshow";

        Sail.modules
            .load('Strophe.AutoConnector', {mode: 'pseudo-anon'})
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Wall);
                jQuery(Sail.app).trigger('initialized');

                // TODO: add click bindings here

                return true;
            });
    };

    app.authenticate = function () {
        var runs = new Washago.Wall.model.Runs();
        runs.fetch({
            success: function (runs) {
                app.view.showRunPicker(runs, function (run) {
                    app.run = run.toJSON();
                    Sail.UI.dismissDialog('#run-picker')
                    jQuery(app).trigger('authenticated');
                });
            }
        });
    };

    app.events = {
        initialized: function (ev) {
            Washago.Model(Washago.Wall);
            Washago.Wall.authenticate();
        },

        authenticated: function (ev) {
            app.view.showParticipantUrl(participantUrl());

            jQuery('.toolbars-left, .toolbars-right').removeClass('out');
        },

        'ui.initialized': function (ev) {
            jQuery('.toolbar')
                //.draggable({handle: '.titlebar'})
                .mousedown(app.view.bringDraggableToFront);

            jQuery('#cloudify').click(function () {
                Washago.Wall.Graph.init();
            });
        },

        connected: function (ev) {
            console.log("Connected...");

            app.restoreState();
            // if (Sail.app.groupchat.participants) {
            //     for (var p in Sail.app.groupchat.participants) {
            //         addAuthorToList(p);
            //     }
            // } else {
            //     console.log('no participants yet or connection issues');
            // }

            // I don't believe these are working as intended - does the function name actual matter for some reason?
            //Sail.app.groupchat.addParticipantJoinedHandler(addAuthorToList);
            //Sail.app.groupchat.addParticipantLeftHandler(removeAuthorFromList);

            
            // jQuery.ajax(app.config.mongo.url + '/roadshow/contributions', {
            //     dataType: 'json',
            //     success: function (data) {
            //         _.each(data, function (contrib) {
            //             createBalloon(contrib, true);
            //             addTagToList(contrib);
            //             addAboutToList(contrib);                
            //             addTypeToList(contrib);
            //         });
            //     }
            // });
        },

        sail: {
            contribution: function (sev) {
                var contrib = new app.model.Contribution({
                    author: sev.payload.author,
                    text: sev.payload.text,
                    tags: sev.payload.tags,
                    about: sev.payload.about,
                    discourse: sev.payload.discourse,
                    timestamp: sev.timestamp,
                    id: sev.payload.id,
                    session: app.run.name
                });

                app.contributions.add(contrib);

                new app.view.ContributionView({model: contrib})
                        .render();


                //addTagToList(new_contribution);
                //addAboutToList(new_contribution);                
                //addTypeToList(new_contribution);
                //writeToDB(new_contribution);
                //storeTags(new_contribution.tags);
            }
        }
    };

    return app;
})();