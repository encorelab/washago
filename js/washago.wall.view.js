/*jshint browser: true, devel: true */
/*globals Sail, jQuery, _, Backbone, Washago, MD5 */

(function(app) {
    var view = {};

    // Brings a .ui-draggable element to the front (via z-index).
    // This is meant to be used as a callback for jQuery event bindings,
    // so `this` is assumed to refer to the element you want to bring
    // to the front.
    view.bringDraggableToFront = function () {
        var zs = jQuery('.ui-draggable').map(function() {
            var z = jQuery(this).css('z-index'); 
            return z === 'auto' ? 100 : parseInt(z, 10);
        }).toArray();
        var maxZ = Math.max.apply(Math, zs);
        jQuery(this).css('z-index', maxZ + 1);
    };

    // find or create element in parent matching the selector;
    // if element doesn't exist in parent, create it with the given html
    var foc = function(parent, selector, html) {
        var el = jQuery(parent).find(selector);
        if (el.length) {
            return el;
        } else {
            el = jQuery(html);
            jQuery(parent).append(el);
            return el;
        }
    };

    var generateContributionElement = function (contrib, view) {
        var jel = jQuery("<div class='balloon contribution' id='"+view.domID()+"'></div>");

        var content = foc(jel, '.content', 
                                "<div class='text'></div>");

        content.text(contrib.get('text'));

        var discourseType = contrib.get('discourse').toLowerCase();

        switch(discourseType) {
            case 'question':
                break;
            case 'comment':
                break;
        }

        jel.addClass('discourse-'+discourseType);
        jel.addClass('about-'+MD5.hexdigest(contrib.get('about')));

        var tags = foc(jel, '.tags', 
                            "<div class='tags'></div>");

        if (contrib.get('tags')) {
            var tag;
            _.each(contrib.get('tags'), function(t) {
                tag = jQuery("<span class='tag'></span>");
                tag.text(t);
                tags.append(tag);
            });
            jel.append(tags);
        
            tags.hide(); // tags are initially collapsed

            jel.dblclick(function() {
                jel.find('.tags').toggle('slideUp');
            });

            var md5tags = _.map(contrib.get('tags'), function(t) {return MD5.hexdigest(t);});
            _.each(md5tags, function (t) {
                jel.addClass('tags-' + t);
            });
            jel.data('tags', md5tags); // used by washago.wall.graph
        }


        var meta = jQuery("<div class='about author'>");
        meta.text(contrib.get('about') + ' - ' + contrib.get('author'));
        jel.prepend(meta);

        return jel[0];
    };

    view.ContributionView = Backbone.View.extend({
        initialize: function () {
            //this.model.on('change:sorted_as', this.sorted, this);
        },

        render: function () {
            var contrib = this.model;

            var el = jQuery('#' + this.domID());
            if (el.length) {
                this.setElement(el);
            } else {
                el = generateContributionElement(contrib, this);
                this.setElement(el);
                this.$el.data('view', this);

                this.$el.draggable({
                    stop: function (ev, ui) {
                        contrib.save({pos: ui.position});
                    }
                });

                // BANDAID: For some reason in Chrome draggable() makes balloon's position 'relative'...
                //          Need to reset it back to absolute for proper positioning within the wall.
                this.$el.css('position', 'absolute');

                // bring the balloon to the top when clicked
                this.$el.mousedown(view.bringDraggableToFront);

                this.$el.hide();
                jQuery("#wall").append(this.$el);
                
                if (contrib.has('pos')) {
                    this.$el.css({
                        left: contrib.get('pos').left + 'px',
                        top: contrib.get('pos').top + 'px'
                    });
                } else { 
                    this.autoPosition();
                }

                
                this.$el.addClass('new');

                this.$el.show();
            }

            var tags = foc(this.$el, '.tags', 
                        "<div class='tags'></div>");

            _.each(contrib.tags, function (t) {
                var tag = jQuery("<span class='tag'></span>");
                tag.text(t);
                tags.append(tag);
            });
            
            //this.$el.effect('highlight', 'slow');
            //counter.effect('highlight', 'slow');
                
            //this.sorted();
            
            return this;
        },

        domID: function () {
            return 'contribution-'+this.model.id;
        },

        autoPosition: function () {
            var left, top;

            var boardWidth = jQuery("#wall").width();
            var boardHeight = jQuery("#wall").height();
            
            
            left = Math.random() * (boardWidth - this.$el.width());
            top = Math.random() * (boardHeight - this.$el.height());
            
            this.$el.css({
                left: left + 'px',
                top: top + 'px'
            });
            
            this.model.save({pos: {left: left, top: top}});
        }
    });

    view.prompt = function (instructions, callOnSubmit) {
        var dialog = jQuery("<div><p></p><textarea></textarea></div>");
        
        dialog.find('p').text(instructions);
        dialog.find('textarea').css({'width': '100%', 'min-height': '5em'});
        dialog.dialog({
            minWidth: 440,
            modal: true,
            draggable: false,
            buttons: {
                Cancel: function() {
                    jQuery(this).dialog("close");
                },
                Submit: function() {
                    jQuery(this).dialog("close");
                    callOnSubmit(dialog.find('textarea').val());
                }
            }
        });
        dialog.css('width', '400px');
    };

    view.showRunPicker = function(runs, pick) {
        inContainer = 'body';
        picker = jQuery("<div id='run-picker' class='auth-box widget-box'></div>");
        picker.append("<h1 id='run-picker-instructions' class='titlebar'>Select the Roadshow session:</h1>");
        picker.append("<ul class='runs'></ul>");
        
        runs.each(function(r) {
            li = jQuery("<li id='run-"+r.id+"'>"+r.get('name')+"</li> ");
            li.data('run', r);
            li.click(function () { pick(jQuery(this).data('run')); });
            picker.children(".runs").append(li);
        });
        
        jQuery(inContainer).append(picker);
        
        Sail.UI.showDialog(picker);
    };

    app.view = view;
})(Washago.Wall);