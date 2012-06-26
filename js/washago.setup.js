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
    var DBPrefix = 'roadshow_';
    var configDBName = DBPrefix + 'config';
    var configCollectionName = 'runs';
    var runData = {};

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
    
    self.typesToArray = function() {
        var typeArray = [];
        
        
        jQuery.each(jQuery('.types'), function(index, value) { 
                var typeObject = {};
                typeObject['typeName'] = jQuery(value).attr('type_value');
                typeObject['toolTip'] = jQuery(value).attr('type_tooltip');
                //alert(typeObject['typeName'] + " | " + typeObject['toolTip']);
                
                typeArray[index] = typeObject;
            });
        
        return typeArray;
    };
    
    self.saveConfigRun = function() {
        var payload = {};
        var runName = self.getCurrentRunName();
        var collectionID = '';
        var collectionStr = '';
        
        if (runName === false){
            jQuery.mobile.showToast("You must enter in at least 1 character for your Run Name! Please go back to step 1...",false, 4000, true);
            return;
        }
        
        // construct the payload
        payload["name"] = runName;
        payload["locations"] = self.tagsToArray('locations');
        payload["tags"] = self.tagsToArray('tags');
        payload["types"] = self.typesToArray();
        
        
        // save the collection
        
        if (collectionID.length > 2) {
            console.log('Saving Existing Collection ID: ' + collectionID);
            collectionStr = '/' + collectionID;
        }
        else {
            console.log('Saving new collection!');
        }
        
        console.log(payload);
        var dbURI = self.config.mongo.url + '/' + configDBName + '/' + configCollectionName + collectionStr;
        
        console.log('Posting to ' + dbURI);
        
        jQuery.post(dbURI, payload)
            .success(function(data) {
               console.log('Collection payload saved successfully!');
               jQuery.mobile.showToast("Your configuration for this Run has been saved!",false, 3000, false, function(){console.log("toast end"); });
            })
            .error(function(){
                console.log('Collection payload save failure!');
                jQuery.mobile.showToast("An Error occured while trying to save your Run Configuration!",false, 4000, true);
                })
            .complete(function(){
                console.log('');
                });
        
    };
    
    // checks
    
    self.checkRun = function(){
        var runName = jQuery('input[name="runSelector"]:checked').val();
        var manualRunName = jQuery('#runName').val();
        
        if (runName === '0') {
            if (manualRunName.length < 1){
               // show error for run name being shorter then 2 chars
               jQuery.mobile.showToast("You must enter in at least 1 character for your Run Name!",false, 4000, true);
               return;
            }
            jQuery.mobile.changePage("#page_config_locations", {transition: 'slidefade'});
        }
        
    };
    
    self.checkLocations = function() {
        var locationsCount = jQuery(".locations").length;
        
        if (locationsCount == 0) {
             jQuery.mobile.showToast("You must enter in at least 1 Location!",false, 4000, true);
            return;
        }
        
        jQuery.mobile.changePage("#page_config_preset_tags", {transition: 'slidefade'});
    };
    
    self.checkTags = function() {    
        jQuery.mobile.changePage("#page_config_types", {transition: 'slidefade'});
    };
    
    self.checkTypes = function() {
        var typeCount = jQuery(".types").length;
        
        if (typeCount < 2) {
            jQuery.mobile.showToast("You must enter in at least 2 Types!",false, 4000, true);
            return;
        }
        
        self.saveConfigRun();
    };

    self.authenticate = function () {
        jQuery(self).trigger('authenticated');
        self.getExistingRuns();
        
        jQuery("#saveRun").click(self.checkRun);
        jQuery("#saveLocations").click(self.checkLocations);
        jQuery("#saveTags").click(self.checkTags);
        jQuery('#saveTypes').click(self.checkTypes);
        
        
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
            
            // for locations
            self.initTextInsert('locationName', 'locations', self.addLocation);
            
            // for tags
            self.initTextInsert('tagName', 'tags', self.addCustomTags);
            
            // for types
            //self.initTextInsert('typeName', 'types', self.addTypes);
            self.tooltipInit('typeName');
            self.tooltipInit('typeTooltip');
            
            
    };
    
    self.tooltipInit = function(tooltipID) {
        jQuery('#' + tooltipID).keyup(function(e){
                var searchValue = jQuery.trim(jQuery('#typeName').val());
            
                if (e.which === 13) {
                   var termExists = jQuery("#" + searchValue).attr('id') === searchValue;
                   
                   if ((searchValue.length > 0 &&  ! termExists)) {
                        self.addTypes(searchValue);
                        jQuery('#typeName').val('');
                   }
                   else if (searchValue.length > 0 && termExists) {
                        jQuery.mobile.showToast('The ' + searchValue + " type already exists!",false, 4000, true);
                   }
                   else if (searchValue.length === 0) {
                        jQuery.mobile.showToast("Enter a type value before saving!",false, 4000, true);
                   }
                }
            }
            );
    };
    
    self.addLocation = function(val) {
        self.addTag(val, 'locationParent', 'locations');
    };
    
    self.addCustomTags = function(val) {
        self.addTag(val, 'tagParent', 'tags');
    };
    
    self.addTypes = function(typeVal) {
        var typeName = self.stripifyString(typeVal);
        var typeTooltip = jQuery.trim(jQuery('#typeTooltip').val());
        jQuery('#typeTooltip').val('');
        
        jQuery('#typeParent').append('<a data-icon="delete" type_value="' + typeVal + '" type_tooltip="' + typeTooltip  + '" data-iconpos="right" href="#" name="' + typeName  + '" id="' + typeName  + '" button_value="'+  typeVal + '" class="types">'+  typeVal + ' (Tooltip: &quot;' + typeTooltip + '&quot;)</a>');
        jQuery('#' + typeName).button();
        jQuery('#' + typeName).click(function(){jQuery(this).fadeOut('slow', function(){ jQuery(this).remove(); })});
    };
    
    
    self.addTag = function(tagName, parentID, classID, extraArgs) {
        var tName = self.stripifyString(tagName);
        jQuery('#' + parentID).append('<a data-icon="delete" ' + ((extraArgs)?extraArgs:'') + ' data-iconpos="right" href="#" name="' + tName  + '" id="' + tName  + '" button_value="'+  tagName + '" class="' + classID + '">'+  tagName + '</a>');
        jQuery('#' + tName).button();
        jQuery('#' + tName).click(function(){jQuery(this).fadeOut('slow', function(){ jQuery(this).remove(); })});
    };


    self.getCurrentRunName = function() {
        var runNameID = jQuery('input[name="runSelector"]:checked').val();
        var manualRunName = jQuery('#runName').val();
        var runName = '';
        
        if (runNameID === '0' && manualRunName.length > 0) {
            runName = DBPrefix + self.stripifyString(manualRunName);
        }
        else if (runNameID === '0' && manualRunName.length == 0) {
            return false;
        }
        else {
            // grab the run name from the existing label
        }
        
        return runName;
    };
    
    
    self.stripifyString = function(str) {
        str = str.toLowerCase().replace(/[\W]/g,"_");
        str = str.replace(/_+/g,"_");
        return str;
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
                                    jQuery.each(data, function(index,value){
                                       
                                       var collectionID = value['_id']['$oid'];
                                       var runName = value['name'];
                                    
                                       runData[runName] = {};
                                       runData[runName]['collectionID'] = collectionID;
                                       runData[runName]['locations'] = value['locations'];
                                       runData[runName]['tags'] = value['tags'];
                                       runData[runName]['types'] = value['types'];
                                       
                                       console.log(runData);
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
        }
    };

    
    
    self.sortTags = function() {
         jQuery('.tag-class').sort(function (a,b) { 
                return jQuery(a).attr("tag_id") > jQuery(b).attr("tag_id") ? 1 : -1;
            }).insertAfter(jQuery('#tag-list-heading'));
        
            jQuery('#tag-list').listview('refresh');
            jQuery('#tag-count').text(parseInt(jQuery('.tag-class').size(),10));
    };
    
    
    // check to see if the tag is in the set of prefilled or custom tags
    self.tagExists = function(val, classID) {
        
        var isTagFound = false;
        var tag = jQuery.trim(val).toLowerCase();
        
        jQuery.each(jQuery("." + classID),  function(index, value) {
                var tagVal = jQuery.trim(jQuery(value).text()).toLowerCase();
                
                if (tagVal === tag) {
                    //alert('yo tag same');
                    isTagFound = true;
                }
            });
        
        return isTagFound;
    };
    
    // initialize the search field to swallow and create custom selection tag on enter key in the search field
    self.initTextInsert = function(textID, itemsContainerClassID, callbackFunc, bypassChecks) {
       jQuery('#' + textID).keyup(function(e){
            var searchValue = jQuery.trim(jQuery(this).val());
            
            if (e.which === 13) {
               var termExists = self.tagExists(searchValue, itemsContainerClassID);
               
               if ((searchValue.length > 0 &&  ! termExists && callbackFunc) || bypassChecks === true) {
                    callbackFunc(searchValue);
                    jQuery(this).val('');
               }
               else if (searchValue.length > 0 && termExists) {
                    jQuery.mobile.showToast(searchValue + " already exists!",false, 4000, true);
               }
            }

            
            //alert(e.which);

        });
       };
       
       // convert the selected tag list to an array in order to send it as Sail event (in the event payload)
       self.tagsToArray = function(classID){
            var myTags = [];
            
            jQuery.each(jQuery('.' + classID), function(index, value) { 
                myTags[index] = jQuery.trim(jQuery(value).text().toLowerCase());
            });
            
                
            return myTags;
       };
    
    return self;
})();


