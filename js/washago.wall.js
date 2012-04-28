/*jshint browser: true, devel: true */
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
            return z == 'auto' ? 100 : parseInt(z, 10);
        }).toArray();
        var maxZ = Math.max.apply(Math, zs);
        jQuery(this).css('z-index', maxZ + 1);
    };

    var positionBalloon = function (balloon) {
        var left, top;
        
        var contrib = balloon.data('contribution');

        var boardWidth = jQuery("#wall").width();
        var boardHeight = jQuery("#wall").height();
        
        if (contrib.pos && contrib.pos.left)
            left = contrib.pos.left;
        else
            left = Math.random() * (boardWidth - balloon.width());
        
        if (contrib.pos && contrib.pos.top)
            top = contrib.pos.top;
        else
            top = Math.random() * (boardHeight - balloon.height());
        
        balloon.css('left', left + 'px');
        balloon.css('top', top + 'px');
        
        if (contrib.id) {
            //CommonBoard.contribBalloonPositioned(contrib, {left: left, top: top});
        }
    };

    var createBalloon = function (contribution) {
        // this function creates the balloon, adds the text, positions it on the board

        var balloon = jQuery("<div class='balloon contribution'></div>");

        balloon.append("<div class='balloon-shadow'></div>");

        balloon.data('contribution', contribution);
        balloon.attr('id', "contibution-" + contribution.id);
        balloon.addClass('author-' + contribution.author);
        jQuery(contribution.tags).each(function() {
            balloon.addClass('tags-' + MD5.hexdigest(this));
        });

        balloon.hide(); // initially hidden, we call show() with an effect later

        var about = jQuery("<div class='about author'>");
        about.text(contribution.about + ' - ' + contribution.author);
        balloon.prepend(about);

        var text = jQuery("<div class='text'></div>");
        text.text(contribution.text);
        balloon.append(text);

        tags = jQuery("<div class='tags'></div>");
        if (contribution.tags) {
            tags.text(contribution.tags.join(", "));
            balloon.append(tags);
        }

        balloon.draggable();

        // bring the balloon to the top when clicked
        balloon.mousedown(bringDraggableToFront);

        positionBalloon(balloon);

        jQuery("#wall").append(balloon);
        balloon.show('puff', 'fast');

        return balloon;
    };

    var filterBalloons = function () {
        var keywordClasses = activeKeywordClasses();
        //var inactiveKeywordClasses = inactiveKeywordClasses();
        
/*        _.each(jQuery('#tags-filter .selected'), function (tag) {

            if (jQuery('.balloon.tag-' + MD5.hexdigest(tag)).length > 0) {
                jQuery('.balloon').removeClass('blurred');
            } else {
                jQuery('.balloon').addClass('blurred');
            }

        });
*/

/*        if (activeKeywordClasses.length === 0) {
            // show all balloons if no filters are active
            $('.balloon').removeClass('blurred');
        } else {
            // TODO: use inactiveKeywordClasses to make this more efficient
            $('.balloon').addClass('blurred');
        
            // INTERSECTION (and)
            //$('.balloon.'+activeKeywordClasses.join(".")).removeClass('blurred')
        
            // UNION (or)
            $('.balloon.'+activeKeywordClasses.join(", .balloon.")).removeClass('blurred');
        }*/
    };

    var activeKeywordClasses = function () {
        return jQuery('#li.selected').map(function() {
            return _.select(jQuery(this).attr('class').split(' '), function(klass) {
                return klass.match(/tags-/);
            });
        }).toArray();
    };
    
/*    var inactiveKeywordClasses = function () {
        return jQuery('#li').not('.selected').map(function() {
            return _.select($(this).attr('class').split(' '), MD5.hexdigest(criteria))
        }).toArray();
    };*/

/*    activeKeywordClasses: function() {
        return $('#li.selected').map(function() {
            return _.select($(this).attr('class').split(' '), function(klass) {
                return klass.match(/keyword-/)
            })
        }).toArray()
    },
    
    inactiveKeywordClasses: function() {
        return $('#li').not('.selected').map(function() {
            return _.select($(this).attr('class').split(' '), function(klass) {
                return klass.match(/keyword-/)
            })
        }).toArray()
    },*/    

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
                    toggleFilterOption(tag, "tags");
                });
                list.append(li);
            }
        });
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
                toggleFilterOption(contribution.about, "about");
            });
            list.append(li);
        }
    };

    var addTypeToList = function (contribution) {
        var none_yet = jQuery('#discourse-filter .none-yet');
        if (none_yet.length > 0) {
            none_yet.remove();
        }
        
        var list = jQuery('#discourse-filter ul');
        var li = list.find('.discourse-' + MD5.hexdigest(contribution.discourseType));
        if (li.length === 0) {
            li = jQuery('<li />');
            li.text(contribution.discourseType);
            li.addClass("discourse-" + MD5.hexdigest(contribution.discourseType));
            li.click(function() {
                toggleFilterOption(contribution.discourseType, "discourse");
            });
            list.append(li);
        }
    }  ;  

    var addParticipantToList = function (jid) {
        console.log(jid + " joined...");

        var nickname = Strophe.getResourceFromJid(jid);

        var li = jQuery("<li />");
        li.text(nickname);
        li.addClass("participant-"+MD5.hexdigest(nickname));

        jQuery("#participants-filter .none-yet").remove('.none-yet');
        jQuery("#participants-filter ul").append(li);

        jQuery("#participants-filter .filter-list-container")
            .css('overflow-y', 'auto')
            .css('height', '90%');
    };

    var removeParticipantFromList = function (jid) {
        console.log(jid + " left...");

        var nickname = Strophe.getResourceFromJid(jid);

        jQuery("#participants-filter .participant-"+MD5.hexdigest(nickname))
            .hide('fade', 'fast', function () {jQuery(this).remove();});
    };

    // this is kinda sloppy, but it should work
    var toggleFilterOption = function (criteria, keyword) {
        li = jQuery('#' + keyword + '-filter li.' + keyword + '-' + MD5.hexdigest(criteria));
        if (li.is('.selected')) {
            li.removeClass('selected');
            alert('unselected');
            filterBalloons();
        } else {
            li.addClass('selected');
            alert('selected');
            filterBalloons();
        }
    };

    var writeToDB = function (contribution) {
        console.log("Attempting to store contribution in database");

        // Post to mongodb-rest interface to store contribution
        jQuery.ajax({
            type: "POST",
            url: "/mongo/roadshow/contributions/",
            // do a feeble attempt at checking for uniqueness
            data: contribution,
            context: this,
            success: function(data) {
                console.log("Contribution with id '" +contribution.id+ "' posted to database");
            },
            error: function(data) {
                console.warn("Error writing contribution to database. Possible reason: " +data.responseText);
            }
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
    
        connected: function (ev) {
            console.log("Connected...");
            
            for (var p in Sail.app.groupchat.participants) {
                addParticipantToList(p);
            }

            Sail.app.groupchat.addParticipantJoinedHandler(addParticipantToList);
            Sail.app.groupchat.addParticipantLeftHandler(removeParticipantFromList);
        },

        'ui.initialized': function (ev) {
            jQuery('.toolbar')
                //.draggable({handle: '.titlebar'})
                .mousedown(bringDraggableToFront);
        },

        sail: {
            contribution: function (sev) {
                var new_contribution = {
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    discourseType:sev.payload.discourse_type,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                };
                createBalloon(new_contribution);
                addTagToList(new_contribution);
                addAboutToList(new_contribution);                
                addTypeToList(new_contribution);
                //writeToDB(new_contribution, culumativeTagArray);
            }
        }
    };

    return self;
})();