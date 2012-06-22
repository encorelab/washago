/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};

Washago.Participant = (function() {
    "use strict";
    var self = {};
    var lastSentContributeID = null;
    var reconstructingTags = false;
    var radioTypeArray = [
        {"typeName": "Question", "toolTip": "Some Question tooltip"},
        {"typeName": "Comment", "toolTip": "Some Comment tooltip"}
    ];
    var locationsArray = [];

    var currentLocation = ''; // ANTO: used only in function loadContributions()

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
    
    var generateID = function(numOfDigits) {
        var base = 16;
        return Math.ceil(Math.random() * (Math.pow(base, numOfDigits)-1)).toString(base);

    	/*var chars = "0123456789abcdef";
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
    	return randomstring;*/
    };

    var addContribution = function(contribution){
        //console.log(contribution.tags);
        var c = jQuery('<div class="contribution-element"></div>');
        var author = jQuery('<div class="author">'+contribution.author+'</div>');
        var text = jQuery('<div class="'+contribution.discourse+'">'+contribution.text+'</div>');
        var tags = jQuery('<div class="tags"></div>');
        _.each(contribution.tags, function(tag){
                var tagElem = jQuery('<span class="tag">'+tag+'</span>');
                jQuery(tags).append(tagElem)
        });
        jQuery(c).append(author);
        jQuery(c).append(text);
        jQuery(c).append(tags);

        // Build here jquery mobile UI li. Add some classes and so...
        var elemMov = jQuery('<li></li>');
        jQuery(elemMov).append(c);

        jQuery('#community-contribution').prepend(elemMov);
        //console.log(c.html());

        // only now show
        //jQuery('#community-contribution').fadeIn('slow');

    };


    // ANTO testing on http://drowsy.badger.encorelab.org/washago-test/contributions
    /*
        Populates the contributions container in the tablet/phone
        It should be every time a poster is selected
    */
    var loadContributions = function() {

        // empty #community-contribution when loaded for the first time of when changing location

        jQuery('#community-contribution').hide();
        jQuery('#community-contribution').html('');
        jQuery('#contributions-title').hide();
        
        currentLocation = jQuery("#select-location").val();


        /*  ANTO: 
            If we load the config.json and use currentLocation as mongo db name, 
            this should be the way it works ;)
            note we are rollcall-free in this app, so Sail.app.config.mongo.url does not seem to be loaded??????

            jQuery.ajax(Sail.app.config.mongo.url + '/' + currentLocation + '/contributions?selector={"about":"'+currentLocation+'"}', {
        */
        jQuery.ajax('http://drowsy.badger.encorelab.org/washago-test/contributions?selector={"about":"'+currentLocation+'"}', {
           dataType: 'json',
           success: function (data) {
           console.log("loadContributions ok");


            
           if(data.length==0 && jQuery('#p-view').is(':visible')){
                jQuery.mobile.showToast("No contributions so far...", false, 3000, false);
           } else  {
            
                _.each(data, function(obj){
                    addContribution(obj);
                });

                if (jQuery('#p-view').is(':visible')) {
                    jQuery('#contributions-title').show();
                    jQuery('#community-contribution').fadeIn('slow');
                }
           }
           
        },
           error: function (data) {
                console.log("error loadContributions", data);
           }
       });

    };

    /*
        ANTO: addapted this code form Matt's.
        It make sense to me that the client saves the data, not the wall
        let's discuss this!!

        This function is called when the sail event "contribution" is received
    */
    var writeToDB = function (contribution) {
        console.log("Storeing contribution in database");
        
        // ANTO: TODO: we need to get the URL form somewhere else. Hard-coding it for now
        var url = "http://drowsy.badger.encorelab.org/washago-test/contributions";

        jQuery.ajax({
            type: "POST",
            url: url,
            data: contribution,
            success: function(data) {
                console.log("ok writeToDB");
            },
            error: function(data) {
                console.log("Error writeToDB: ", data);
            }
        });
    };

    self.events = {
        initialized: function(ev) {
            Washago.Participant.authenticate();
        },
    
        connected: function(ev) {
            console.log("Connected...");
            //jQuery("#participant-view").fadeIn(250);
            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
                jQuery('#participant-view-add').fadeIn(250);
            });
            
            jQuery(".washago-header").html(Sail.app.nickname);
            self.getLocations();

            self.getTypes();
            self.getTags();
            //self.getTags(); Commenting this until mongo is working ok

            self.initSearch();

        },

        'ui.initialized': function(ev) {
            console.log("UI initialized, doing bindings...");
            
            // binding for submit button - TODO: all of the sev hashes need to be dynamically filled with jQuery etc.
            jQuery(".submit-button").click(function () {
                var myTags = self.tagsToArray();
                var myText = jQuery.trim(jQuery("#text-contribution").val());
                var myLocation = jQuery("#select-location").val();
                 
                
                if (myLocation.length < 2) {
                    jQuery.mobile.showToast("Please choose a location!",false, 4000, true);
                    return;
                }
                
                ///MIKE:: uncomment if you want to check the tags length!!
                /*if (myTags.length === 0) {
                    jQuery.mobile.showToast("You must select at least ONE tag!",false, 4000, true);
                    return;
                }*/
                
                if (myText.length < 4) {
                    jQuery.mobile.showToast("You must enter in at least 4 characters in the text field!",false, 4000, true);
                    return;
                }
                
                lastSentContributeID = generateID(12);// Math.floor((Math.random() * Math.pow(36,16))).toString(16);
                
                var sev = new Sail.Event('contribution', {
                    author: Sail.app.nickname,
                    text:myText,
                    tags:myTags,
                    id: lastSentContributeID,
                    about: myLocation,
                    discourse: jQuery('input[name="radioType"]:checked').val()
                });

                /*
                    ANTO: saving contribution from client
                */
                
                
                // ANTO: keeping the working structure for saving and displaying
                
                var my_contribution = {
                    author: Sail.app.nickname,
                    text:myText,
                    tags:myTags,
                    id: lastSentContributeID,
                    about: jQuery("#select-location").val(),
                    discourse: jQuery('input[name="radioType"]:checked').val()

                    /*
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    discourse:sev.payload.discourse,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                    */
                };
                


                // ANTO: Think this is the right place to save data!!
                writeToDB(my_contribution);
                console.log('My Contribution saved', my_contribution);

                // add contribution to the view
                addContribution(my_contribution);


                Sail.app.groupchat.sendEvent(sev);
                jQuery.mobile.showToast("Sending your contribution...", false)
                 
            });

            jQuery('#select-location').change(function() {
              loadContributions();
              jQuery('#p-view').show();
            });

            jQuery('#p-view-btn').click(function () {
                // loading this here might be too much, but it is safe
                //loadContributions();

                jQuery('#p-add').hide();
                jQuery('#p-view').show();
            });

            jQuery('#p-add-btn').click(function () {
                
                jQuery('#p-view').hide();
                jQuery('#p-add').show();
            });
        },

        sail: {
            contribution: function(sev) {
                
                /*
                    ANTO: saving contribution from the client
                */
                var new_contribution = {
                    author:sev.payload.author,
                    text:sev.payload.text,
                    tags:sev.payload.tags,
                    about:sev.payload.about,
                    discourse:sev.payload.discourse,
                    timestamp:sev.timestamp,
                    id:sev.payload.id
                };
                // ANTO: this is NOT the place to save data!!
                //writeToDB(new_contribution);
                
                // ANTO: add to the client display only if currently in the location of the incoming contribution
                if(currentLocation==new_contribution.about){
                    addContribution(new_contribution)
                }

                //if (reconstructingTags) return;
                
                var oldID = lastSentContributeID;
                // my payload so show the user confirmation
                if (sev.payload.id === lastSentContributeID) {
                    jQuery.mobile.hideToast();
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
        
        var defaultSelectionIndex = 0;
        
        // reset the lasy sent contribution ID
        lastSentContributeID = null;
        
        // set the default contribution type to comment
        jQuery('input[name="radioType"]').attr('checked', false).checkboxradio("refresh");
        
        // select the first 
        jQuery('input[name="radioType"]:nth(' + defaultSelectionIndex + ')').attr('checked', true).checkboxradio("refresh");
        
        jQuery("#text-contribution").val('');
        jQuery("#text-contribution").attr('placeholder', radioTypeArray[defaultSelectionIndex]["toolTip"]);
        
        //self.refreshLocations();
        self.refreshTags(false);
    };
    
    self.getTypes = function() {
        
        var firstOption = true;
        
        jQuery.each(radioTypeArray, function(index, values) {
            var typeName = radioTypeArray[index]["typeName"];
            jQuery('#typeContainer').append('<input name="radioType" id="radioType' + typeName + '" value="' + typeName + '" type="radio" ' + ((firstOption)?'checked="checked"':'') + ' /><label for="radioType' + typeName + '">' + typeName + '</label>');
            firstOption = false;
        });
        jQuery('#parentTypeContainer').trigger( "create" );
        jQuery('input[name="radioType"]').checkboxradio("refresh");
        jQuery("#text-contribution").attr('placeholder', radioTypeArray[0]["toolTip"]);
        
        jQuery('input[name="radioType"]').change(function() {
            var radioButtons = jQuery('input[name="radioType"]');
            var selectedIndex = radioButtons.index(radioButtons.filter(':checked'));
            jQuery("#text-contribution").attr('placeholder', radioTypeArray[selectedIndex]["toolTip"]);
           //alert(jQuery('input[name="radioType"]:checked').val() + " " + selectedIndex);
        });
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
        
        locationsArray ='{"locations":["Poster 1", "Poster 2", "Poster 3", "Poster 4", "Poster 5", "Poster 6", "Poster 7", "Poster 8"]}';
        var data = jQuery.parseJSON(locationsArray);
        var firstOption = true;
        //jQuery.post();
        var availableLocations = jQuery("#select-location");
        jQuery.each(data.locations, function(index, value) { 
            //alert(index + ': ' + value);
            //availableLocations.append('<option class="location-option-class" value="' + value + '"' + ((firstOption)?'selected="selected"':'') + '>' + value + '</option>');
            availableLocations.append('<option class="location-option-class" value="' + value + '">' + value + '</option>');
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
        }
        
        jQuery(".tag-class").fadeIn(250);
    };
    
    self.sortTags = function() {
         jQuery('.tag-class').sort(function (a,b) { 
                return jQuery(a).attr("tag_id") > jQuery(b).attr("tag_id") ? 1 : -1;
            }).insertAfter(jQuery('#tag-list-heading'));
        
            jQuery('#tag-list').listview('refresh');
            jQuery('#tag-count').text(parseInt(jQuery('.tag-class').size(),10) - 1);
    };
    
    // get the tags from the MongoDB server and add them to the tag stack
    self.getTags = function() {
        
        var dataStr ='{"tags":["addage", "collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
        
        // ANTO: note that his does not work in node server and makes it crash
        //var tagDepotURI = '/mongo/roadshow/contributions/_find?batch_size=10000000000' + ((Sail.app.run)?'&criteria={"run":"' + Sail.app.run.name+ '"}':'');
        var tagDepotURI = "http://drowsy.badger.encorelab.org/washago-test/contributions";
        
        
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
                             if (! value.tags) { return; }
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
                        jQuery(".tag-class").fadeIn(250);
                        
                        reconstructingTags = false;
                        
                        })
                    .error(function() { console.log("Error grabbing mongoDB data for contributions!"); })
                    .complete(function() { console.log("Done grabbing mongoDB data for contributions!"); });

    };
    
    
    // add the click listener to the tag so that it can add the tag to the selected/custom button stack.
    self.initTagClick = function(obj) {
        jQuery(obj).unbind('click');
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
            
            var searchValueObj = jQuery('input[data-type="search"]');
            var searchValue = jQuery.trim(jQuery(searchValueObj).val().toLowerCase());
            
            if (searchValue.length > 1) {
                myTags[myTags.length] = searchValue;
                jQuery(searchValueObj).val('');
                jQuery(searchValueObj).trigger("change");
            }
                
            return myTags;
       };
    
    return self;
})();


