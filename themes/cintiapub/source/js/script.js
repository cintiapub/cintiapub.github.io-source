'use strict';

(function($){

	var items;

	function startPhotoSwipe(container) {
		var $container = $(container),
			$items = $container.find('a.image-link'),
			hashData;

		items = buildItems($items);

		$items.on('click', onThumbnailsClick);

		$container.each(function(index, el){
			$(el).attr('data-pswp-uid', index + 1);				
		});

		// Parse URL and open gallery if it contains #&pid=3&gid=1
		hashData = photoSwipeParseHash();
		if (hashData.pid && hashData.gid) {
			openPhotoSwipe(hashData.pid, $container[hashData.gid - 1], true, true );
		}
	}

	function onThumbnailsClick(e) {
		var $el = $(e.currentTarget);

		e.preventDefault();

		openPhotoSwipe($el.index('.image-link'), $el.closest('ul.image-grid')[0] );
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
					captionEl.children[0].innerHTML = item.title +  '<br/><small>' + item.description + '</small>';
					return true;
		        },
		        index: fromURL? parseInt(index, 10) - 1: parseInt(index, 10)
			},
			useLargeImages = false,
		    firstResize = true,
		    imageSrcWillChange, gallery;

	    if (isNaN(options.index)) {
			return;
		}

		if (disableAnimation) {
			options.showAnimationDuration = 0;
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
				w: 0,//$el.data('width'),
				h: 0,//$el.data('height'),
				el: el,
				mrsc: $el.find('img').attr('src'),
				title: $el.attr('title'),
				description: $el.data('description'),
				m: {
					src: $el.data('med-href'),
					w: $el.data('med-width'),
					h: $el.data('med-height')
				},
				o: {
					src: $el.attr('href'),
					w: $el.data('width'),
					h: $el.data('height')
				}
			};
		});
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

	$(document).ready(function() {
  	  $(document).foundation('topbar', 'reflow');
	  startPhotoSwipe('ul.image-grid');
	});
})(jQuery);