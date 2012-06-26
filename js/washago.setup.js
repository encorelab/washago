/*jshint browser: true, devel: true */
/*globals Sail, jQuery */
var Washago = window.Washago || {};
/*

var radioTypeArray = [
        {"typeName": "Question", "toolTip": "Some Question tooltip"},
        {"typeName": "Comment", "toolTip": "Some Comment tooltip"}
    ];
    
    locationsArray ='{"locations":["Poster 1", "Poster 2", "Poster 3", "Poster 4", "Poster 5", "Poster 6", "Poster 7", "Poster 8"]}';
    
    var dataStr ='{"tags":["addage", "collaboration", "embedded", "tablets", "bugs", "batman", "mobile", "science", "knowledge building","knowledge community", "inquiry"]}';
*/
Washago.Setup = (function() {
    "use strict";
    var self = {};
    var configDBName = 'roadshow_config';
    var configCollectionName = 'runs';
    var runCollectionName = 'contributions';

    self.init = function () {
        Sail.app.groupchatRoom = 'washago@conference.' + Sail.app.xmppDomain;

        // TODO: move this out to config.json
        Sail.app.username = "roadshow";
        Sail.app.password = "roadshow";

        Sail.modules
            .load('Strophe.AutoConnector', {mode: 'pseudo-anon'})
            .load('AuthStatusWidget')
            .thenRun(function () {
                Sail.autobindEvents(Washago.Setup);
                jQuery(Sail.app).trigger('initialized');
                return true;
            });
    };

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
        self.getExistingRuns();
        
        jQuery("#saveRun").click(function(){
            self.checkRun();
        });
        
        jQuery('input[name="runSelector"]').change(function(){
           var runName = jQuery('input[name="runSelector"]:checked').val();
            if (runName === '0') {
                jQuery("#manualRun").fadeIn('fast');
            }
            else {
                jQuery("#manualRun").fadeOut('fast');
            }
            });
        
            // text input listeners
            self.initTextInsert('locationName', self.addLocation);
            self.initTextInsert('tagName', function(str){});
            
    };
    
    
    self.addLocation = function(locationName) {
        var lName = self.stripifyString(locationName);
        jQuery('#locationParent').append('<a data-icon="delete" data-iconpos="right" href="#" name="' + lName  + '" id="' + lName  + '" button_value="'+  locationName + '" class="locations">'+  locationName + '</a>');
        
        jQuery('#' + lName).button();
        
    };
    
    self.checkRun = function(){
        var runName = jQuery('input[name="runSelector"]:checked').val();
        var manualRunName = jQuery('#runName').val();
        
        if (runName === '0') {
            if (manualRunName.length < 3){
               // show error for run name being shorter then 2 chars
               jQuery.mobile.showToast("You must enter in at least 3 characters for your Run Name!",false, 4000, true);
               return;
            }
            jQuery.mobile.changePage("#page_config_locations", {transition: 'slidefade'});
            manualRunName = self.stripifyString(manualRunName);
            alert(manualRunName);
        }
    };
    
    self.stripifyString = function(str) {
        str = str.toLowerCase().replace(/[\W]/g,"_");
        str = str.replace(/_+/g,"_");
        return str;
    };
    
    self.createRun = function(runName){
        
    };
    
    self.getExistingRuns = function() {
         var dbListURI = self.config.mongo.url;
        
        
        var jqxhr = jQuery.get(dbListURI)
                    .success(function(data) {
                        console.log("grabbing Db's from mongoDB");
                        
                        if (data.length === 0) { console.log('Problem getting DB Data'); return; }
                        var primaryConfigDBFound = false;
                        
                        // go through json object returned by GET DB Query and grab the tags
                        jQuery.each(data, function(index, value) {
                             var dbName = data[index];
                             
                             if (dbName === configDBName) {
                                primaryConfigDBFound = true;
                             }
                        });
                        
                        
                        // create the config database
                        if (primaryConfigDBFound === false) {
                            console.log('Config DB not found! Creating Config DB: ' + configDBName);
                            jQuery.post(dbListURI,  {db: configDBName})
                            .success(function(data){ console.log('Config DB created! Creating Collection: ' + configCollectionName);
                                     jQuery.post(dbListURI + '/' + configDBName, {collection: configCollectionName})
                                     .success(function(){ console.log('Created collection: ' + configCollectionName); })
                                     .error(function(){ console.log('Error creating collection: ' + configCollectionName); })
                                     })
                            .error(function(data){console.log('Error creating Config DB: ' + configDBName);})
                            .complete(function(){}); 
                        }
                        else { // the db is found grab the runs
                            console.log('Config DB found! Looking up runs... ');
                            jQuery.get(dbListURI + '/' + configDBName + '/' + configCollectionName)
                                .success(function(data) {
                                    jQuery.each(function(index,value){
                                       var runName = data[index]['run'];
                                    } )
                                })
                                .error(function(){})
                                .complete(function(){
                                    console.log('Run gather completed - Runs has ' + data.length + ' items.');
                                    });
                        }
                        
                        })
                    .error(function() { console.log("Error grabbing mongoDB DB's"); })
                    .complete(function() { console.log("Done grabbing mongoDB DB's!"); });

    };
    
    
    

    self.events = {
        initialized: function(ev) {
            Washago.Setup.authenticate();
        },
    
        connected: function(ev) {
            console.log("Connected...");

            Sail.app.groupchat.addParticipantJoinedHandler(function(who, stanza) {
                console.log(who + " joined...");
            });
            
            jQuery(".washago-header").html(Sail.app.nickname);

        },

        'ui.initialized': function(ev) {
            console.log("UI initialized, doing bindings...");
            
            // binding for submit button - TODO: all of the sev hashes need to be dynamically filled with jQuery etc.
            jQuery(".submit-button").click(function () {
                var myText = jQuery.trim(jQuery("#text-contribution").val());
                var myLocation = jQuery("#select-location").val();
                var myTags = null;
                 
                
                if (myLocation.length < 2) {
                    jQuery.mobile.showToast("Please choose a location!",false, 4000, true);
                    return;
                }
                
                if (myText.length < 4) {
                    jQuery.mobile.showToast("You must enter in at least 4 characters in the text field!",false, 4000, true);
                    return;
                }
                
                // done checking base error case - now grab the tags
                myTags = self.tagsToArray();
                
                ///MIKE:: uncomment if you want to check the tags length!!
                /*if (myTags.length === 0) {
                    jQuery.mobile.showToast("You must select at least ONE tag!",false, 4000, true);
                    return;
                }*/
                
                
                lastSentContributeID = generateID();// Math.floor((Math.random() * Math.pow(36,16))).toString(16);
                
                var sev = new Sail.Event('contribution', {
                    author: Sail.app.nickname,
                    text:myText,
                    tags:myTags,
                    id: lastSentContributeID,
                    about: myLocation,
                    discourse: jQuery('input[name="radioType"]:checked').val().toLowerCase()
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
                    discourse: jQuery('input[name="radioType"]:checked').val().toLowerCase()

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


        }
    };

    
    
    self.sortTags = function() {
         jQuery('.tag-class').sort(function (a,b) { 
                return jQuery(a).attr("tag_id") > jQuery(b).attr("tag_id") ? 1 : -1;
            }).insertAfter(jQuery('#tag-list-heading'));
        
            jQuery('#tag-list').listview('refresh');
            jQuery('#tag-count').text(parseInt(jQuery('.tag-class').size(),10));
    };
    
    
    // initialize the search field to swallow and create custom selection tag on enter key in the search field
    self.initTextInsert = function(textID, callbackFunc) {
       jQuery('#' + textID).keyup(function(e){
            var searchValue = jQuery.trim(jQuery(this).val());
            
            if (e.which === 13) {
               if (searchValue.length > 0 && callbackFunc) {
                    callbackFunc(searchValue);
                    jQuery(this).val('');
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


