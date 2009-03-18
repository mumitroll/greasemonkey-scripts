// ==UserScript==
// @name          ImageFap enhancer
// @description	  enlarges thumbs, alternate gallery view, enhanced 'my clubs' page on ImageFap
// @include       *imagefap.com/*
// ==/UserScript==
// imageFapThumbSize.user.js

    var visits = GM_getObject('visits',{});

    var $;
    var pageTracker;
    var threads=8;
    var chunksize=50;
    var piccontainer;
    var preload = new Array();
    var pics = new Array();
    var showtimer;
    var idxOffset = 0;
    var randompage=window.location.href.match(/\/random\.php/);
    var gallerypage=window.location.href.match(/\/random\.php|\/gallery\/(.*)|\/gallery\.php\?p?gid=(.*)/);
	if( gallerypage && gallerypage[0] ) gallerypage = gallerypage[0].match(/[0-9]+/);
	    if( gallerypage && gallerypage[0] ) gallerypage = gallerypage[0];
	    else gallerypage = false;
    console.log(gallerypage);
    var myclubspage=window.location.href.match(/\/clubs\/myclubs\.php/)?true:false;
    var clubspage=window.location.href.match(/\/clubs\/index\.php\?cid=(.*)/);
    if( clubspage )
	clubspage=clubspage[1];
    // Add jQuery
    var GM_JQ = document.createElement('script');
    GM_JQ.src = 'http://ajax.googleapis.com/ajax/libs/jquery/1.3.1/jquery.js';
    GM_JQ.type = 'text/javascript';
    document.getElementsByTagName('body')[0].appendChild(GM_JQ);
    // Add evil Tracking code
    var GM_GA = document.createElement('script');
    GM_GA.src = 'http://www.google-analytics.com/ga.js';
    GM_GA.type = 'text/javascript';
    document.getElementsByTagName('body')[0].appendChild(GM_GA);

