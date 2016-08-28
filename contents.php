<?php
if ( ! defined( 'ABSPATH' ) )
{
	if($_POST['comment_info'])
	{
		if(!file_exists('wp_get_current_user')||!function_exists('add_action'))
		{
			require_once ('../../../wp-config.php');
		}
		$current_user = wp_get_current_user();
		//preg_match('/post=(.*)\?/', $_POST['current_url'],$post);
		echo $_POST['current_url'];
		$data = array(
				'comment_post_ID' => $_POST['current_url'],
				'comment_author' => $current_user->user_login,
				'comment_author_email' => $current_user->user_email,
				'comment_author_url' => $current_user->user_url,
				'comment_content' => $_POST['comment_info'],
				'user_id' =>$current_user->ID,
				'comment_date' => current_time('mysql'),
		);
		wp_insert_comment($data);

	}
	else
	{
		echo "Fail !";
	}
	//die( "Can't load this file directly" );
}
?>