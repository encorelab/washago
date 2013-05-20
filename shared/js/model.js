(function() {
  "use strict";

  var Backbone, Washago, Drowsy, jQuery, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty;

  if (typeof exports !== "undefined" && exports !== null) {
    jQuery = require("jquery");
    _ = require("underscore");
    Backbone = require("backbone");
    Backbone.$ = jQuery;
    Drowsy = require("backbone.drowsy").Drowsy;
    Washago = {};
    exports.Washago = Washago;
  } else {
    window.Washago = window.Washago || {};
    Washago = window.Washago;
    jQuery = window.$;
    _ = window._;
    Drowsy = window.Drowsy;
  }

  Washago.Model = (function() {
    function Model() {}

    Model.requiredCollections = ['notes', 'tags', 'states'];

    Model.init = function(url, db) {
      var dfrInit,
        _this = this;
      dfrInit = jQuery.Deferred();
      if (!url) {
        throw new Error("Cannot configure model because no DrowsyDromedary URL was given!");
      }
      if (!db) {
        throw new Error("Cannot configure model because no database name was given!");
      }
      this.baseURL = url;
      this.dbURL = "" + url + "/" + db;
      this.server = new Drowsy.Server(url);

      this.checkThatDatabaseExists(db)
      .then(function () {
        _this.db = _this.server.database(db);
        return _this.createNecessaryCollections(_this.requiredCollections);
      })
      .then(function() {
          _this.defineModelClasses();
          dfrInit.resolve();
      });      

      return dfrInit.promise();
    };

    Model.checkThatDatabaseExists = function(dbName) {
      var _this = this;
      var dfrCheck = jQuery.Deferred();

      this.server.databases()
      .done(function (dbs) {
        if (_.pluck(dbs, 'name').indexOf(dbName) < 0) {
          throw new Error("Database '"+dbName+"' does not exist in '"+_this.baseURL+"'!");
        }
        dfrCheck.resolve();
      });

      return dfrCheck.promise();
    };

    Model.createNecessaryCollections = function(requiredCollections) {
      var df, dfs,
        _this = this;
      dfs = [];
      df = jQuery.Deferred();

      this.db.collections(function(colls) {
        var col, existingCollections, _i, _len;
        existingCollections = _.pluck(colls, 'name');
        _.each(requiredCollections, function (coll) {
          if (existingCollections.indexOf(coll) < 0) {
            console.log("Creating collection '" + coll + "' under " + Washago.Model.dbURL);
            dfs.push(_this.db.createCollection(coll));
          }
        });
      });

      jQuery.when.apply(jQuery, dfs).done(function() {
        return df.resolve();
      });
      return df.promise();
    };

    Model.defineModelClasses = function() {
      
      var VotableTrait = {
        addVote: function(username) {
          var votes;
          votes = _.clone(this.get('votes'));
          if (!votes) {
            votes = [];
          }
          votes.push(username);
          return this.set('votes', votes);
        },

        removeVote: function(username) {
          var votes;
          votes = _.without(this.get('votes'), username);
          return this.set('votes', votes);
        }
      };

      var BuildOnableTrait = {
        addBuildOn: function(author, content) {
          var bo, build_ons;
          build_ons = _.clone(this.get('build_ons'));
          if (!build_ons) {
            build_ons = [];
          }
          bo = {
            content: content,
            author: author,
            created_at: new Date()
          };
          build_ons.push(bo);
          return this.set('build_ons', build_ons);
        }
      };

      /** Taggable Trait **/

      var TaggableTrait = {
        addTag: function(tag, tagger) {
          var existingTagRelationships, tagRel,
            _this = this;
          if (!(tag instanceof Washago.Model.Tag)) {
            console.error("Cannot addTag ", tag, " because it is not a Washago.Model.Tag instance!");
            throw "Invalid tag (doesn't exist)";
          }
          if (!tag.id) {
            console.error("Cannot addTag ", tag, " to contribution ", this, " because it doesn't have an id!");
            throw "Invalid tag (no id)";
          }
          existingTagRelationships = this.get('tags') || [];
          if (_.any(existingTagRelationships, function(tr) {
            return tr.id === tag.id;
          })) {
            console.warn("Cannot addTag ", tag, " to contribution ", this, " because it already has this tag.");
            return this;
          }
          tagRel = this.tagRel(tag, tagger);
          existingTagRelationships.push(tagRel);
          this.set('tags', existingTagRelationships);
          return this;
        },

        removeTag: function(tag, tagger) {
          var reducedTags,
            _this = this;
          reducedTags = _.reject(this.get('tags'), function(t) {
            return (t.id === tag.id || t.name === tag.get('name')) && (!tagger || t.tagger === tagger);
          });
          this.set('tags', reducedTags);
          return this;
        },

        hasTag: function(tag, tagger) {
          var _this = this;
          return _.any(this.get('tags'), function(t) {
            return t.id.toLowerCase() === tag.id && (!tagger || t.tagger === tagger);
          });
        }
      };

      /** Multipos Trait **/

      // Allows a balloon to have multiple sets of positions, for different contexts
      var MultiposTrait = {
        getPos: function(context) {
          var ctx = context || "_";
          var positions = this.get('pos') || {};
          // need to clone to ensure that changes aren't unintentionally written back if return value is manipulated
          return _.clone(positions[ctx]);
        },
        setPos: function(pos, context) {
          if (_.isNull(pos.left) || _.isUndefined(pos.left) || 
              _.isNull(pos.top)  || _.isUndefined(pos.top)) {
            console.error("Invalid position for setPos:", pos, context, this);
            throw new Error("Cannot setPos() because the given position is invalid.");
          }
          var ctx = context || "_";
          var positions = this.has('pos') ? _.clone(this.get('pos')) : {};
          positions[ctx] = pos;
          this.set('pos', positions);
          return this;
        },
        hasPos: function(context) {
          var ctx = context || "_";
          return this.has('pos') && 
            !_.isUndefined(this.get('pos')[ctx]);
        }
      };

      /** Note **/

      this.Note = this.db.Document('notes').extend({
        tagRel: function(tag, tagger) {
          return {
            id: tag.id.toLowerCase(),
            name: tag.get('name'),
            tagger: tagger,
            tagged_at: new Date()
          };
        }
      })
      .extend(MultiposTrait)
      .extend(VotableTrait)
      .extend(BuildOnableTrait);

      this.Notes = this.db.Collection('notes').extend({
        model: Washago.Model.Note
      });

      /** Tag **/

      this.Tag = this.db.Document('tags').extend({

      })
      .extend(MultiposTrait);

      this.Tags = this.db.Collection('tags').extend({
        model: Washago.Model.Tag
      });

      /** State **/

      this.State = this.db.Document('states').extend({

      });
      
      this.States = this.db.Collection('states').extend({
        model: Washago.Model.State
      });
    };

    Model.wake = function(wakefulUrl) {
      var dfrWake = jQuery.Deferred();
      Wakeful.loadFayeClient(wakefulUrl).then(function () {
        return Model.initWakefulCollections(wakefulUrl);
      }).then(function () {
        dfrWake.resolve();
      });

      return dfrWake.promise();
    };

    Model.initWakefulCollections = function(wakefulUrl) {
      var camelCase, coll, collName, deferreds, _i, _len, _ref;
      deferreds = [];
      camelCase = function(str) {
        return str.replace(/([\-_][a-z]|^[a-z])/g, function($1) {
          return $1.toUpperCase().replace(/[\-_]/, '');
        });
      };
      this.awake = {};
      _.each(this.requiredCollections, function (collName) {
        coll = new Washago.Model[camelCase(collName)]();
        coll.wake(wakefulUrl);
        Washago.Model.awake[collName] = coll;
        deferreds.push(coll.fetch());
      });
      return jQuery.when.apply(jQuery, deferreds);
    };

    return Model;

  })();

}).call(this);
