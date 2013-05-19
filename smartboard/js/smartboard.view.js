(function () {
  "use strict";

  this.Washago = this.Washago || {};
  this.Washago.Smartboard = this.Washago.Smartboard || {};

  var Smartboard = this.Washago.Smartboard;

  Smartboard.View = Smartboard.View || {};

  var View = Smartboard.View;

  View.findOrCreate = function(parent, selector, html) {
    var el;
    el = jQuery(parent).find(selector);
    if (el.length > 0) {
      return el;
    }
    el = jQuery(html);
    parent.append(el);
    return el;
  };

  View.Base = Backbone.View.extend({
    findOrCreate: function(selector, html) {
      View.findOrCreate(this.$el, selector, html);
    }
  });

  View.Wall = View.Base.extend({
    events: {
      'click #add-tag-opener': function(ev) {
        var addTagContainer,
          _this = this;

        
        addTagContainer = this.$el.find('#add-tag-container');
        addTagContainer.toggleClass('opened');
        if (addTagContainer.hasClass('opened')) {
          return setTimeout(function() {
            return _this.$el.find('#new-tag').focus();
          }, 1000);
        }
      },
      'click #submit-new-tag': function(ev) {
        return this.submitNewTag();
      },
      'keydown #new-tag': function(ev) {
        if (ev.keyCode === 13) {
          return this.submitNewTag();
        }
      },
      'click #toggle-pause': function(ev) {
        var paused;
        paused = this.runState.get('paused');
        return this.runState.save({
          paused: !paused
        });
      }
    }
  });

}).call(this);