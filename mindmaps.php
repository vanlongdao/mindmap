<?php
/*
 * Plugin Name: Mindmaps
 * Plugin URI: http://vanlongdao.wix.com/longdv-portfolio
 * Description: Mindmaps is used to create mindmap and export to image and insert to your post in Wordpress
 * Version: 1.0
 * Author: Long Dao
 * Author URI: http://vanlongdao.wix.com/longdv-portfolio
 * License: A "Slug" license name e.g. GPL2
 */

// Make sure we don't expose any info if called directly
ob_start ();

$site_url = get_option ( 'siteurl' );
class Mindmaps {
	function __construct() {
		define ( 'WP_LOAD_PATH', site_url () );
		add_action ( 'admin_menu', array (
				$this,
				'action_admin_init' 
		) );
	}
	function action_admin_init() {
		// only hook up these filters if we're in the admin panel, and the current user has permission
		// to edit posts and pages
		if (current_user_can ( 'edit_posts' ) && current_user_can ( 'edit_pages' )) {
			// Add setting dimension of mindmaps picture
			register_activation_hook ( __FILE__, 'Mindmaps_activate' );
			register_deactivation_hook ( __FILE__, 'Mindmaps_deactivate' );
			// CONTENT FILTER
			// add_filter('the_content', array($this, 'Mindmaps_Parse'));
			// add_action('admin_menu', array($this,'MindmapsAddPage'));
			add_options_page ( 'Mindmaps Options', 'Mindmaps', 'manage_options', 'mindmaps.php', array (
					$this,
					'mindmapsOptions' 
			) );
			// var_dump($var);
			// do_action('admin_menu');
			// var_dump($var1);
			
			add_filter ( 'mce_buttons', array (
					$this,
					'filter_mce_button' 
			) );
			add_filter ( 'mce_external_plugins', array (
					$this,
					'filter_mce_plugin' 
			) );
		}
	}
	function filter_mce_button($buttons) {
		// add a separation before our button, here our button's id is "Mindmaps_button"
		global $post;
		echo '<input type="hidden" name="current_url_hidden" id="current_url_hidden" value="' . $post->ID . '"></input>';
		array_push ( $buttons, '|', 'Mindmaps_button' );
		return $buttons;
	}
	function filter_mce_plugin($plugins) {
		// this plugin file will work the magic of our button
		$plugins ['Mindmaps'] = plugin_dir_url ( __FILE__ ) . '/Mindmaps_plugin.js';
		return $plugins;
	}
	function Mindmaps_Parse($content) {
		$content = preg_replace_callback ( "/\[mindmaps ([^]]*)\/\]/i", "Mindmaps_Render", $content );
		return $content;
	}
	function Mindmaps_Render($matches) {
		global $videoid, $site_url;
		$output = '';
		$rss_output = '';
		$matches [1] = str_replace ( array (
				'&#8221;',
				'&#8243;' 
		), '', $matches [1] );
		preg_match_all ( '/([.\w]*)=(.*?) /i', $matches [1], $attributes );
		$arguments = array ();
		
		foreach ( ( array ) $attributes [1] as $key => $value ) {
			// Strip out legacy quotes
			$arguments [$value] = str_replace ( '"', '', $attributes [2] [$key] );
		}
		
		if (! array_key_exists ( 'filename', $arguments ) && ! array_key_exists ( 'file', $arguments )) {
			return '<div style="background-color:#ff9;padding:10px;"><p>Error: Required parameter "file" is missing!</p></div>';
			exit ();
		}
		
		// Deprecate filename in favor of file.
		if (array_key_exists ( 'filename', $arguments )) {
			$arguments ['file'] = $arguments ['filename'];
		}
		
		$options = get_option ( 'MindmapsSettings' );
		
		if (strpos ( $arguments ['file'], 'http://' ) !== false || isset ( $arguments ['streamer'] ) || strpos ( $arguments ['file'], 'https://' ) !== false) {
			// This is a remote file, so leave it alone but clean it up a little
			$arguments ['file'] = str_replace ( '&#038;', '&', $arguments ['file'] );
		} else {
			$arguments ['file'] = $site_url . '/' . $arguments ['file'];
		}
		$output .= "\n";
		$output .= '</script>' . "\n";
		
		if (is_feed ()) {
			return $rss_output;
		} else {
			return $output;
		}
	}
	function MindmapsAddPage() {
		add_options_page ( 'Mindmaps Options', 'Mindmaps', 'manage_options', 'mindmaps.php', array (
				$this,
				'mindmapsOptions' 
		) );
	}
	function mindmapsOptions() {
		if (! current_user_can ( 'manage_options' )) {
			wp_die ( "You don't have sufficient permissions to access this page ." );
		}
		global $site_url;
		$message = '';
		$options = get_option ( 'MindmapsSettings' );
		if ($_POST) {
			if (isset ( $_POST ['width'] )) {
				$options ['width'] = $_POST ['width'];
			}
			if (isset ( $_POST ['height'] )) {
				$options ['height'] = $_POST ['height'];
			}
			
			update_option ( 'MindmapsSettings', $options );
			$message = '<div class="updated"><p>' . $options ['width'] . 'x' . $options ['height'] . '<strong>&nbsp; Options saved.</strong></p></div>';
		}
		echo '<div class="wrap">';
		echo '<h2>Mindmaps Options</h2>';
		echo $message;
		echo '<form method="post" action="options-general.php?page=mindmaps.php">';
		echo "<p>Welcome to the Mindmaps plugin options menu! Here you can set all width-height variables for your website.</p>";
		echo '<h3>Width-Height</h3>' . "\n";
		echo '<table class="form-table">' . "\n";
		echo '<tr><th scope="row">width</th><td>' . "\n";
		echo '<input type="text" name="width" value="' . $options ['width'] . '" />';
		echo '</td></tr>' . "\n";
		echo '<tr><th scope="row">height</th><td>' . "\n";
		echo '<input type="text" name="height" value="' . $options ['height'] . '" />';
		echo '</td></tr>' . "\n";
		echo '</table>' . "\n";
		
		echo '<p class="submit"><input class="button-primary" type="submit" method="post" value="Update Options"></p>';
		echo '</form>';
		
		echo '</div>';
	}
	function MindmapsLoadDefaults() {
		$freemind_preset = array ();
		$freemind_preset ['width'] = '800';
		$freemind_preset ['height'] = '400';
		return $freemind_preset;
	}
	function Mindmaps_activate() {
		update_option ( 'MindmapsSettings', MindmapsLoadDefaults () );
	}
	function Mindmaps_deactivate() {
		delete_option ( 'MindmapsSettings' );
	}
}

$Mindmaps = new Mindmaps ();
?>
 