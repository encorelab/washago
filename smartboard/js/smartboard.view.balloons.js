(function () {
  "use strict";

  this.Washago = this.Washago || {};
  this.Washago.Smartboard = this.Washago.Smartboard || {};

  var Smartboard = this.Washago.Smartboard;

  Smartboard.View = Smartboard.View || {};

  Smartboard.View.Balloon = Smartboard.View.Base.extend({
    className: "balloon",

    initialize: function () {
      var balloon = this;

      Object.defineProperty(this, 'pos', {
        get: function() {
          return balloon.$el.position();
        },
        set: function(pos) {
          return balloon.$el.css({
            left: pos.left + 'px',
            top: pos.top + 'px'
          });
        }
      });
      Object.defineProperty(balloon, 'left', {
        get: function() {
          return balloon.pos.left;
        },
        set: function(x) {
          return balloon.$el.css('left', x + 'px');
        }
      });
      Object.defineProperty(balloon, 'top', {
        get: function() {
          return balloon.pos.top;
        },
        set: function(y) {
          return balloon.$el.css('top', y + 'px');
        }
      });
      Object.defineProperty(balloon, 'width', {
        get: function() {
          return balloon.$el.outerWidth(); // TODO: cache
        },
        set: function(w) {
          return balloon.$el.css('width', w + 'px');
        }
      });
      Object.defineProperty(balloon, 'height', {
        get: function() {
          return balloon.$el.outerHeight(); // TODO: cache
        },
        set: function(h) {
          return balloon.$el.css('height', h + 'px');
        }
      });
      Object.defineProperty(balloon, 'right', {
        get: function() {
          return balloon.left + balloon.width;
        },
        set: function(x) {
          return balloon.$el.css('left', (x - balloon.width) + 'px');
        }
      });
      Object.defineProperty(balloon, 'bottom', {
        get: function() {
          return balloon.top + balloon.height;
        },
        set: function(y) {
          return balloon.$el.css('top', (y - balloon.height) + 'px');
        }
      });

      balloon.model.on('change:published', function() {
        if (balloon.model.get('published')) {
          balloon.$el.addClass('new');
          setTimeout(function() {
            return balloon.$el.removeClass('new');
          }, 1001);
          return balloon.model.on('wakeful:broadcast:received', function() {
            if (!balloon.$el.hasClass('glow')) {
              balloon.$el.addClass('glow');
              // wait for the glow animation to finish before removing the glow class
              return setTimeout(function() {
                return balloon.$el.removeClass('glow');
              }, 4001);
            }
          });
        }
      });

      balloon.model.on('change', function() {
        if (balloon.wall) { // this balloon has been added to the wall
          return balloon.render();
        }
      });

      // balloon.$el.on('drag', function(ev, ui) {
      //   balloon.adjustForPerspective(ui.position);
      // });
    },

    render: function() {
      var balloon = this;

      if (balloon.model.hasPos()) {
        balloon.pos = balloon.model.getPos();
      }
      if (balloon.model.has('z-index')) {
        return balloon.$el.zIndex(balloon.model.get('z-index'));
      }

      // this.adjustForPerspective();
    },

    // this is currently unused
    adjustForPerspective: function (balloonPos) {
      var wallWidth = this.wall.width;
      var wallHeight = this.wall.height;
      var balloonWidth = this.width;
      var balloonHeight = this.height;

      var pos = balloonPos || this.$el.offset();

      var xMid = wallWidth / 2;
      var perspX = ((pos.left + balloonWidth/2) - xMid) / xMid;

      var yMid = wallHeight / 2;
      var perspY = ((pos.top + balloonHeight/2) - yMid) / yMid;
      
      var shadowY = Math.round(8 * perspY);
      var shadowX = Math.round(8 * perspX);
      console.log(shadowY, shadowX, "rgba(0, 0, 0, 0.1) "+shadowX+"px "+shadowY+"px 4px");
      this.$el.css('box-shadow', "rgba(0, 0, 0, 0.1) "+shadowX+"px "+shadowY+"px 4px");
    }
  });

  Smartboard.View.ContentBalloon = Smartboard.View.Balloon.extend({
    className: "content balloon",

    initialize: function () {
      // call parent's constructor
      Smartboard.View.Balloon.prototype.initialize.apply(this, arguments);

      var balloon = this;

      this.model.on('change:tags', function() {
        return balloon.renderConnectors();
      });
    },

    events: {
      'dblclick': 'toggleOpen'
    },

    toggleOpen: function () {
      this.$el.toggleClass('opened');
    },

    render: function () {
      var balloon = this;

      // call parent's render
      Smartboard.View.Balloon.prototype.render.apply(this, arguments);

      if (balloon.model.get('published')) {
        balloon.$el.removeClass('unpublished');
      } else {
        balloon.$el.addClass('unpublished');
      }
      
      headline = balloon.findOrCreate('.headline', "<h3 class='headline'></h3>");
      headline.text(balloon.model.get('headline'));
      
      body = balloon.findOrCreate('.body', "<div class='body'></div>");
      if (balloon.model.get('content_type') === 'text') {
        body.text(balloon.model.get('content'));
      } else {
        // TODO: implement this
        body.text(balloon.model.get('content'));
      }

      meta = balloon.findOrCreate('.meta', "<div class='meta'><span class='author'></span></div>");
      meta.find('.author').text(balloon.model.get('author')).addClass("author-" + (balloon.model.get('author')));
      
      balloon.renderTags();
      balloon.renderBuildons();
      balloon.renderConnectors();
    },

    renderConnectors: function() {
      var balloon = this;

      var connector, connectorId, connectorLength, connectorTransform, tag, tagId, tagView, x1, x2, y1, y2;

      if (!balloon.model.has('tags') || _.isEmpty(balloon.model.get('tags')) || !balloon.$el.is(':visible')) {
        return;
      }

      _.each(balloon.model.get('tags'), function (tag) {
        tagId = tag.id.toLowerCase();
        tagView = balloon.wall.balloons[tagId];
        if (!tagView) {
          return;
        }
        connectorId = balloon.model.id + "-" + tagId;
        connector = CK.Smartboard.View.findOrCreate(balloon.wall.$el, "#" + connectorId, "<div class='connector' id='" + connectorId + "'></div>");
        x1 = balloon.left + (balloon.width / 2);
        y1 = balloon.top + (balloon.height / 2);
        x2 = tagView.left + (tagView.width / 2);
        y2 = tagView.top + (tagView.height / 2);
        connectorLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        connectorTransform = "rotate(" + (Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI) + "deg)";
        connector.css({
          'top': "" + y1 + "px",
          'left': "" + x1 + "px",
          'width': "" + connectorLength + "px",
          '-webkit-transform': connectorTransform,
          '-moz-transform': connectorTransform,
          'transform': connectorTransform
        });
        connector.addClass("connects-" + balloon.model.id);
        connector.addClass("connects-" + tag.id);
        connector.addClass("tag-" + tag.id);
      });
    },

    renderTags: function() {
      var balloon = this;

      if (!balloon.model.has('tags')) {
        return;
      }
      
      var tagIds = _.pluck(balloon.model.get('tags'), function (tag) { return tag.id; });

      balloon.$el.attr('data-tags', tagIds.join(" "));

      _.each(tagIds, function (tid) {
        balloon.$el.addClass("tag-" + tid);
      });
    },

    renderBuildons: function() {
      var $b, b, buildons, changed, container, counter;
      if (!this.model.has('build_ons')) {
        return;
      }

      buildons = this.model.get('build_ons');
      if (!buildons.length) {
        return;
      }

      container = this.findOrCreate('.buildons', "<div class='buildons'></div>");
      changed = false;
      if (buildons.length !== container.find('div.buildon').length) {
        changed = true;
      }

      container.children('div.buildon').remove();
      counter = CK.Smartboard.View.findOrCreate(this.$el.find('.meta'), '.buildon-counter', "<div class='buildon-counter'></div>");
      counter.html('');

      _.each(buildons, function (b) {
        if (!b.published) {
          return;
        }
        counter.append("•");
        $b = jQuery("<div class='buildon'><div class='author'></div><div class='content'></div></div>            ");
        $b.find('.author').text(b.author);
        $b.find('.content').text(b.content);
        container.append($b);
      });
    }
  });

  Smartboard.View.NoteBalloon = Smartboard.View.ContentBalloon.extend({
    className: "note content balloon",

    render: function () {
      var balloon = this;

      // call parent's render
      Smartboard.View.Balloon.prototype.render.apply(this, arguments);

      // WARNING: This is now coding out what exists in a note. Maybe this should come from a user definition in the future??!!
      var headline = balloon.findOrCreate('.headline', "<h3 class='headline'></h3>");
      headline.text(balloon.model.get('headline'));

      var noteBody = balloon.findOrCreate('.body', "<div class='body'></div>");
      noteBody.text(balloon.model.get('body'));

      // balloon.addClass('note');
      balloon.$el.addClass('note');
    }
  });


  Smartboard.View.TagBalloon = Smartboard.View.Balloon.extend({
    className: "tag balloon",

    initialize: function () {
      // call parent's constructor
      Smartboard.View.Balloon.prototype.initialize.apply(this, arguments);

      var balloon = this;

      this.model.on('change:tags', function() {
        return balloon.renderConnectors();
      });
    },

    events: {
      'dblclick': 'toggleFilter'
    },

    toggleFilter: function () {
      if ($el.hasClass('active')) {
        Smartboard.wall.removeTagFilter(this.model);
        return this.$el.removeClass('active');
      } else {
        Smartboard.wall.addTagFilter(this.model);
        return this.$el.addClass('active');
      }
    },

    render: function () {
      var balloon = this;

      // call parent's render
      Smartboard.View.Balloon.prototype.render.apply(this, arguments);

      balloon.$el.addClass('tag');

      var name = balloon.findOrCreate('.name', "<h3 class='name'></h3>");
      name.text(balloon.model.get('name'));

      balloon.renderConnectors();
    },

    renderConnectors: function() {
      var balloon = this;

      _.chain(balloon.wall.balloons)
      .filter(function(bv) {
        return bv.model instanceof Washago.Model.Note && bv.model.hasTag(balloon.model);
      })
      .each(function(bv) {
        bv.renderConnectors();
      });
    }
  });

}).call(this);