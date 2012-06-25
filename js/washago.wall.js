/*jshint browser: true, devel: true, forin: false */
/*globals Sail, Strophe, jQuery, _, MD5 */
var Washago = window.Washago || {};

Washago.Wall = (function() {
    var self = {};

    self.name = "Washago.Wall";

    self.cumulativeTagArray = [];

    // Brings a .ui-draggable element to the front (via z-index).
    // This is meant to be used as a callback for jQuery event bindings,
    // so `this` is assumed to refer to the element you want to bring
    // to the front.
    var bringDraggableToFront = function () {
        var zs = jQuery('.ui-draggable').map(function() {
            var z = jQuery(this).css('z-index'); 
            return z === 'auto' ? 100 : parseInt(z, 10);
        }).toArray();
        var maxZ = Math.max.apply(Math, zs);
        jQuery(this).css('z-index', maxZ + 1);
    };

    var positionBalloon = function (balloon) {
        var left, top;
        
        var contrib = balloon.data('contribution');

        var boardWidth = jQuery("#wall").width();
        var boardHeight = jQuery("#wall").height();
        
        if (contrib.pos && contrib.pos.left) {
            left = contrib.pos.left;
        } else {
            left = Math.random() * (boardWidth - balloon.width());
        }
        
        if (contrib.pos && contrib.pos.top) {
            top = contrib.pos.top;
        } else {
            top = Math.random() * (boardHeight - balloon.height());
        }
        
        balloon.css('left', left + 'px');
        balloon.css('top', top + 'px');

        //if (contrib.id) {
            //CommonBoard.contribBalloonPositioned(contrib, {left: left, top: top});
        //}
    };

    var createBalloon = function (contribution, restoring) {
        // this function creates the balloon, adds the text, positions it on the board
        var balloon = jQuery("<div class='balloon contribution'></div>");

        balloon.append("<div class='balloon-shadow'></div>");

        balloon.data('contribution', contribution);
        balloon.attr('id', "contribution-" + contribution.id);
        balloon.addClass('author-' + MD5.hexdigest(contribution.author));
        //if (contribution.discourse) { balloon.addClass('discourse-' + contribution.discourse); }      we should probably do some kind of error checking like this
        balloon.addClass('discourse-' + contribution.discourse.toLowerCase());
        balloon.addClass('about-' + MD5.hexdigest(contribution.about));
        md5tags = _.map(contribution.tags, function(t) {return MD5.hexdigest(t);});
        _.each(md5tags, function (t) {
            balloon.addClass('tags-' + t);
        });
        balloon.data('tags', md5tags); // used by washago.wall.graph

        balloon.hide(); // initially hidden, we call show() with an effect later

        var about = jQuery("<div class='about author'>");
        about.text(contribution.about + ' - ' + contribution.author);
        balloon.prepend(about);

        var text = jQuery("<div class='text'></div>");
        text.text(contribution.text);
        balloon.append(text);

        var tags = jQuery("<div class='tags'></div>");


        if (contribution.tags) {
            var tag;
            _.each(contribution.tags, function(t) {
                tag = jQuery("<span class='tag'></span>");
                tag.text(t);
                tags.append(tag);
            });
            balloon.append(tags);
        }

        balloon.draggable();

        // BANDAID: For some reason in Chrome draggable() makes balloon's position 'relative'...
        //          Need ot reset it back to absolute for proper positioning within the wall.
        balloon.css('position', 'absolute');

        // bring the balloon to the top when clicked
        balloon.mousedown(bringDraggableToFront);

        tags.hide(); // tags are initially collapsed

        balloon.dblclick(function() {
            jQuery(this).find('.tags').toggle('slideUp');
        });

        jQuery("#wall").append(balloon);
        
        positionBalloon(balloon);
        
        if (restoring)
            balloon.show();
        else
            balloon.show('puff', 'fast');

        return balloon;
    };


    //"author-1c206b0a8f48aef1217f6e004f10e106"
    //"author-698d51a19d8a121ce581499d7b701668"
    var filterBalloons = function () {
        var keywordClasses = activeKeywordClasses();    
        
        if (keywordClasses.length === 0) {
            // show all balloons if no filters are active
            jQuery('.balloon').removeClass('blurred');
        } else {
            // TODO: use inactiveKeywordClasses to make this more efficient
            jQuery('.balloon').addClass('blurred');
        
            // INTERSECTION (and)
            $('.balloon.'+keywordClasses.join(".")).removeClass('blurred')
        
            // UNION (or)
            //jQuery('.balloon.' + keywordClasses.join(", .balloon.")).removeClass('blurred');
        }
    };


    // this function returns an (unflattened) array that contain all of the (non-unique) tags to be turned on or off   // this isn't quite working... TODO
    var activeKeywordClasses = function () {
        return jQuery('li.selected').map(function() {
            return _.select(jQuery(this).attr('class').split(' '), function(klass) {
                return klass.match(/(tags|about|discourse|author)-/);
            });
        }).toArray();
    };
    
    var addTagToList = function (contribution) {
        var none_yet = jQuery('#tags-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }
        
        var list = jQuery('#tags-filter ul');
        _.each(contribution.tags, function (tag) {
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

        var list = jQuery('#about-filter ul');
        var li = list.find('.about-' + MD5.hexdigest(contribution.about));
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(contribution.about);
            li.addClass("about-" + MD5.hexdigest(contribution.about));
            li.click(function() {
                toggleFilterOption(MD5.hexdigest(contribution.about), "about");
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
        
        var list = jQuery('#discourse-filter ul');
        var li = list.find('.discourse-' + contribution.discourse.toLowerCase());
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(contribution.discourse);
            li.addClass("discourse-" + contribution.discourse.toLowerCase());
            li.click(function() {
                toggleFilterOption(contribution.discourse, "discourse");
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
        console.log(author + " left...");

        var nickname = Strophe.getResourceFromJid(jid);

        jQuery("#author-filter .author-"+MD5.hexdigest(nickname))
            .hide('fade', 'fast', function () {jQuery(this).remove();});
    };

    var sortList = function (list) {
        var items = jQuery(list).children('li').get();
        items.sort(function(a, b) {
           return jQuery(a).text().toUpperCase().localeCompare(jQuery(b).text().toUpperCase());
        })
        jQuery.each(items, function(idx, itm) { list.append(itm); });
    };

    // this is kinda sloppy, but it should work
    var toggleFilterOption = function (criteria, keyword) {
        li = jQuery('#' + keyword + '-filter li.' + keyword + '-' + criteria);
        if (li.is('.selected')) {
            li.removeClass('selected');
            filterBalloons();
        } else {
            li.addClass('selected');
            filterBalloons();
        }
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
            url: self.config.mongo.url + '/roadshow/contributions',
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

    var storeTags = function (tags) {
        console.log("Storing tags in the database");

        // {"name":"Tagy tag here", "count":1}
        _.each(tags, function(tag) {
            // check if tag is in db
            jQuery.ajax({
                type: "GET",
                url: self.config.mongo.url + '/roadshow/tags',
                data: { criteria: JSON.stringify({"name":tag})},
                dataType: 'json',
                context: this,
                success: function(data) {
                    if (data.ok === 1) {
                        if (data.length > 0) {
                            console.log("Found tag in database so update count");
                            
                            jQuery.ajax({
                                type: "PUT",
                                url: self.config.mongo.url + '/roadshow/tags',
                                dataType: 'json',
                                data: { criteria: JSON.stringify({"name":tag}), newobj: JSON.stringify({"$inc":{"count":1}})},
                                context: this,
                                success: function(data) {
                                    console.log("Tag updated");
                                },
                                error: function(data) {
                                    console.warn("Error updating tag in database. Possible reason: " +data.responseText);
                                }
                            });
                        } else {                            
                            console.log("Tag not in database - store");

                            var postData = 'docs=[' +JSON.stringify({"name":tag,"count":1})+ ']';

                            jQuery.ajax({
                                type: "POST",
                                url: self.config.mongo.url + '/roadshow/tags',
                                dataType: 'json',
                                // do a feeble attempt at checking for uniqueness
                                data: postData,
                                context: this,
                                success: function(data) {
                                    console.log("Tag stored for the first time");
                                },
                                error: function(data) {
                                    console.warn("Error writing tag to database. Possible reason: " +data.responseText);
                                }
                            });
                        }
                    } else {
                        console.warn("Error looking for tag :(");
                    }
                },
                error: function(data) {
                    console.warn("Error looking for tags in database");
                }
            });
            // if not in database store

            // if in database update count
        });    
    };

    self.init = function() {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

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

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
    };

    self.events = {
        initialized: function (ev) {
            Washago.Wall.authenticate();
        },

        'ui.initialized': function (ev) {
            jQuery('.toolbar')
                //.draggable({handle: '.titlebar'})
                .mousedown(bringDraggableToFront);

            jQuery('#cloudify').click(function () {
                Washago.Wall.Graph.init();
            });
        },

        connected: function (ev) {
            console.log("Connected...");
            
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

            
            jQuery.ajax(self.config.mongo.url + '/roadshow/contributions', {
                dataType: 'json',
                success: function (data) {
                    _.each(data, function (contrib) {
                        createBalloon(contrib, true);
                        addTagToList(contrib);
                        addAboutToList(contrib);                
                        addTypeToList(contrib);
                    });
                }
            });
        },

        sail: {
            contribution: function (sev) {
                var new_contribution = {
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    discourse:sev.payload.discourse,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                };
                createBalloon(new_contribution);
                addTagToList(new_contribution);
                addAboutToList(new_contribution);                
                addTypeToList(new_contribution);
                writeToDB(new_contribution);
                storeTags(new_contribution.tags);
            }
        }
    };

    return self;
})();