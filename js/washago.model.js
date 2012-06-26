/*jshint browser: true, devel: true */
/*globals Sail, jQuery, _, Backbone, Washago, MD5 */

/***

To use this code, initializes it with a Sail app object like so:

  Washago.Model(Washago.Wall);

This will add a .model property to Washago.Wall (i.e. Washago.Wall.model).
You must do this after the app has been configured and a run has been selected,
so probably in 'authenticated' or 'connected'.

***/

Washago.Model = (function(app) {
  var model = {};

  function createNecessaryCollections (requiredCollections) {
    jQuery.ajax(app.drowsyURL, {
      type: 'get',
      dataType: 'json',
      success: function (existingCollections) {
        _.each(requiredCollections, function (col) {
          if(!_.include(existingCollections, col)) {
            console.log("Creating collection '"+col+"' under "+app.drowsyURL);
            jQuery.post(app.drowsyURL, {collection: col});
          }
        });
      },
      error: function (err) {
        console.error("Couldn't fetch list of collections from because: ", JSOn.parse(err.responseText));
        throw err.responseText;
      }
    });   
  }
  
  if (!app.run || !app.run.name)
    throw "Cannot init Washago.model because we authenticated without an app.run.name!";

  app.drowsyURL = app.config.mongo.url + "/" + app.run.name;

  var DrowsyModel = Backbone.Model.extend({
    idAttribute: '_id',
    parse: function(data) {
      data._id = data._id.$oid;
      return data;
    },
    initialize: function () {
      if (!this.get(this.idAttribute)) {
        this.set(this.idAttribute, model.generateMongoObjectId());
      }

      if (!this.get('timestamp')) {
        this.set('timestamp', Date());
      }
    }
  });

  var DrowsyCollection = Backbone.Collection.extend({

  });
  
  model.Contribution = DrowsyModel.extend({
    urlRoot: app.drowsyURL + "/contributions"
  });

  model.Contributions = DrowsyCollection.extend({
    model: model.Contribution,
    url: app.drowsyURL + "/contributions"
  });

  createNecessaryCollections([
    'contributions'
  ]);

  // config stuff

  model.Run = DrowsyModel.extend({
    urlRoot: app.config.mongo.url + "/" + app.configDB + "/runs"
  });

  model.Runs = DrowsyCollection.extend({
    model: model.Run,
    url: app.config.mongo.url + "/" + app.configDB + "/runs"
  });

  model.generateMongoObjectId = function () {
    var base = 16; // hex
    var randLength = 13;
    // timeLength is 11
    var time = (new Date().getTime()).toString(base);
    var rand = Math.ceil(Math.random() * (Math.pow(base, randLength)-1)).toString(base);
    return time + (Array(randLength+1).join("0") + rand).slice(-randLength);
  };

  app.model = model;
});