/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

// closure to avoid namespace collision
(function(){
	// creates the plugin
	tinymce.create('tinymce.plugins.mindmaps', {
		// creates control instances based on the control's id.
		// our button's id is "mygallery_button"
		init : function(id, controlManager) {
			id.addButton('Mindmaps_button',{
				title : 'Mindmaps', // title of the button
				image : '../wp-content/plugins/mindmaps/icon.jpg',  // path to the button's image
				onclick : function() {
					// triggers the thickbox
					var width = jQuery(window).width(), H = jQuery(window).height(), W = ( 720 < width ) ? 720 : width;
					W = W - 80;
					H = H - 84;
					tb_show( 'Insert Mindmaps', '#TB_inline?width=' + W + '&height=' + H + '&inlineId=Mindmaps-form' );
				}
			});
			
			return null;
		}
	});
	
	// registers the plugin. DON'T MISS THIS STEP!!!
	tinymce.PluginManager.add('Mindmaps', tinymce.plugins.mindmaps);
	
	// executes this when the DOM is ready
	jQuery(function(){
		// creates a form to be displayed everytime the button is clicked
		// you should achieve this using AJAX instead of direct html code like this
        var temp = '<div id="Mindmaps-form"><iframe name="iframe_mindmaps" id ="iframe_mindmaps" src="../wp-content/plugins/mindmaps/drichard-amindmaps/src/index.html" width="100%" height="100%"></iframe></div>';
		var form = jQuery(temp);
		
		form.appendTo('body').hide();
		
        // To call tinyMCE to insert Mindmaps to post editor , It is called in ExportMap.js
	});
})()
function getInsertImage(image_content)
{
    //alert(document.location.hostname);
    var current_url = document.getElementById('current_url_hidden').value;
    jQuery.ajax({
        url: getHomeUrl() + '/wp-content/plugins/mindmaps/contents.php',
        type: 'POST',
        data: {'comment_info':image_content,
               'current_url':current_url
            },
        success: function(msg){

        }
    });
    
    return image_content;
}

function getHomeUrl(){
	var current_url = window.location.href;
	var wpadmin_url = '/wp-admin/';
	var base_url = current_url.split(wpadmin_url); 
	return base_url[0];
}
