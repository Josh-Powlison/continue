
var properties=document.querySelectorAll(".obj-name");
for(var i=0;i<properties.length;i++){
	properties[i].addEventListener("mouseover",function(){
		if(document.querySelector('.obj-name-study')) document.querySelector('.obj-name-study').classList.remove('obj-name-study');
		
		this.classList.add('obj-name-study');
		
		document.getElementById("propertyExplanation").innerHTML="<strong>"+this.innerHTML+"</strong>: "+(propertyInfo[this.innerHTML]);
	});
}

var propertyInfo={
	window:"The element to put Showpony into. Ideally a div. If unset or <em>null</em>, will create an element."
	,start:"What file to start at if one isn't set in the querystring or bookmark. Can be a number or <em>'last'</em>. Defaults to <em>'last'</em>"
	,get:"If set to a folder, will automatically get all files in that folder (unless they're not ready to be released yet, more info in the Wiki). If an array of paths to files, will just get those files. [lang] will be replaced with the <strong>language</strong> value and can be placed anywhere in the <strong>get</strong> value. Defaults to 'files/[lang]/'"
	,language:"The language to use. Defaults to <em>'en'</em>"
	,scrubLoad:"If <em>false</em>, don't load files while scrubbing. If <em>true</em>, load files while scrubbing. Defaults to <em>false</em>"
	,info:"The text displayed at the top of Showpony. Defaults to <em>'[Current File] | [Files Left]'</em>"
	,credits:"The text displayed at the bottom-right of Showpony. Can write CompanyName.logo to automatically load in a logo from simpleicons.org. If <em>null</em>, no credits are shown. Defaults to <em>null</em>."
	,data:"An object that can be used to save user data. Defaults to <em>{}</em>"
	,defaultDuration:"The assumed length for files without a duration in their filename. For comics or media where you want all pieces represented the same in the URL, you may want to go with <em>1</em>. Defaults to <em>10</em>"
	,title:"Info to show in the website title that shows up in the tab. If null, won't impact the website title. Defaults to null"
	,dateFormat:"How to format dates. Defaults to <em>{year:'numeric',month:'numeric',day:'numeric'}</em>"
	,admin:"Whether or not to allow use of the admin panel, set up in the PHP file. Defaults to <em>false</em>"
	,query:"The text in the search bar that tracks where you're at in the story. If <em>false</em>, no query is used. Defaults to <em>'part'</em>"
	,shortcuts:"Allows keyboard shortcuts for Showpony. <em>'always'</em> means always use shortcut keys. <em>'focus'</em> means only when the element is focused on. <em>'fullscreen'</em> means only when Showpony is fullscreened. <em>false</em> means don't allow shortcut keys. Defaults to <em>'focus'</em>"
	,saveId:"The id to use for saving bookmarks, both locally and remotely. Defaults to <em>location.hostname.substring(0,20)</em>"
	,remoteSave:"Save user bookmarks remotely to a user's Hey Bard account, so they can be accessed from any machine. If the user loads the webpage without a query, the bookmark will automatically be loaded. Defaults to <em>true</em>"
	,localSave:"Save user bookmarks locally. If the user loads the webpage without a query, the bookmark will automatically be loaded. Defaults to <em>false</em>"
	,bookmark:"<em>'file'</em> means queries and bookmarks are saved based on the current file. <em>'time'</em> means it's based on the total time we are into the story. Defaults to <em>'file'</em>"
	,preloadNext:"Preload upcoming files. Can set to any positive integer you like, or to 0 to not preload. This will affect bandwidth usage, so consider your viewership and the size of your files; for example, preloading the next video file might be a bad idea. Defaults to <em>1</em>"
	,showBuffer:"Show the file buffer at the top. For media where loading is incredibly fast, displaying this might just be weird. Defaults to <em>true</em>"
	,subtitles:"Add in the languages and types you want to support; closed captions should also go in here. Full name and link to the folders where they are. Their names should be the same as the corresponding file names! <em>null</em> means subtitles aren't supported. Defaults to <em>null</em>"
	,cover:"Create a cover that shows up before you start the story. It disappears once you click on it or if you're loading a local or remote bookmark. Will play media once closed. If you don't want a cover, set it to <em>null</em>. Set <em>image</em> to a background image or <em>null</em>; set <em>content</em> to containing content (with or without HTML) or <em>null</em>. Both default to <em>null</em>. Cover as a whole defaults to <em>null</em>"
	,infiniteScroll:"Text and images only. Sets all content into a scrollable box and automatically adds content above and below as you scroll. Defaults to <em>false</em>"
};