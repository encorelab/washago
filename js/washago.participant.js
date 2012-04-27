/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    "use strict";
    var self = {};

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        // TODO: move this out to config.json
        Sail.app.username = "roadshow";
        Sail.app.password = "roadshow";

        Sail.modules
            .load('Strophe.AutoConnector', {mode: 'pseudo-anon'})
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
            
            self.getLocations();
            self.getTags();
            self.initSearch();
        },

        'ui.initialized': function(ev) {
            console.log("UI initialized, doing bindings...");
            
            // binding for submit button - TODO: all of the sev hashes need to be dynamically filled with jQuery etc.
            jQuery(".submit-button").click(function () {
                var myTags = self.tagsToArray();
                var myText = jQuery.trim(jQuery("#text-contribution").val());
                
                if (myTags.length === 0) {
                    alert('Tag Length 0');
                    return;
                }
                
                if (myText.length < 4) {
                    alert('Text Length 0');
                    return;
                }
                
                var sev = new Sail.Event('contribution', {
                    author: Sail.app.nickname,
                    text:myText,
                    tags:myTags,
                    id: Math.floor((Math.random() * 1e50)).toString(36),
                    about: jQuery("#select-location").val(),
                    discourse_type: jQuery('#radioType').val()
                });
                Sail.app.groupchat.sendEvent(sev);
            });
        }
    };
    
    self.showDialog = function(header, content) {
        
    };

    self.getLocations = function() {
        
        var dataStr ='{"tags":["Poster 1", "Poster 2", "Poster 3", "Poster 4", "Poster 5", "Poster 6", "Poster 7", "Poster 8"]}';
        var data = jQuery.parseJSON(dataStr);
        var firstOption = true;
        //jQuery.post();
        var availableLocations = jQuery("#select-location");
        jQuery.each(data.tags, function(index, value) { 
            //alert(index + ': ' + value);
            availableLocations.append('<option value="' + value + '"' + ((firstOption)?'selected="selected"':'') + '>' + value + '</option>')
            firstOption = false;
        });
        
        jQuery(availableLocations).selectmenu('refresh', true);
        
    };
    
    self.getTags = function() {
        
        var dataStr ='{"tags":["collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
        var data = jQuery.parseJSON(dataStr);
        //jQuery.post();
        var availableTags = jQuery("#tag-list-heading");
        jQuery.each(data.tags, function(index, value) { 
            //alert(index + ': ' + value);
            availableTags.after('<li tag_id="' + value + '" data-theme="c"><a href="#page1">' + value + '</a></li>')
        });
        
        jQuery('#tag-list').listview('refresh');
        
         self.initTagClick(jQuery('#tag-list li a'));
        
    };
    self.initTagClick = function(obj) {
        var availableTags = jQuery("#tag-list-heading");
        jQuery(obj).click(function(){
            var tagText = jQuery(this).text();
            var tagButton = '<a href="#" class="tag_button" data-role="button" data-icon="delete" >' + tagText +'</a>';
            jQuery('#chosen-tags').append( tagButton );
            jQuery(this).parent().parent().parent().fadeOut(250);
            jQuery('.tag_button').button();
            jQuery('.tag_button').click(function(){
                jQuery(this).fadeOut(250, function() { jQuery('[tag_id="' + tagText + '"]').fadeIn(250); jQuery(this).remove(); jQuery('#tag-list').listview('refresh');});
                console.log('remove');
            });
            jQuery('.tag_button').buttonMarkup({inline: "true"});
        });
    };
    
    self.initSearch = function() {
       $("div.ui-input-search").live("keyup", function(e){
            if (e.which == 13) {
                e.preventDefault();
                var searchValueObj = jQuery('input[data-type="search"]');
                var searchValue = jQuery(searchValueObj).val();
                var tagButton = '<a href="#" class="tag_button" data-role="button" data-icon="delete" >' + searchValue +'</a>';
                jQuery('#chosen-tags').append( tagButton );
                jQuery('.tag_button').button();
                jQuery('.tag_button').click(function(){
                    jQuery(this).fadeOut(250, function() {  jQuery(this).remove(); });
                    console.log('remove');
                });
                jQuery('.tag_button').buttonMarkup({inline: "true"});
                jQuery(searchValueObj).val('');
                jQuery(searchValueObj).trigger("change");
                
            }
            //alert(e.which);
            
           
            
        });
       
       self.tagsToArray = function(){
            var myTags = new Array();
            
            jQuery.each(jQuery(".tag_button"), function(index, value) { 
                myTags[index] = jQuery(value).text();
            });
            
            return myTags;
       }
    };
    
    return self;
})();