(function () {
  "use strict";

  this.Washago = this.Washago || {};
  this.Washago.Smartboard = this.Washago.Smartboard || {};

  var Smartboard = this.Washago.Smartboard;

  Smartboard.View = Smartboard.View || {};

  Smartboard.View.Wall = Smartboard.View.Base.extend({
    initialize: function () {
      var wall = this;

      _.bindAll(this);

      Smartboard.runState.on('change', this.render);

      this.balloons = {};

      Washago.Model.awake.notes.on('add', function(n) {
        wall.registerBalloon(n, Smartboard.View.NoteBalloon, wall.balloons);
      });
      Washago.Model.awake.notes.each(function(n) {
        wall.registerBalloon(n, Smartboard.View.NoteBalloon, wall.balloons);
      });
      
      Washago.Model.awake.tags.on('add', function(t) {
        wall.registerBalloon(t, Smartboard.View.TagBalloon, wall.balloons);
      });
      Washago.Model.awake.tags.each(function(t) {
        wall.registerBalloon(t, Smartboard.View.TagBalloon, wall.balloons);
      });
      Washago.Model.awake.tags.each(function(t) {
        wall.balloons[t.id].renderConnectors();
      });
    },

    events: {
      'click #add-tag-opener': 'toggleTagInputter',
      'click #submit-new-tag': 'submitNewTag',
      'keydown #new-tag': function(ev) { if (ev.keyCode === 13) return this.submitNewTag(); },
      'click #toggle-pause': 'togglePause'
    },

    ready: function () {
      this.render();
      this.$el.removeClass('loading');
      this.changeWatermark('Brainstorm');
    },

    toggleTagInputter: function () {
      var wall = this;
      var addTagContainer = this.$el.find('#add-tag-container');
      addTagContainer.toggleClass('opened');
      if (addTagContainer.hasClass('opened')) {
        return setTimeout(function() {
          return wall.$el.find('#new-tag').focus();
        }, 500);
      }
    },

    submitNewTag: function () {
      var newTag = this.$el.find('#new-tag').val();
      if (jQuery.trim(newTag).length < 2) {
        return; // don't allow tags shorter than 2 characters
      }
      Smartboard.createNewTag(newTag);
      this.$el.find('#add-tag-container').removeClass('opened').blur();
      return this.$el.find('#new-tag').val('');
    },

    togglePause: function () {
      var paused = Smartboard.runState.get('paused');
      return Smartboard.runState.save({
        paused: !paused
      });
    },

    pause: function() {
      this.$el.find('#toggle-pause').addClass('paused').text('Resume');
      if (this.$el.data('phase') !== 'evaluate') {
        jQuery('body').addClass('paused');
        return this.changeWatermark("Paused");
      }
    },

    unpause: function() {
      jQuery('body').removeClass('paused');
      this.$el.find('#toggle-pause').removeClass('paused').text('Pause');
      return this.changeWatermark(this.$el.data('phase') || "brainstorm");
    },

    changeWatermark: function(text) {
      return jQuery('#watermark').fadeOut(800, function() {
        return jQuery(this).text(text).fadeIn(800);
      });
    },

    registerBalloon: function(note, BalloonView) {
      var wall = this;

      var bv = new BalloonView({
        model: note
      });
      note.wake(Smartboard.config.wakeful.url);

      bv.$el.css('visibility', 'hidden');
      bv.wall = wall; // FIXME: hmmm...
      bv.render();

      wall.$el.append(bv.$el);
      note.on('change:pos', function() {
        bv.pos = note.getPos();
      });

      note.on('change:z-index', function() {
        bv.$el.zIndex(note.get('z-index'));
      });

      if (note.hasPos()) {
        bv.pos = note.getPos();
      } else {
        wall.assignRandomPositionToBalloon(note, bv);
      }

      if (note.has('z-index')) {
        bv.$el.zIndex(note.get('z-index'));
      }

      wall.makeBallonDraggable(note, bv);
      bv.$el.click(function() {
        wall.moveBallonToTop(note, bv);
      });

      bv.render();
      note.save().done(function() {
        bv.$el.css('visibility', 'visible');
      });

      this.balloons[note.id] = bv;
    },

    assignRandomPositionToBalloon: function(doc, view) {
      var left, top, wallHeight, wallWidth;
      wallWidth = this.$el.width;
      wallHeight = this.$el.height;
      left = Math.random() * (wallWidth - view.width);
      top = Math.random() * (wallHeight - view.height);
      doc.setPos({
        left: left,
        top: top
      });
      this.moveBallonToTop(doc, view);
    },

    moveBallonToTop: function(doc, view) {
      var maxZ;
      maxZ = this.maxBallonZ();
      maxZ++;
      return doc.set('z-index', maxZ);
    },

    maxBallonZ: function() {
      return _.max(this.$el.find('.balloon').map(function(el) {
        return parseInt(jQuery(this).zIndex(), 10);
      }));
    },

    makeBallonDraggable: function(doc, view) {
      var _this = this;
      view.$el.draggable({
        distance: 30,
        containment: '#wall'
      }).css('position', 'absolute');
      view.$el.on('dragstop', function(ev, ui) {
        doc.setPos(ui.position);
        return doc.save(null, { patch: true });
      });
      view.$el.on('drag', function(ev, ui) {
        if (view.renderConnectors !== null) {
          return view.renderConnectors();
        }
      });
      return view.$el.on('dragstart', function(ev, ui) {
        return _this.moveBallonToTop(doc, view);
      });
    },

    addTagFilter: function(tag) {
      if (__indexOf.call(this.tagFilters, tag) < 0) {
        this.tagFilters.push(tag);
        return this.renderFiltered();
      }
    },

    removeTagFilter: function(tag) {
      this.tagFilters.splice(this.tagFilters.indexOf(tag), 1);
      return this.renderFiltered();
    },

    renderFiltered: function(tag) {
      var activeIds, maxZ, selector;
      if (this.tagFilters.length === 0) {
        return this.$el.find(".content, .connector").removeClass('blurred');
      } else {
        activeIds = (function() {
          var _i, _len, _ref, _results;
          _ref = this.tagFilters;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            tag = _ref[_i];
            _results.push(tag.id);
          }
          return _results;
        }).call(this);
        selector = ".tag-" + activeIds.join(", .tag-");
        this.$el.find(".content:not(" + selector + ")").addClass('blurred');
        this.$el.find(".connector:not(" + selector + ")").addClass('blurred');
        maxZ = this.maxBallonZ();
        this.$el.find(".content").filter("" + selector).removeClass('blurred').css('z-index', maxZ + 1);
        return this.$el.find(".connector").filter("" + selector).removeClass('blurred');
      }
    },

    render: function() {
      var elementsToRemove, fadeoutStyle, hideStyle, ig, paused, phase,
        _this = this;

      this.width = this.$el.outerWidth();
      this.height = this.$el.outerHeight();

      phase = Smartboard.runState.get('phase');
      if (phase !== this.$el.data('phase')) {
        // switch (phase) {
        //   case 'tagging':
        //     jQuery('body').removeClass('mode-brainstorm').addClass('mode-tagging').removeClass('mode-exploration').removeClass('mode-propose').removeClass('mode-investigate');
        //     this.changeWatermark("tagging");
        //     break;
        //   case 'exploration':
        //     jQuery('body').removeClass('mode-brainstorm').removeClass('mode-tagging').addClass('mode-exploration').removeClass('mode-propose').removeClass('mode-investigate');
        //     this.changeWatermark("exploration");
        //     break;
        //   case 'propose':
        //     jQuery('body').removeClass('mode-brainstorm').removeClass('mode-tagging').removeClass('mode-exploration').addClass('mode-propose').removeClass('mode-investigate');
        //     this.changeWatermark("propose");
        //     setTimeout((function() {
        //       return _this.$el.find('.contribution, .contribution-connector').remove();
        //     }), 1100);
        //     break;
        //   case 'investigate':
        //     ig = Sail.app.interestGroup;
        //     if (ig !== null) {
        //       this.changeWatermark(ig.get('name'));
        //       jQuery('body').addClass('mode-investigate-with-topic').addClass(ig.get('colorClass'));
        //       elementsToRemove = ".balloon.contribution, .connector.contribution-connector, .balloon.tag, .connector.proposal-connector, " + (".balloon.proposal:not(.ig-" + ig.id + "), .balloon.investigation:not(.ig-" + ig.id + "), .connector:not(.ig-" + ig.id + ")");
        //     } else {
        //       this.changeWatermark("investigate");
        //       jQuery('body').removeClass('mode-investigate-with-topic');
        //       elementsToRemove = '.balloon.contribution, .connector.contribution-connector';
        //     }
        //     fadeoutStyle = jQuery("<style>                            " + elementsToRemove + " {                                opacity: 0.0;                            }                        </style>");
        //     hideStyle = jQuery("<style>                            " + elementsToRemove + " {                                display: none;                            }                        </style>");
        //     jQuery('head').append(fadeoutStyle);
        //     jQuery('body').removeClass('mode-brainstorm').removeClass('mode-tagging').removeClass('mode-exploration').removeClass('mode-propose').addClass('mode-investigate');
        //     setTimeout((function() {
        //       return jQuery('head').append(hideStyle);
        //     }), 1100);
        //     break;
        //   default:
        //     jQuery('body').addClass('mode-brainstorm').removeClass('mode-tagging').removeClass('mode-exploration').removeClass('mode-propose').removeClass('mode-investigate');
        //     this.changeWatermark("brainstorm");
        // }
        this.$el.data('phase', phase);
      }

      paused = Smartboard.runState.get('paused');
      if (paused !== this.$el.data('paused')) {
        if (paused) {
          this.pause();
        } else {
          this.unpause();
        }
        return this.$el.data('paused', paused);
      }
    }
  });

}).call(this);