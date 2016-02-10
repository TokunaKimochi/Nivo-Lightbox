/*
 * Nivo Lightbox v1.2.0
 * http://dev7studios.com/nivo-lightbox
 *
 * Copyright 2013, Dev7studios
 * Free to use and abuse under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

;(function($, window, document, undefined){
    'use strict';

    var pluginName = 'nivoLightbox',
        defaults = {
            effect: 'fade',
            theme: 'default',
            keyboardNav: true,
            clickOverlayToClose: true,
            onInit: function(){},
            beforeShowLightbox: function(){},
            afterShowLightbox: function(lightbox){},
            beforeHideLightbox: function(){},
            afterHideLightbox: function(){},
            onPrev: function(element){},
            onNext: function(element){},
            errorMessage: 'The requested content cannot be loaded. Please try again later.'
        },
        prevNextFlag = null;

    function NivoLightbox(element, options){
        this.el = element;
        this.$el = $(this.el);

        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    NivoLightbox.prototype = {

        init: function(){
			var $this = this;

			// Need this so we don't use CSS transitions in mobile
			if(!$('html').hasClass('nivo-lightbox-notouch')) $('html').addClass('nivo-lightbox-notouch');
			if('ontouchstart' in document) $('html').removeClass('nivo-lightbox-notouch');

			// Setup the click
            this.$el.on('click', function(e){
                $this.showLightbox(e);
            });

            // keyboardNav
            if(this.options.keyboardNav){
                $('body').off('keyup').on('keyup', function(e){
                    var code = (e.keyCode ? e.keyCode : e.which);
                    // Escape
                    if(code == 27) $this.destructLightbox();
                    // Left
                    if(code == 37) $('.nivo-lightbox-prev').trigger('click');
                    // Right
                    if(code == 39) $('.nivo-lightbox-next').trigger('click');
				});
			}

			this.options.onInit.call(this);

        },

        showLightbox: function(e){
            var $this = this,
                currentLink = this.$el;

			// Check content
			var check = this.checkContent(currentLink);
			if(!check) return;

			e.preventDefault();
            this.options.beforeShowLightbox.call(this);
            var lightbox = this.constructLightbox();
            if(!lightbox) return;
            var content = lightbox.find('.nivo-lightbox-content');
            if(!content) return;

            $('body').addClass('nivo-lightbox-body-effect-'+ this.options.effect);

			this.processContent( content, currentLink );

            // Nav
            if(this.$el.attr('data-lightbox-gallery')){
                var galleryItems = $('[data-lightbox-gallery="'+ this.$el.attr('data-lightbox-gallery') +'"]');

                $('.nivo-lightbox-nav').show();

				// Prev
                $('.nivo-lightbox-prev').off('click').on('click', function(e){
                    e.preventDefault();
                    prevNextFlag = 'P';
                    $this.contentFrameOutEffect();
                    var index = galleryItems.index(currentLink);
                    currentLink = galleryItems.eq(index - 1);
                    if(!$(currentLink).length) currentLink = galleryItems.last();
                    setTimeout(function(){
                        $this.processContent(content, currentLink);
                        $this.options.onPrev.call(this, [ currentLink ]);
                    }, 250);
                });

                // Next
                $('.nivo-lightbox-next').off('click').on('click', function(e){
                    e.preventDefault();
                    prevNextFlag = 'N';
                    $this.contentFrameOutEffect();
                    var index = galleryItems.index(currentLink);
                    currentLink = galleryItems.eq(index + 1);
                    if(!$(currentLink).length) currentLink = galleryItems.first();
                    setTimeout(function(){
                        $this.processContent(content, currentLink);
                        $this.options.onNext.call(this, [ currentLink ]);
                    }, 250);
                });
            }

            setTimeout(function(){
                lightbox.addClass('nivo-lightbox-open');
                $this.options.afterShowLightbox.call(this, [ lightbox ]);
            }, 1); // For CSS transitions
        },

		checkContent: function( link ) {
			var $this = this,
                href = link.attr('href'),
                video = href.match(/(youtube|youtube-nocookie|youtu|vimeo)\.(com|be)\/(watch\?v=([\w-]+)|([\w-]+))/);

            if(href.match(/\.(jpeg|jpg|gif|png)$/i) !== null){
				return true;
			}
			// Video (Youtube/Vimeo)
            else if(video){
				return true;
			}
			// AJAX
			else if(link.attr('data-lightbox-type') == 'ajax'){
				return true;
			}
			// Inline HTML
			else if(href.substring(0, 1) == '#' && link.attr('data-lightbox-type') == 'inline'){
				return true;
			}
			// iFrame (default)
			else if(link.attr('data-lightbox-type') == 'iframe'){
				return true;
			}

			return false;
		},

        processContent: function(content, link){
            var $this = this,
                href = link.attr('href'),
                video = href.match(/(youtube|youtube-nocookie|youtu|vimeo)\.(com|be)\/(watch\?v=([\w-]+)|([\w-]+))/),
                nLBoxWrap = $('.nivo-lightbox-wrap');

            nLBoxWrap.removeClass('nivo-lightbox-content-zoom-in-div').addClass('nivo-lightbox-content-zoom-out-div');
            content.html('').addClass('nivo-lightbox-loading');
            $('body').addClass('nivo-lightbox-anchorage-body');

            // Is HiDPI?
            if(this.isHidpi() && link.attr('data-lightbox-hidpi')){
                href = link.attr('data-lightbox-hidpi');
            }

            // Image
            if(href.match(/\.(jpeg|jpg|gif|png)$/i) !== null){
                var img = $('<img>', { src: href });
                img.one('load', function() {
					var wrap = $('<div />', {
                        id: 'nivo-lightbox-alive-flow-content',
                        'class': 'nivo-lightbox-image'
                    });
                    wrap.append(img);
					content.html(wrap).removeClass('nivo-lightbox-loading');

					nLBoxWrap.removeClass('nivo-lightbox-content-zoom-out-div').addClass('nivo-lightbox-content-zoom-in-div');
					$(window).resize(function() {
						nLBoxWrap.removeClass('nivo-lightbox-content-zoom-out-div').addClass('nivo-lightbox-content-zoom-in-div');
					});

                    $this.contentFrameInEffect( wrap );
                    wrap.off('click').on('click', function(e){
                        e.preventDefault();
                        if(nLBoxWrap.hasClass('nivo-lightbox-content-zoom-in-div')){
                            nLBoxWrap.removeClass('nivo-lightbox-content-zoom-in-div').addClass('nivo-lightbox-content-zoom-out-div');
                            $('#nivo-lightbox-alive-flow-content').addClass('nivo-lightbox-image-zoom-out-div');
                        }
                        else {
                            nLBoxWrap.removeClass('nivo-lightbox-content-zoom-out-div').addClass('nivo-lightbox-content-zoom-in-div');
                            $('#nivo-lightbox-alive-flow-content').removeClass('nivo-lightbox-image-zoom-out-div');
                        }
                    });
				}).each(function() {
					if(this.complete) $(this).trigger('load');
				});

                img.on('error', function() {
					var wrap = $('<div class="nivo-lightbox-error"><p>'+ $this.options.errorMessage +'</p></div>');
                    content.html(wrap).removeClass('nivo-lightbox-loading');
                    $this.contentFrameInEffect( wrap );
				});
            }
            // Video (Youtube/Vimeo)
            else if(video){
                var src = '',
                    classTerm = 'nivo-lightbox-video';

                if(video[1] == 'youtube'){
                    src = '//www.youtube.com/embed/'+ video[4];
                    classTerm = 'nivo-lightbox-youtube';
                }
                if(video[1] == 'youtube-nocookie'){
                    src = href; //https://www.youtube-nocookie.com/embed/...
                    classTerm = 'nivo-lightbox-youtube';
                }
                if(video[1] == 'youtu'){
                    src = '//www.youtube.com/embed/'+ video[3];
                    classTerm = 'nivo-lightbox-youtube';
                }
                if(video[1] == 'vimeo'){
                    src = '//player.vimeo.com/video/'+ video[3];
                    classTerm = 'nivo-lightbox-vimeo';
                }

                if(src){
                    var iframeVideo = $('<iframe>', {
                        src: src,
                        id: 'nivo-lightbox-alive-flow-content',
                        'class': classTerm,
                        frameborder: 0,
                        vspace: 0,
                        hspace: 0,
                        scrolling: 'auto'
                    });
                    content.html(iframeVideo);
                    iframeVideo.on('load', function(){
                        content.removeClass('nivo-lightbox-loading');
                        $this.contentFrameInEffect( iframeVideo );
                    });
                }
            }
            // AJAX
            else if(link.attr('data-lightbox-type') == 'ajax'){
				$.ajax({
					url: href,
					cache: false,
					success: function(data) {
						var wrap = $('<div />', {
                            id: 'nivo-lightbox-alive-flow-content',
                            'class': 'nivo-lightbox-ajax'
                        });
						wrap.append(data);
						content.html(wrap).removeClass('nivo-lightbox-loading');

						// Vertically center html
						if(wrap.outerHeight() < content.height()){
							wrap.css({
								'position': 'relative',
								'top': '50%',
								'margin-top': -(wrap.outerHeight()/2) +'px'
							});
						}
						$(window).resize(function() {
							if(wrap.outerHeight() < content.height()){
								wrap.css({
									'position': 'relative',
									'top': '50%',
									'margin-top': -(wrap.outerHeight()/2) +'px'
								});
							}
						});

                       $this.contentFrameInEffect( wrap );
					},
					error: function(){
						var wrap = $('<div class="nivo-lightbox-error"><p>'+ $this.options.errorMessage +'</p></div>');
                        content.html(wrap).removeClass('nivo-lightbox-loading');
                        $this.contentFrameInEffect( wrap );
					}
				});
            }
            // Inline HTML
            else if(href.substring(0, 1) == '#' && link.attr('data-lightbox-type') == 'inline'){
                if($(href).length){
                    var wrap = $('<div />', {
                        id: 'nivo-lightbox-alive-flow-content',
                        'class': 'nivo-lightbox-inline'
                    });
					wrap.append($(href).clone().show());
                    content.html(wrap).removeClass('nivo-lightbox-loading');

                    // Vertically center html
					if(wrap.outerHeight() < content.height()){
						wrap.css({
							'position': 'relative',
							'top': '50%',
							'margin-top': -(wrap.outerHeight()/2) +'px'
						});
					}
					$(window).resize(function() {
						if(wrap.outerHeight() < content.height()){
							wrap.css({
								'position': 'relative',
								'top': '50%',
								'margin-top': -(wrap.outerHeight()/2) +'px'
							});
						}
					});

                    $this.contentFrameInEffect( wrap );
				} else {
					var wrapError = $('<div class="nivo-lightbox-error"><p>'+ $this.options.errorMessage +'</p></div>');
                    content.html(wrapError).removeClass('nivo-lightbox-loading');
                    $this.contentFrameInEffect( wrap );
				}
            }
            // iFrame (default)
            else if(link.attr('data-lightbox-type') == 'iframe'){
                var iframe = $('<iframe>', {
                    src: href,
                    id: 'nivo-lightbox-alive-flow-content',
                    'class': 'nivo-lightbox-item',
                    frameborder: 0,
                    vspace: 0,
                    hspace: 0,
                    scrolling: 'auto'
                });
                content.html(iframe);
                iframe.on('load', function(){
                    content.removeClass('nivo-lightbox-loading');
                    $this.contentFrameInEffect( iframe );
                });
            } else {
				return false;
			}

            // Set the title
            if(link.attr('title')){
                var titleWrap = $('<span>', { 'class': 'nivo-lightbox-title' });
                titleWrap.text(link.attr('title'));
                $('.nivo-lightbox-title-wrap').html(titleWrap);
            } else {
                $('.nivo-lightbox-title-wrap').html('');
            }
        },

        constructLightbox: function(){
            if($('.nivo-lightbox-overlay').length) return $('.nivo-lightbox-overlay');

            var overlay = $('<div>', { 'class': 'nivo-lightbox-overlay nivo-lightbox-theme-'+ this.options.theme +' nivo-lightbox-effect-'+ this.options.effect });
            var wrap = $('<div>', { 'class': 'nivo-lightbox-wrap' });
            var content = $('<div>', { 'class': 'nivo-lightbox-content' });
            var nav = $('<a href="#" class="nivo-lightbox-nav nivo-lightbox-prev">Previous</a><a href="#" class="nivo-lightbox-nav nivo-lightbox-next">Next</a>');
            var close = $('<a href="#" class="nivo-lightbox-close" title="Close">Close</a>');
            var title = $('<div>', { 'class': 'nivo-lightbox-title-wrap' });

            var isMSIE = /*@cc_on!@*/0;
            if(isMSIE) overlay.addClass('nivo-lightbox-ie');

            wrap.append(content);
            wrap.append(title);
            overlay.append(wrap);
            overlay.append(nav);
            overlay.append(close);
            $('body').append(overlay);

            var $this = this;
            if($this.options.clickOverlayToClose){
                overlay.on('click', function(e){
                    if(e.target === this || $(e.target).hasClass('nivo-lightbox-content') || $(e.target).hasClass('nivo-lightbox-image')){
                        $this.destructLightbox();
                        $('body').removeClass('nivo-lightbox-anchorage-body');
                    }
                });
            }

            close.on('click', function(e){
                e.preventDefault();
                $this.destructLightbox();
                $('body').removeClass('nivo-lightbox-anchorage-body');
            });

            return overlay;
        },

        destructLightbox: function(){
            var $this = this;
            this.options.beforeHideLightbox.call(this);

            $('.nivo-lightbox-overlay').removeClass('nivo-lightbox-open');
            $('.nivo-lightbox-nav').hide();
            $('body').removeClass('nivo-lightbox-body-effect-'+ $this.options.effect);

            // For IE
            var isMSIE = /*@cc_on!@*/0;
            if(isMSIE){
                $('.nivo-lightbox-overlay iframe').attr("src", " ");
                $('.nivo-lightbox-overlay iframe').remove();
            }

            // Remove click handlers
            $('.nivo-lightbox-prev').off('click');
            $('.nivo-lightbox-next').off('click');

            // Empty content (for videos)
            $('.nivo-lightbox-content').empty();

            this.options.afterHideLightbox.call(this);
        },

        isHidpi: function(){
			var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
                              (min--moz-device-pixel-ratio: 1.5),\
                              (-o-min-device-pixel-ratio: 3/2),\
                              (min-resolution: 1.5dppx)";
			if(window.devicePixelRatio > 1) return true;
			if(window.matchMedia && window.matchMedia(mediaQuery).matches) return true;
			return false;
		},

        contentFrameOutEffect: function(){
            if (prevNextFlag === 'P') {
                $('#nivo-lightbox-alive-flow-content').removeClass('nivo-lightbox-prev-content-effect nivo-lightbox-next-content-effect').addClass('nivo-lightbox-pre-prev-content-effect');
            }
            else if (prevNextFlag === 'N') {
                $('#nivo-lightbox-alive-flow-content').removeClass('nivo-lightbox-prev-content-effect nivo-lightbox-next-content-effect').addClass('nivo-lightbox-pre-next-content-effect');
            }
        },

        contentFrameInEffect: function( content ){
            if (prevNextFlag === 'P') {
                content.addClass('nivo-lightbox-prev-content-effect');
            }
            else if (prevNextFlag === 'N') {
                content.addClass('nivo-lightbox-next-content-effect');
            }
            prevNextFlag = null;
        }

    };

    $.fn[pluginName] = function(options){
        return this.each(function(){
            if(!$.data(this, pluginName)){
                $.data(this, pluginName, new NivoLightbox(this, options));
            }
        });
    };

})(jQuery, window, document);
