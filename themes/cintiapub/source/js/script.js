'use strict';

(function($){

	var items, gallery;

	function startPhotoSwipe(container) {
		var $container = $(container);

		if ($container.length) {
			var $items = $container.find('a.image-link');

			items = buildItems($items);

			$items.on('click', onThumbnailsClick);

			$container.each(function(index, el){
				$(el).attr('data-pswp-uid', index + 1);
			});

			// Parse URL and open gallery if it contains #&pid=3&gid=1
			window.addEventListener('popstate', function(event) {
				openGalleryFromHash($container);
			});

			openGalleryFromHash($container);
		}
	}

	function onThumbnailsClick(e) {
		var $el = $(e.currentTarget);

		e.preventDefault();

		openPhotoSwipe($el.index('.image-link'), $el.closest('ul.image-grid')[0], true);
	}

	function openPhotoSwipe(index, galleryElement, disableAnimation, fromURL) {
		var pswpElement = $('.pswp')[0],
			options = {
				galleryUID: galleryElement.getAttribute('data-pswp-uid'),
		        getThumbBoundsFn: function(index) {
		            // See Options->getThumbBoundsFn section of docs for more info
		            var thumbnail = items[index].el.children[0],
		                pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
		                rect = thumbnail.getBoundingClientRect();
		            return {x:rect.left, y:rect.top + pageYScroll, w:rect.width};
		        },
		        addCaptionHTMLFn: function(item, captionEl, isFake) {
					if (!item.title) {
						captionEl.children[0].innerText = '';
						return false;
					}
					captionEl.children[0].innerHTML = item.type + ' for <a href="/tags/' + sanitize(item.client) + '">' + item.client + '</a> - ' + item.title + '<br/><small>' + item.description + '</small>';

					if (item.software) {
						captionEl.children[0].innerHTML += ' <small><b>Software</b>: ' + item.software + '.</small>'
					}
					return true;
		        },
		        index: fromURL? parseInt(index, 10) - 1: parseInt(index, 10),
		        shareEl: false
			},
			useLargeImages = false,
		    firstResize = true,
		    imageSrcWillChange, gallery;

	    if (isNaN(options.index)) {
			return;
		}

		if (disableAnimation) {
			options.showAnimationDuration = 0;
			options.hideAnimationDuration = 0;
		}

		if (gallery) {
			gallery.close();
		}

	    // Pass data to PhotoSwipe and initialize it
	    gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);

	    // see: http://photoswipe.com/documentation/responsive-images.html
		gallery.listen('beforeResize', function() {
			var dpiRatio = window.devicePixelRatio ? window.devicePixelRatio : 1;
			dpiRatio = Math.min(dpiRatio, 2.5);
		    var realViewportWidth = gallery.viewportSize.x * dpiRatio;
		    if(realViewportWidth >= 1200 || (!gallery.likelyTouchDevice && realViewportWidth > 800) || screen.width > 1200 ) {
		    	if(!useLargeImages) {
		    		useLargeImages = true;
		        	imageSrcWillChange = true;
		    	}

		    } else {
		    	if(useLargeImages) {
		    		useLargeImages = false;
		        	imageSrcWillChange = true;
		    	}
		    }
		    if(imageSrcWillChange && !firstResize) {
		        gallery.invalidateCurrItems();
		    }
		    if(firstResize) {
		        firstResize = false;
		    }
		    imageSrcWillChange = false;
		});
		gallery.listen('gettingData', function(index, item) {
		    if (item.w < 1 || item.h < 1) { // unknown size
		        var img = new Image();
		        img.onload = function() { // will get size after load
		        	item.w = this.width; // set image width
		        	item.h = this.height; // set image height
		            gallery.invalidateCurrItems(); // reinit Items
		            gallery.updateSize(true); // reinit Items
		        }
		    	img.src = item.src; // let's download image
		    }
		});

	    gallery.init();
	}

	function buildItems(container) {
		return $(container).map(function(index, el) {
			var $el = $(el);

			return {
				src: $el.attr('href'),
				w: 0,
				h: 0,
				el: el,
				mrsc: $el.find('img').attr('src'),
				title: $el.attr('title'),
				type: $el.data('type'),
				client: $el.data('client'),
				description: $el.data('description'),
				software: $el.data('software')? $el.data('software').replace('undefined', '').replace(',', ', '): ''
			};
		});
	}

	function openGalleryFromHash($container) {
		var hashData = photoSwipeParseHash();
		if (hashData.pid && hashData.gid) {
			openPhotoSwipe(hashData.pid, $container[hashData.gid - 1], true, true);
		}
	}

	function photoSwipeParseHash() {
		var hash = window.location.hash.substring(1),
	    params = {};
	    if(hash.length < 5) { // pid=1
	        return params;
	    }
	    var vars = hash.split('&');
	    for (var i = 0; i < vars.length; i++) {
	        if(!vars[i]) {
	            continue;
	        }
	        var pair = vars[i].split('=');
	        if(pair.length < 2) {
	            continue;
	        }
	        params[pair[0]] = pair[1];
	    }
	    if(params.gid) {
	    	params.gid = parseInt(params.gid, 10);
	    }
	    return params;
	}

	function sanitize(s) {
		var r = s.replace(new RegExp("\\s", 'g'),"-");
    r = r.replace(new RegExp("[àáâãäå]", 'g'),"a");
    r = r.replace(new RegExp("æ", 'g'),"ae");
    r = r.replace(new RegExp("ç", 'g'),"c");
    r = r.replace(new RegExp("[èéêë]", 'g'),"e");
    r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
    r = r.replace(new RegExp("ñ", 'g'),"n");
    r = r.replace(new RegExp("[òóôõö]", 'g'),"o");
    r = r.replace(new RegExp("œ", 'g'),"oe");
    r = r.replace(new RegExp("[ùúûü]", 'g'),"u");
    r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
    return r;
	}

	$(document).ready(function() {
		startPhotoSwipe('ul.image-carousel');

		if ($('#main-tabs').length > 0) {
			$(document).foundation();
		}

		webshim.activeLang('en');
		webshims.polyfill('forms');
		webshims.cfg.no$Switch = true;
	});
})(jQuery);