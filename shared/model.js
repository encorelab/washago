(function() {
  var Backbone, Washago, Drowsy, jQuery, _,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

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
      var deferredConfigure,
        _this = this;
      deferredConfigure = jQuery.Deferred();
      if (!url) {
        throw new Error("Cannot configure model because no DrowsyDromedary URL was given!");
      }
      if (!db) {
        throw new Error("Cannot configure model because no database name was given!");
      }
      this.baseURL = url;
      this.dbURL = "" + url + "/" + db;
      this.server = new Drowsy.Server(url);
      this.db = this.server.database(db);
      this.createNecessaryCollections(this.requiredCollections).then(function() {
        _this.defineModelClasses();
        return deferredConfigure.resolve();
      });
      return deferredConfigure;
    };

    Model.createNecessaryCollections = function(requiredCollections) {
      var df, dfs,
        _this = this;
      dfs = [];
      df = jQuery.Deferred();

      this.db.collections(function(colls) {
        var col, existingCollections, _i, _len;
        existingCollections = _.pluck(colls, 'name');
        _.each(existingCollections, function (coll) {
          if (existingCollections.indexOf(coll) < 0) {
            console.log("Creating collection '" + coll + "' under " + Washago.Model.dbURL);
            dfs.push(_this.db.createCollection(coll));
          }
        });
      });

      jQuery.when.apply(jQuery, dfs).done(function() {
        return df.resolve();
      });
      return df;
    };

    Model.defineModelClasses = function() {
      var BuildOnableTrait, TaggableTrait, VotableTrait;
      VotableTrait = (function() {

        function VotableTrait() {}

        VotableTrait.prototype.addVote = function(username) {
          var votes;
          votes = _.clone(this.get('votes'));
          if (!votes) {
            votes = [];
          }
          votes.push(username);
          return this.set('votes', votes);
        };

        VotableTrait.prototype.removeVote = function(username) {
          var votes;
          votes = _.without(this.get('votes'), username);
          return this.set('votes', votes);
        };

        return VotableTrait;

      })();

      /** BuildOnable Trait **/

      BuildOnableTrait = (function() {

        function BuildOnableTrait() {}

        BuildOnableTrait.prototype.addBuildOn = function(author, content) {
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
        };

        return BuildOnableTrait;

      })();

      /** Taggable Trait **/

      TaggableTrait = (function() {

        function TaggableTrait() {
          this.hasTag = __bind(this.hasTag, this);

          this.removeTag = __bind(this.removeTag, this);

          this.addTag = __bind(this.addTag, this);

        }

        TaggableTrait.prototype.addTag = function(tag, tagger) {
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
        };

        TaggableTrait.prototype.removeTag = function(tag, tagger) {
          var reducedTags,
            _this = this;
          reducedTags = _.reject(this.get('tags'), function(t) {
            return (t.id === tag.id || t.name === tag.get('name')) && (!tagger || t.tagger === tagger);
          });
          this.set('tags', reducedTags);
          return this;
        };

        TaggableTrait.prototype.hasTag = function(tag, tagger) {
          var _this = this;
          return _.any(this.get('tags'), function(t) {
            return t.id.toLowerCase() === tag.id && (!tagger || t.tagger === tagger);
          });
        };

        return TaggableTrait;

      })();

      /** Note **/

      this.Note = (function(_super) {

        __extends(Note, _super);

        function Note() {
          return Note.__super__.constructor.apply(this, arguments);
        }

        _.extend(Note.prototype, TaggableTrait.prototype);

        Note.prototype.tagRel = function(tag, tagger) {
          return {
            id: tag.id.toLowerCase(),
            name: tag.get('name'),
            tagger: tagger,
            tagged_at: new Date()
          };
        };

        return Note;

      })(this.db.Document('notes'));

      /** Notes **/

      this.Notes = (function(_super) {

        __extends(Notes, _super);

        function Notes() {
          return Notes.__super__.constructor.apply(this, arguments);
        }

        Notes.prototype.model = Washago.Model.Note;

        return Notes;

      })(this.db.Collection('notes'));

      /** Tag **/

      this.Tag = (function(_super) {

        __extends(Tag, _super);

        function Tag() {
          return Tag.__super__.constructor.apply(this, arguments);
        }

        return Tag;

      })(this.db.Document('tags'));

      /** Tags **/

      this.Tags = (function(_super) {

        __extends(Tags, _super);

        function Tags() {
          return Tags.__super__.constructor.apply(this, arguments);
        }

        Tags.prototype.model = Washago.Model.Tag;

        return Tags;

      })(this.db.Collection('tags'));

      /** State **/

      this.State = (function(_super) {

        __extends(State, _super);

        function State() {
          return State.__super__.constructor.apply(this, arguments);
        }

        return State;

      })(this.db.Document('states'));

      /** States **/

      this.States = (function(_super) {

        __extends(States, _super);

        function States() {
          return States.__super__.constructor.apply(this, arguments);
        }

        States.prototype.model = Washago.Model.State;

        return States;

      })(this.db.Collection('states'));
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
      _.each(this.requiredCollections, function (colName) {
        collName = _ref[_i];
        coll = new this[camelCase(collName)]();
        coll.wake(wakefulUrl);
        this.awake[collName] = coll;
        deferreds.push(coll.fetch());
      });
      return jQuery.when.apply(jQuery, deferreds);
    };

    return Model;

  })();

}).call(this);