// Check if jQuery and evil Tracking code loaded
    function GM_wait() {
        if(typeof unsafeWindow.jQuery == 'undefined') console.log("waiting for jquery");
	else { $ = unsafeWindow.jQuery.noConflict(); }
        if(typeof unsafeWindow._gat == 'undefined') console.log("waiting for ga");
	else { pageTracker = unsafeWindow._gat._getTracker("UA-7978064-1"); }
	if( $ && pageTracker ) {
		pageTracker._trackPageview();
		window.setTimeout(payload,100);
	}
	else window.setTimeout(GM_wait,100);
    }
    GM_wait();
    function showimg( pic, replace ) {
	$('img',thumbholder).css({borderColor:'#fff'});
	piccontainer.children().css({position:'absolute'}).attr('showing',0);
	piccontainer.show();
	showpic = $('[src='+pic.url+']');
	showpic.css({position:'static'})
 	       .attr('showing',1)
               .click(function(){
                   $(this).css({position:'absolute'}).attr('showing',0);
		   piccontainer.hide();
               });
	$('img[src="'+showpic.data('thumb')+'"]').css({borderColor:'#f00'});
    }


    function payload() {
	console.log('payload started');
        resize_thumbs();
        if( gallerypage || randompage )
            create_alternate_gallery();
        if( myclubspage )
            enhance_myclubs();
        if( clubspage )
	    save_clubvisit( clubspage );
    }
    function resize_thumbs() {
	$('img').each(function () {
		var s = this.src.search(/\/images\/mini\//);
		if( s != -1 ) {
			$(this).replaceWith('<img border="0" src="'+this.src.replace(/images\/mini\//, "images/thumb/")+'">');
		}
	});
    }
    function save_clubvisit( clubid ) {
	GM_log('club '+clubid+' visited');
	dt=new Date();
	visits['club_'+clubid] = dt.getTime();
	GM_setObject('visits', visits); 
    }
    function create_alternate_gallery() {
	var numfound=0;
	if( gallerypage ) {
	   favlink = $('#gallery').next('a').eq(0);
		serverPaging=$('#gallery font').eq(0);
	    profileLinks = $('#menubar').appendTo('body').append(favlink);
		serverPaging.appendTo('#menubar').wrap('<div style="position: absolute;top:0;left:0;background:#fff"></div>');
            $('<div style="float:left;">paging:<a href="/gallery.php?gid='+gallerypage+'&view=1">server</a> | <a href="/gallery.php?gid='+gallerypage+'&view=2">client</a></div>').prependTo('#menubar');
	}
	thumbholder = $('<div style="position:static; float:right; width: 255px; height: 100%; overflow-x: hidden; overflow-y:scroll"></div>')
			.appendTo($('body'));
	thumbholder.css({marginTop:-($('#menubar').height()+2)});

	piccontainer = $('<div style="position:relative;;float:left;255px;height:100%;"></div>').appendTo($('body'));
	piccontainer.hide();
	var w=$('#menubar').width();
	if( !w )
		w=$('body').width();
	piccontainer.css({width:w-255});
	piccontainer.css({marginTop:-($('#menubar').height()+2)});
	piccontainer.bind('DOMMouseScroll',function(e){
		var idx = 0;
                var dir = 0;
		$.each(pics,function(i,item){
			lookfor = $('img[showing=1]',piccontainer).attr('src');
			if( item.url == lookfor ) idx=i;
                });

		if( e.detail > 0)
			dir=1;
                  
		else if( e.detail < 0 )
			dir=-1;

		if( showtimer ) {
			clearTimeout( showtimer );
			idxOffset+=dir;
		}
		idx = idx + dir + idxOffset;
		if( idx > pics.length-1)
			idx=pics.length-1;
		else if( idx < 0 )
			idx=0;

		showtimer=setTimeout(function(){
			idxOffset = 0;
			showimg( pics[idx] );
			showtimer = false;
		},25);
			
	        $('img[src="'+pics[idx].thumb+'"]').get(0).scrollIntoView(false);
                });
	
	$('a[href*=image.php?id=]').each(function(){
	    $(this).appendTo(thumbholder);
	    var pic = $(this).find('img').eq(0);
	    if( pic.attr && pic.attr('src') ) {
	        var picurl = pic.attr('src').replace(/thumb/,"full" );
                var picobj = {pic:pic,url:picurl,thumb:pic.attr('src')};
		preload.push(picobj);
		pics.push(picobj);
		pic.css({maxWidth:'120px',maxHeight:'120px',display:'none'});
		$(this).mouseover(function(){ showimg(picobj); return false; });
		numfound++;
	    } 
	});
	$('body > center:first-child').remove();
	if( numfound > 0 ) {
		infodiv=$('<div>converted '+numfound+' links</div>')
                         .appendTo('body')
                         .css({position:'fixed',bottom:0,right:0,color:'#aaa',background:'#fff',padding:'5px',margin:'5px',
                               border:'1px solid #88f',fontFamily:'arial narrow'});

		var prev = false;
		var pos_in_chunk=0;
		loadfunction = function() {
		    try{
		        if( $(this).data('prev') ) {
			    $(this).data('prev').pic.css({opacity:'1'});
			}
			if( pos_in_chunk++ < chunksize ) {
			    if(preload[0]) {
				infodiv.empty().append(preload.length+' left');
				var next=preload.shift();
				next.pic.css({opacity:'0.5',border:'3px solid #fff',display:'inline'});
				$(this).clone(true).appendTo(piccontainer)
                                   .data('prev',next).data('thumb',next.thumb)
                                   .attr('src',next.url);
			    } else {
				infodiv.empty().append('done.');
				setTimeout(function(){infodiv.hide();},2000);
			    }
			} else {
			    if( !infodiv.data('waiting') ){
				infodiv.append('<br/>continue').bind('click',startLoads);
				infodiv.data('waiting',true);
			    }
			}
		    } catch(e){};
		}
		startLoads = function() {
		    pos_in_chunk=0;
		    infodiv.data('waiting',false);
		    for( var i=0; i < threads; i++ )
			setTimeout(function(){img.clone(true).trigger('load');},i*200);
		 
		}
		try {
			var img = $('<img>')
				   .css({'position':'absolute','left':'-5000px'})
                                   .css({maxHeight:'100%',maxWidth:'100%',marginRight:'255px'})
			           .appendTo(piccontainer);
                             
					
			img.bind('load', loadfunction );
			startLoads();
		} catch(e){ console.log(e); }
	}
    }
    
    function enhance_myclubs() {
	GM_log( 'i has myclubs' );
        $( "td[width='100%'][valign='top'] table" ).each( function() {
	    var glink=$( "tr:nth-child(2) ;a[href*='clubs/index.php?cid=']", this ).attr( 'href' );
	    if ( glink ) {
		var gid = glink.match( /cid=(.*)/ )[ 1 ];
		var td = $( "tr:nth-child(2) td:nth-child(2)", this );
		var display = $( "tr:nth-child(2) td:nth-child(3)", this );
		td.append( '<div id="club_'+gid+'">');
		var gdiv = $( '#club_' + gid );
		gdiv.data( 'lastvisit', visits[ 'club_'+gid ] );
		gdiv.hide().load( glink + ' font span', {}, function()
                {
		    $('span',this).each(function(){
			if( gdate=this.innerHTML.match(/([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/) )
			{
			    var clubid = $(this).parent().attr('id');
                            var lastvisit = $(this).parent().data('lastvisit');
			    var lastmod= new Date(gdate[1], parseInt(gdate[2])-1, gdate[3],gdate[4],gdate[5],gdate[6]);
			    display =$(this).parent().parent().parent().children();
			    GM_log( clubid+' lastmod:'+ lastmod.getTime()+ ' lastvisit:'+ lastvisit );
			    if( lastmod.getTime() > lastvisit || lastvisit == undefined )
				display.css({background:'#FFE2C5'});
			    else
				display.css({background:'#e2FFC5'});
				
//			    console.log( clubid+' lastvisit: '+lastvisit);
//			    console.log( clubid+' lastmod: '+lastmod);
//			    $(this).parent().parent().next().append(lastmod.toLocaleString());
			    return false;
			}
		    });
		});
	    }
        });
    }
function GM_getObject(key, defaultValue) {
        return (new Function('', 'return (' + GM_getValue(key, 'void 0') + ')'))() || defaultValue;
}

function GM_setObject(key, value) {
        GM_setValue(key, value.toSource());
}

