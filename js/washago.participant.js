/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    "use strict";
    var self = {};
    var lastSentContributeID = null;
    var reconstructingTags = false;

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
    
    self.generateID = function(numOfDigits) {
	var chars = "0123456789abcdef";
	var randomstring = '';
	for (var i=0; i< numOfDigits; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
                if (i === 0) {
                    if (rnum === 0) {
                        rnum = 1;
                    }
                }
                
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
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
            
            jQuery("#washago-header").html(Sail.app.nickname);
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
                
                ///MIKE:: uncomment if you want to check the tags length!!
                /*if (myTags.length === 0) {
                    jQuery.mobile.showToast("You must select at least ONE tag!",false, 4000, true);
                    return;
                }*/
                
                if (myText.length < 4) {
                    jQuery.mobile.showToast("You must enter in at least 4 characters in the text field!",false, 4000, true);
                    return;
                }
                
                lastSentContributeID = self.generateID(12*2);// Math.floor((Math.random() * Math.pow(36,16))).toString(16);
                
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
                
                //if (reconstructingTags) return;
                
                var oldID = lastSentContributeID;
                // my payload so show the user confirmation
                if (sev.payload.id === lastSentContributeID) {
                    reconstructingTags = true;
                    console.log('my contribution event occured!');
                    jQuery.mobile.showToast("Your contribution was sent!",false, 3000, false, function(){console.log("toast end"); });
                    //alert("Tags Saved!");
                    
                    self.resetParticipantForm();
                }
                //else { // someone else is contributing update the tags inline
                    reconstructingTags = true;
                    self.updateTags(sev.payload.tags, oldID);
                    reconstructingTags = false;
                //}     
            }
            
        }
    };
    
    self.resetParticipantForm = function() {
        
        // reset the lasy sent contribution ID
        lastSentContributeID = null;
        
        // set the default contribution type to comment
        jQuery('input[name="radioType"]:nth(1)').attr('checked', false).checkboxradio("refresh");
        jQuery('input[name="radioType"]:nth(0)').attr('checked', true).checkboxradio("refresh");
        jQuery("#text-contribution").val('');
        
        self.refreshLocations();
        self.refreshTags(false);
    };
    
    self.refreshTags = function (doRefreshOnly) {
        
        
        if ( 0 && ! doRefreshOnly) {
            // remove the old tags
            jQuery(".tag-class").each(function() {jQuery(this).fadeOut(250, function() {jQuery(this).remove();});});
        }
        else {
            jQuery(".tag-class").fadeIn(250);
        }
        
        // remove the custom/selected tags
        jQuery('.tag_button').each(function() {jQuery(this).remove();});
        
        // get the tags from MongoDB
        self.getTags();
    };
    
    // perform a refresh of the options - used when resetting the form (doesn't do much now but later can be extended to automagically update locations)
    self.refreshLocations = function() {
        jQuery(".location-option-class").each(function() {jQuery(this).remove();});
        self.getLocations();
    };
    
    // set the poster X drop down menu options from getLocations
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
    
    // check to see if the tag is in the set of prefilled or custom tags
    self.inTagStack = function(tag) {
        
        var isTagFound = 0;
        tag = jQuery.trim(tag);
        jQuery.each(jQuery(".tag-value"),  function(index, value) {
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
    
    // provides dyamic adding of tags coming from events while user is on the form 
    self.updateTags = function(newTagsDataStructure, tagClassID) {
        var availableTags = jQuery('#tag-list-heading');
        var tagStr = '';
        var updatedTags = 0;
        var tagCount = parseInt(jQuery('#tag-count').text(), 10);
        var i = 0;
        
        // grab current tags and stuff them into an array
        jQuery.each(newTagsDataStructure,  function(index, value) {
            var val = jQuery.trim(value);
            var tagFound = self.inTagStack(val);
            
            if (tagFound === 0) { // tag not in stack so insert it
                var uniqueClassID = tagClassID + '_' + i;
                tagStr = '<li class="tag-class" tag_id="' + val + '" data-theme="c" data-iconpos="right" data-iconshadow="true" data-icon="plus"><a class="tag-class-href ' + uniqueClassID + '" href="#page1"><span class="tag-value">' + val + '</span><span class="tag-counter ui-li-count ui-btn-up-c ui-btn-corner-all">1</span></a></li>';
                updatedTags++;
                availableTags.after(tagStr);
                self.initTagClick(jQuery('#tag-list li a.' + uniqueClassID));
            }
            else if (tagFound === 1 || tagFound === 3) { // tag exists in the stack so update the count
                var currentCountObject = jQuery('[tag_id="' + val + '"]').find("a span.tag-counter");
                jQuery(currentCountObject).text(parseInt(jQuery(currentCountObject).text(), 10) + 1);
            }
            
            i++;
            
        });
        
        if (newTagsDataStructure.length > 0) {
            self.sortTags();
            jQuery('#tag-count').text(tagCount + updatedTags);
        }
        
        jQuery(".tag-class").fadeIn(250);
    };
    
    self.sortTags = function() {
         jQuery('.tag-class').sort(function (a,b) { 
                return jQuery(a).attr("tag_id") > jQuery(b).attr("tag_id") ? 1 : -1;
            }).insertAfter(jQuery('#tag-list-heading'));
        
            jQuery('#tag-list').listview('refresh');
    };
    
    // get the tags from the MongoDB server and add them to the tag stack
    self.getTags = function() {
        
        var dataStr ='{"tags":["addage", "collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
        var tagDepotURI = '/mongo/roadshow/contributions/_find?batch_size=10000000000' + ((Sail.app.run)?'&criteria={"run":"' + Sail.app.run.name+ '"}':'');
        
        
        var jqxhr = jQuery.get(tagDepotURI)
                    .success(function(data) {
                        console.log("grabbing tags for mongoDB");
                        var availableTags = jQuery("#tag-list-heading");
                        var dataTags = {};
                        var tagStr = '';
                        var i = 0;
                        
                        if (data.ok !== 1) { console.log('Problem getting DB Data'); return; }
                        
                        // go through json object returned by GET DB Query and grab the tags
                        jQuery.each(data.results, function(index, value) {
                             if (! value.tags) return;
                             jQuery.each(value.tags, function(i, v) {
                                v = jQuery.trim(v);
                                //alert(v);
                                if (dataTags[v] > 0) {
                                    dataTags[v] += 1;
                                }
                                else {
                                    dataTags[v] = 1;
                                }
                             });
                        });
                        
                       
                        jQuery.each(dataTags, function(index, value) { 
                            //alert(index + ':' + value);
                            var tagName = index;
                            var tagFound = self.inTagStack(tagName);
                            var uniqueClassID = 'original_tag_stack_item_' + i;
                            var tagStr = '';
                            
                            if (tagFound === 0) {
                                // adds the tags in the stack
                               tagStr = '<li class="tag-class original-tag-stack" tag_id="' + tagName + '" data-theme="c" data-iconpos="right" data-iconshadow="true" data-icon="plus"><a class="tag-class-href ' + uniqueClassID + '" href="#page1"><span class="tag-value">' + tagName + '</span><span class="tag-counter ui-li-count ui-btn-up-c ui-btn-corner-all">' + value + '</span></a></li>';
                                availableTags.after(tagStr);
                                //alert(tagStr)
                                self.initTagClick(jQuery('#tag-list li a.' + uniqueClassID));
                            }
                            
                            i++;
                        });
        
                        
                        
                        self.sortTags();
                        jQuery('#tag-count').text(i);
                        jQuery(".tag-class").fadeIn(250);
                        
                        reconstructingTags = false;
                        
                        })
                    .error(function() { console.log("Error grabbing mongoDB data for contributions!"); })
                    .complete(function() { console.log("Done grabbing mongoDB data for contributions!"); });

    };
    
    
    // add the click listener to the tag so that it can add the tag to the selected/custom button stack.
    self.initTagClick = function(obj) {
        var availableTags = jQuery("#tag-list-heading");
        jQuery(obj).click(function(){
            var tagText = jQuery(this).find('span.tag-value').text();
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
    
    // initialize the search field to swallow and create custom selection tag on enter key in the search field
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
       
       // convert the selected tag list to an array in order to send it as Sail event (in the event payload)
       self.tagsToArray = function(){
            var myTags = [];
            
            jQuery.each(jQuery(".tag_button"), function(index, value) { 
                myTags[index] = jQuery.trim(jQuery(value).text().toLowerCase());
            });
            
            return myTags;
       };
    
    return self;
})();


