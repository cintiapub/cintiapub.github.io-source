(function($){
	$(document).ready(function() {
  	  $(document).foundation('topbar', 'reflow');
	  $('.image-link').magnificPopup({
	  	gallery: {
	     	enabled: true
	    },
	  	type:'image'
	  });
	});
})(jQuery);