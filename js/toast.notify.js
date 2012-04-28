/*jshint browser: true, devel: true */
/*globals window, jQuery */
;(function( jQuery, window, undefined ) {
    "use strict";
    jQuery.extend(jQuery.mobile, {
        showToast: function(message, showLoader, delay, isErrorToast, callback) {
            var oldMsg = jQuery.mobile.loadingMessage;
            jQuery.mobile.loadingMessage = message;
            
            jQuery.mobile.loadingMessageTextVisible = true;
            
            jQuery.mobile.showPageLoadingMsg();
            jQuery(".ui-loader").hide().fadeIn('slow');
            
            if (showLoader) {
                jQuery(".ui-icon-loading").removeClass("ui-icon").removeClass("ui-icon-loading").addClass('ui-sail-loading-icon');
            }
            else {
                jQuery(".ui-icon-loading").removeClass("ui-icon").removeClass("ui-icon-loading");
            }
            
            if (isErrorToast) {
                jQuery(".ui-body-a, .ui-overlay-a").removeClass("ui-body-a").removeClass("ui-overlay-a").addClass("ui-overlay-error").addClass("ui-body-error");
            }
            
            if(delay && delay >0)
            {
                setTimeout(function(){
                    //jQuery.mobile.hidePageLoadingMsg();
                    jQuery(".ui-loader").fadeOut('slow');
                    jQuery.mobile.loadingMessage = oldMsg;
                    if (callback) { callback(); }
                },delay);
            }
            
        },
        hideToast: function() {
            jQuery(".ui-loader").fadeOut('slow');
        }
    });
})( jQuery, this );
