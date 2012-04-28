/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    "use strict";
    var self = {};
    var lastSentContributeID = null;

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
                    jQuery.mobile.showToast("You must select at least ONE tag!",false, 4000, true);
                    return;
                }
                
                if (myText.length < 4) {
                    jQuery.mobile.showToast("You must enter in at least 4 characters in the text field!",false, 4000, true);
                    return;
                }
                
                lastSentContributeID = Math.floor((Math.random() * 1e50)).toString(36);
                
                var sev = new Sail.Event('contribution', {
                    author: Sail.app.nickname,
                    text:myText,
                    tags:myTags,
                    id: lastSentContributeID,
                    about: jQuery("#select-location").val(),
                    discourse_type: jQuery('input[name="radioType"]:checked').val()
                });
                Sail.app.groupchat.sendEvent(sev);
                
                 
            });
        },
        
        sail: {
            contribution: function(sev) {
                
                 if (sev.payload.id === lastSentContributeID) {
                    console.log('my contribution event occured!');
                    jQuery.mobile.showToast("Tags Saved!",false, 3000, false, function(){console.log("toast end"); });
                    //alert("Tags Saved!");
                    self.resetParticipantForm();
                 }
            }
            
        }
    };
    
    self.resetParticipantForm = function() {
        lastSentContributeID = null;
        //Query('#radioType').val('comment');
        jQuery('input[name="radioType"]:nth(1)').attr('checked', false).checkboxradio("refresh");
        jQuery('input[name="radioType"]:nth(0)').attr('checked', true).checkboxradio("refresh");
        jQuery("#text-contribution").val('');
        
        self.refreshLocations();
        self.refreshTags();
    };
    
    self.refreshTags = function () {
        jQuery(".tag-class").each(function() {jQuery(this).remove();});
        jQuery('.tag_button').each(function() {jQuery(this).remove();});
        self.getTags();
    };
    
    self.refreshLocations = function() {
        jQuery(".location-option-class").each(function() {jQuery(this).remove();});
        self.getLocations();
    };

    self.getLocations = function() {
        
        var dataStr ='{"tags":["Poster 1", "Poster 2", "Poster 3", "Poster 4", "Poster 5", "Poster 6", "Poster 7", "Poster 8"]}';
        var data = jQuery.parseJSON(dataStr);
        var firstOption = true;
        //jQuery.post();
        var availableLocations = jQuery("#select-location");
        jQuery.each(data.tags, function(index, value) { 
            //alert(index + ': ' + value);
            availableLocations.append('<option class="location-option-class" value="' + value + '"' + ((firstOption)?'selected="selected"':'') + '>' + value + '</option>');
            firstOption = false;
        });
        
        jQuery(availableLocations).selectmenu('refresh', true);
        
    };
    
    self.inTagStack = function(tag) {
        
        var isTagFound = 0;
        tag = jQuery.trim(tag);
        jQuery.each(jQuery(".tag-class-href"),  function(index, value) {
                var tagVal = jQuery.trim(jQuery(value).text());
                
                if (tagVal === tag) {
                    //alert('yo stack same');
                    isTagFound = 1;
                }
            });
        
        
        jQuery.each(jQuery(".tag_button"),  function(index, value) {
                var tagVal = jQuery.trim(jQuery(value).text());
                
                if (tagVal === tag) {
                    //alert('yo button same');
                    isTagFound += 2;
                }
            });
        
        return isTagFound;
    };
    
    self.getTags = function() {
        
        var dataStr ='{"tags":["collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
        var data = jQuery.parseJSON(dataStr);
        //jQuery.post(); 
        var availableTags = jQuery("#tag-list-heading");
        jQuery.each(data.tags, function(index, value) { 
            //alert(index + ': ' + value);
            value = jQuery.trim(value);
            if (self.inTagStack(value) === 0) {
                availableTags.after('<li class="tag-class" tag_id="' + value + '" data-theme="c" data-iconpos="right" data-iconshadow="true" data-icon="plus"><a class="tag-class-href" href="#page1">' + value + '<span class="ui-li-count ui-btn-up-c ui-btn-corner-all">1</span></a></li>');
            }
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
       jQuery("div.ui-input-search").live("keyup", function(e){
            var searchValueObj = jQuery('input[data-type="search"]');
            var searchValue = jQuery.trim(jQuery(searchValueObj).val().toLowerCase());
            var searchMatchFound = self.inTagStack(searchValue);
            
            if (e.which === 13 && searchMatchFound >= 2) {
                jQuery.mobile.showToast("You already used this tag...",false, 3000, true);
            }
            else if (e.which === 13 && searchMatchFound <= 1) {
                e.preventDefault();
                if (searchValue.length === 0) { return; }
                
                var tagButton = '<a href="#" class="tag_button" data-role="button" data-icon="delete" >' + searchValue +'</a>';
                jQuery('#chosen-tags').append( tagButton );
                jQuery('.tag_button').button();
                jQuery('.tag_button').click(function(){
                    jQuery(this).fadeOut(250, function() {
                        var valText = jQuery.trim(jQuery(this).text());
                        var tagStack = jQuery('[tag_id="' + valText + '"]');
                        
                        if (tagStack) {
                            jQuery(tagStack).fadeIn(250);
                        }
                            
                        jQuery(this).remove();
                    });
                    console.log('remove');
                });
                jQuery('.tag_button').buttonMarkup({inline: "true"});
                jQuery(searchValueObj).val('');
                jQuery(searchValueObj).trigger("change");   
            
                if (searchMatchFound) {
                    jQuery('[tag_id="' + searchValue + '"]').fadeOut(250);
                }
            }
            
            //alert(e.which);
            
           
            
        });
       };
       
       self.tagsToArray = function(){
            var myTags = [];
            
            jQuery.each(jQuery(".tag_button"), function(index, value) { 
                myTags[index] = jQuery(value).text().toLowerCase();
            });
            
            return myTags;
       };
    
    return self;
})();


