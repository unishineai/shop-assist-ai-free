<?php
// Prevent direct access
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete all plugin options
delete_option('wp_ai_chatbot_api_url');
delete_option('wp_ai_chatbot_api_key');
delete_option('wp_ai_chatbot_title');
delete_option('wp_ai_chatbot_position');
delete_option('wp_ai_chatbot_theme');

// Clean up database tables if needed
// global $wpdb;
// $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}ai_chatbot_history");