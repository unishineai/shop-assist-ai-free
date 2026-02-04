<?php
/*
Plugin Name: UniShine Shop Assist — AI Chatbot
Plugin URI: https://chatbot.unishineai.dpdns.org/
Description: Add an intelligent AI chatbot to your WordPress site in 1 minute. Engage visitors, answer questions 24/7. Get your free API key from our SaaS platform.
Version: 1.0.1
Author: UniShine AI
Author URI: https://unishineai.dpdns.org/
License: GPL v2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
Text Domain: shop-assist-ai
Requires at least: 5.8
Requires PHP: 7.4
*/

if (!defined('ABSPATH')) exit;

class Shop_Assist_AI_Free {
    private $api_base_url;
    private $api_key;
    private $plugin_version = '1.0.1';
    
    
    
    private function convert_api_url_for_container($api_url) {
        if (preg_match('#^(https?://)?(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)#', $api_url, $matches)) {
            $parsed = wp_parse_url($api_url);
            $scheme = $parsed['scheme'] ?? 'http';
            $port = $parsed['port'] ?? 80;

            return $scheme . '://172.18.0.1:' . $port;
        }
        return $api_url;
    }
    

    public function __construct() {
            add_action('admin_menu', [$this, 'add_admin_menu']);
            add_action('admin_enqueue_scripts', [$this, 'admin_enqueue_scripts']);
            add_action('wp_footer', [$this, 'add_chat_widget']);
            add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
            add_shortcode('shop_assist_ai', [$this, 'shortcode']);
                    register_activation_hook(__FILE__, [$this, 'activate']);
                    register_deactivation_hook(__FILE__, [$this, 'deactivate']);
                    
                    // AJAX handlers
                    add_action('wp_ajax_shop_assist_ai_check_api', [$this, 'check_api_connection']);
                    add_action('wp_ajax_nopriv_shop_assist_ai_check_api', [$this, 'check_api_connection']);
                    add_action('wp_ajax_shop_assist_ai_get_usage', [$this, 'get_usage_stats']);
                    add_action('wp_ajax_nopriv_shop_assist_ai_get_usage', [$this, 'get_usage_stats']);
            
            // Initialize configuration
            $this->init();
    }
    
public function init() {
        $this->api_base_url = get_option('shop_assist_ai_api_url', '');
        $this->api_key = get_option('shop_assist_ai_api_key', '');
    }
    
    public function activate() {
        // Add default options on activation
        add_option('shop_assist_ai_api_url', '');
        add_option('shop_assist_ai_api_key', '');
        add_option('shop_assist_ai_title', 'AI Assistant');
        add_option('shop_assist_ai_position', 'bottom-right');
        add_option('shop_assist_ai_theme', 'blue');
    }
    
    public function deactivate() {
        // Cleanup on deactivation (optional)
    }
    
    public function add_admin_menu() {
        add_menu_page(
            'Shop Assist AI',
            'Shop Assist AI',
            'manage_options',
            'unishine-shop-assist-free',
            [$this, 'admin_page'],
            'dashicons-format-chat',
            30
        );
    }
    
    public function admin_enqueue_scripts($hook) {
        // Only load on our admin page
        if ('toplevel_page_unishine-shop-assist-free' !== $hook) {
            return;
        }
        
        // Load jQuery (built-in with WordPress)
        wp_enqueue_script('jquery');
        
        // Load admin JavaScript
        wp_enqueue_script(
            'unishine-shop-assist-admin',
            plugins_url('assets/js/unishine-shop-assist-admin.js', __FILE__),
            ['jquery'],
            $this->plugin_version,
            true
        );
        
        // Localize script with configuration
        $api_url = get_option('shop_assist_ai_api_url', '');
        $api_key = get_option('shop_assist_ai_api_key', '');
        $saas_url = 'https://chatbot.unishineai.dpdns.org';
        
        wp_localize_script('unishine-shop-assist-admin', 'unishineShopAssist', array(
            'apiUrl' => esc_js($api_url),
            'apiKey' => esc_js($api_key),
            'saasUrl' => esc_js($saas_url),
            'nonce' => wp_create_nonce('shop_assist_ai_check_api')
        ));
    }
    
    public function admin_page() {
        // === Security Patch Start ===
        // 1. Check admin permissions
        if (!current_user_can('manage_options')) {
            wp_die('You do not have sufficient permissions to access this page.');
        }
        // 2. Handle form submission and verify Nonce
        if (isset($_POST['save'])) {
            // Verify Nonce to prevent CSRF attacks
            if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'shop_assist_ai_settings')) {
                wp_die('Security check failed. Please try again.');
            }
            update_option('shop_assist_ai_api_url', sanitize_text_field(wp_unslash($_POST['api_url'] ?? '')));
            update_option('shop_assist_ai_api_key', sanitize_text_field(wp_unslash($_POST['api_key'] ?? '')));
            update_option('shop_assist_ai_title', sanitize_text_field(wp_unslash($_POST['title'] ?? '')));
            update_option('shop_assist_ai_position', sanitize_text_field(wp_unslash($_POST['position'] ?? '')));
            update_option('shop_assist_ai_theme', sanitize_text_field(wp_unslash($_POST['theme'] ?? '')));
            echo '<div class="notice notice-success"><p><strong>✅ Settings saved successfully!</strong></p></div>';
        }
        // === Security Patch End ===
        
        // Get current settings
        $api_url = get_option('shop_assist_ai_api_url', '');
        $api_key = get_option('shop_assist_ai_api_key', '');
        $title = get_option('shop_assist_ai_title', 'AI Assistant');
        $position = get_option('shop_assist_ai_position', 'bottom-right');
        $theme = get_option('shop_assist_ai_theme', 'blue');
        
        // SaaS platform URL (extracted from API URL)
        $saas_url = '';
        if ($api_url) {
            $parsed = wp_parse_url($api_url);
            $saas_url = $parsed['scheme'] . '://' . $parsed['host'];
        }
        
        ?>
        <div class="wrap">
            <div style="margin-bottom: 30px; padding: 25px 30px; background: linear-gradient(135deg, #ff7a00 0%, #ffb74d 100%); border-radius: 16px; box-shadow: 0 8px 24px rgba(255, 122, 0, 0.3); position: relative; overflow: hidden; display: flex; align-items: center; gap: 20px;">
                <!-- Decorative circles -->
                <div style="position: absolute; top: -60px; right: -60px; width: 180px; height: 180px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -40px; left: -40px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                
                <div style="position: relative; z-index: 1; flex-shrink: 0;">
                    <img src="<?php echo esc_url(plugins_url('assets/images/logo.svg', __FILE__)); ?>" alt="Shop Assist AI" style="height: 64px; width: auto; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));" />
                </div>
                
                <div style="position: relative; z-index: 1; flex: 1;">
                    <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: white; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">Shop Assist AI - Free</h1>
                    <p style="margin: 0; font-size: 16px; color: white; opacity: 0.95; font-weight: 400;">Settings Dashboard</p>
                </div>
                
                <div style="position: relative; z-index: 1; flex-shrink: 0;">
                    <span style="font-size: 48px;">🤖</span>
                </div>
            </div>
            
            <div style="margin: 25px 0; padding: 20px 25px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-left: 4px solid #ff7a00; border-radius: 8px; box-shadow: 0 2px 8px rgba(255, 122, 0, 0.1);">
                <p style="margin: 0 0 15px 0; font-size: 18px; font-weight: 600; color: #ff7a00;"><strong>📖 How to use:</strong></p>
                <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
                    <li style="margin-bottom: 10px;"><strong>Get API Key</strong>: Visit <a href="https://chatbot.unishineai.dpdns.org/login" target="_blank" style="color: #ff7a00; text-decoration: none; font-weight: 500;" onmouseover="this.style.textDecoration='underline';" onmouseout="this.style.textDecoration='none';">SaaS Platform</a>, register and get your API Key</li>
                    <li style="margin-bottom: 10px;"><strong>Fill configuration</strong>: Enter API URL and API Key in the fields below</li>
                    <li style="margin-bottom: 10px;"><strong>Save settings</strong>: Click "Save Settings" button</li>
                    <li><strong>View result</strong>: Visit your website frontend, you'll see the chat button 💬 in the bottom-right corner</li>
                </ol>
            </div>
            
            <!-- Conversion Optimization Banner -->
            <div style="text-align: center; margin: 30px 0; padding: 35px 25px; background: linear-gradient(135deg, #ff7a00 0%, #ffb74d 100%); border-radius: 16px; color: white; box-shadow: 0 8px 24px rgba(255, 122, 0, 0.3); position: relative; overflow: hidden;">
                <!-- Decorative circles -->
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                
                <div style="position: relative; z-index: 1;">
                    <h2 style="color: white; margin-top: 0; margin-bottom: 15px; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">🚀 Get Your FREE API Key & Start in 1 Minute</h2>
                    <p style="font-size: 17px; margin-bottom: 25px; line-height: 1.6; opacity: 0.95;">No credit card required. Includes 50 Q/A pairs, 5,000 words, and 200 chats/month.</p>
                    <a href="https://chatbot.unishineai.dpdns.org/login?source=wp_plugin" target="_blank" 
                       style="background: white; color: #ff7a00; padding: 14px 40px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; margin-top: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); transition: all 0.3s ease; font-size: 16px;"
                       onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 0, 0, 0.3)';"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.2)';">
                       👉 Get My Free Key Now
                    </a>
                    <p style="margin-top: 20px; font-size: 0.95em; opacity: 0.9; font-weight: 500;">Then paste it below ↓</p>
                </div>
            </div>
            
            <form method="post">
                <?php wp_nonce_field('shop_assist_ai_settings'); ?>
                
                <div style="margin: 35px 0 25px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border-left: 4px solid #ff7a00;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">🔌</span>
                    <span style="color: #ff7a00;">API Connection Configuration</span>
                </h2>
                <table class="form-table">
                    <tr>
                        <th scope="row" style="width: 150px;"><label for="api_url" style="font-weight: 600; color: #333;">API URL</label></th>
                        <td>
                            <input type="text" id="api_url" name="api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" placeholder="https://chatbot.unishineai.dpdns.org" style="width: 100%; max-width: 500px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ff7a00';" onblur="this.style.borderColor='#e0e0e0';">
                            <p class="description" style="margin-top: 8px; color: #666; font-size: 13px;">
                                SaaS platform API address<br>
                                Example: https://chatbot.unishineai.dpdns.org
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="api_key" style="font-weight: 600; color: #333;">API Key</label></th>
                        <td>
                            <input type="text" id="api_key" name="api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" placeholder="app-xxxxxxxxxxxx" style="width: 100%; max-width: 500px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ff7a00';" onblur="this.style.borderColor='#e0e0e0';">
                            <p class="description" style="margin-top: 8px; color: #666; font-size: 13px;">
                                API key obtained from SaaS platform<br>
                                Format: app-xxxxxxxxxxxxxxxxxxxx
                            </p>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="margin: 25px 0; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border-left: 4px solid #ff7a00;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">🎨</span>
                    <span style="color: #ff7a00;">Chat Window Configuration</span>
                </h2>
                <table class="form-table">
                    <tr>
                        <th scope="row" style="width: 150px;"><label for="title" style="font-weight: 600; color: #333;">Chat Title</label></th>
                        <td><input type="text" name="title" value="<?php echo esc_attr($title); ?>" class="regular-text" style="width: 100%; max-width: 500px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ff7a00';" onblur="this.style.borderColor='#e0e0e0';"></td>
                    </tr>
                    <tr>
                        <th style="font-weight: 600; color: #333;">Display Position</th>
                        <td>
                            <select name="position" style="width: 100%; max-width: 500px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; cursor: pointer; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ff7a00';" onblur="this.style.borderColor='#e0e0e0';">
                                <option value="bottom-right" <?php selected($position, 'bottom-right'); ?>>Bottom Right</option>
                                <option value="bottom-left" <?php selected($position, 'bottom-left'); ?>>Bottom Left</option>
                                <option value="top-right" <?php selected($position, 'top-right'); ?>>Top Right</option>
                                <option value="top-left" <?php selected($position, 'top-left'); ?>>Top Left</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th style="font-weight: 600; color: #333;">Theme Color</th>
                        <td>
                            <select name="theme" style="width: 100%; max-width: 500px; padding: 10px 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 14px; cursor: pointer; transition: border-color 0.3s;" onfocus="this.style.borderColor='#ff7a00';" onblur="this.style.borderColor='#e0e0e0';">
                                <option value="blue" <?php selected($theme, 'blue'); ?>>Blue</option>
                                <option value="green" <?php selected($theme, 'green'); ?>>Green</option>
                                <option value="red" <?php selected($theme, 'red'); ?>>Red</option>
                                <option value="purple" <?php selected($theme, 'purple'); ?>>Purple</option>
                                <option value="dark" <?php selected($theme, 'dark'); ?>>Dark</option>
                            </select>
                        </td>
                    </tr>
                </table>
            </div>

            <div style="margin: 25px 0; text-align: center;">
                <input type="submit" name="save" class="button button-primary" value="💾 Save Settings" style="background: linear-gradient(135deg, #ff7a00 0%, #ffb74d 100%); border: none; padding: 14px 50px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3); transition: all 0.3s ease; cursor: pointer;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 122, 0, 0.4)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(255, 122, 0, 0.3)';">
            </div>
            </form>
            
            <div style="margin: 40px 0; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border-left: 4px solid #ff7a00;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">📊</span>
                    <span style="color: #ff7a00;">Usage Statistics</span>
                </h2>
                <div id="usage-stats" style="padding: 20px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                    <p style="text-align: center; color: #ff7a00; font-size: 16px; margin: 0;">⏳ Loading statistics...</p>
                </div>

                <div id="upgrade-banner" style="margin-top: 25px; padding: 25px; background: linear-gradient(135deg, #ff7a00 0%, #ffb74d 100%); border-radius: 12px; color: white; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3); display: none; position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                    <div style="position: relative; z-index: 1;">
                        <h3 style="margin: 0 0 15px 0; font-size: 20px; color: white;">⬆️ Upgrade to Pro</h3>
                        <p style="margin: 0 0 15px 0; font-size: 15px; opacity: 0.95;">Reached free version limits? Upgrade to Pro for more features:</p>
                        <ul style="margin: 0 0 20px 0; padding-left: 20px; line-height: 1.8;">
                            <li>500 Q/A pairs (10x more)</li>
                            <li>50,000 words (10x more)</li>
                            <li>5,000 chats/month (25x more)</li>
                        </ul>
                        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 700;">Only $29/month</p>
                        <p style="margin: 0;">
                            <a href="<?php echo esc_url($saas_url); ?>/upgrade" target="_blank" style="background: white; color: #ff7a00; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; margin-right: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.2)';">Upgrade Now</a>
                            <a href="<?php echo esc_url($saas_url); ?>" target="_blank" style="background: rgba(255, 255, 255, 0.2); color: white; padding: 12px 30px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; border: 2px solid white; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.3)';" onmouseout="this.style.background='rgba(255, 255, 255, 0.2)';">Learn More</a>
                        </p>
                    </div>
                </div>
            </div>

            <div style="margin: 25px 0; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border-left: 4px solid #ff7a00;">
                <h2 style="margin: 0 0 20px 0; font-size: 22px; color: #333; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 28px;">🔍</span>
                    <span style="color: #ff7a00;">Connection Test</span>
                </h2>
                <div id="connection-status" style="padding: 20px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                    <p style="text-align: center; color: #ff7a00; font-size: 16px; margin: 0;">⏳ Checking connection...</p>
                </div>
            </div>
            

            
            <div style="margin: 25px 0; padding: 25px; background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08); border-left: 4px solid #ff7a00;">
                <h3 style="margin: 0 0 20px 0; font-size: 20px; color: #ff7a00; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">📚</span>
                    <span>Free Version Features</span>
                </h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 25px;">
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📄</div>
                        <div style="font-weight: 600; color: #333; font-size: 16px;">50 Q/A pairs</div>
                        <div style="color: #666; font-size: 13px; margin-top: 4px;">Calculated by segments</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📝</div>
                        <div style="font-weight: 600; color: #333; font-size: 16px;">5,000 total words</div>
                        <div style="color: #666; font-size: 13px; margin-top: 4px;">Content storage</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                        <div style="font-size: 24px; margin-bottom: 8px;">💬</div>
                        <div style="font-weight: 600; color: #333; font-size: 16px;">200 chats/month</div>
                        <div style="color: #666; font-size: 13px; margin-top: 4px;">Monthly limit</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                        <div style="font-size: 24px; margin-bottom: 8px;">🎨</div>
                        <div style="font-weight: 600; color: #333; font-size: 16px;">5 theme colors</div>
                        <div style="color: #666; font-size: 13px; margin-top: 4px;">Customizable</div>
                    </div>
                    <div style="padding: 15px; background: linear-gradient(135deg, #fff8f0 0%, #fff3e6 100%); border-radius: 8px; border: 1px solid #ffe0b2;">
                        <div style="font-size: 24px; margin-bottom: 8px;">📍</div>
                        <div style="font-weight: 600; color: #333; font-size: 16px;">4 display positions</div>
                        <div style="color: #666; font-size: 13px; margin-top: 4px;">Flexible layout</div>
                    </div>
                </div>

                <div style="padding: 20px; background: linear-gradient(135deg, #ff7a00 0%, #ffb74d 100%); border-radius: 12px; color: white; box-shadow: 0 4px 12px rgba(255, 122, 0, 0.3); position: relative; overflow: hidden;">
                    <div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
                    <div style="position: relative; z-index: 1;">
                        <h3 style="margin: 0 0 15px 0; font-size: 20px; color: white; display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 24px;">⬆️</span>
                            <span>Pro Version Features ($29/month)</span>
                        </h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">✓</span>
                                <span style="font-size: 15px;">500 Q/A pairs (10x)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">✓</span>
                                <span style="font-size: 15px;">50,000 words (10x)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">✓</span>
                                <span style="font-size: 15px;">5,000 chats/month (25x)</span>
                            </div>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 18px;">✓</span>
                                <span style="font-size: 15px;">More advanced features</span>
                            </div>
                        </div>
                        <a href="https://chatbot.unishineai.dpdns.org/login?source=wp_plugin" target="_blank" style="background: white; color: #ff7a00; padding: 12px 35px; border-radius: 50px; text-decoration: none; font-weight: bold; display: inline-block; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); transition: all 0.3s ease;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.3)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.2)';">Upgrade to Pro →</a>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function check_api_connection() {
        check_ajax_referer('shop_assist_ai_settings', 'nonce');
        
        $api_url = sanitize_text_field(wp_unslash($_POST['api_url'] ?? ''));
        $api_key = sanitize_text_field(wp_unslash($_POST['api_key'] ?? ''));

        if (!$api_url || !$api_key) {
            wp_send_json_error(array('message' => 'API URL and API Key cannot be empty'));
            return;
        }
        
        // 转换 API URL 以适应容器环境
        $container_api_url = $this->convert_api_url_for_container($api_url);
        
        // Call SaaS API to test connection
        $response = wp_remote_get($container_api_url . '/tenant/usage', array(
            'headers' => array(
                'X-API-Key' => $api_key
            ),
            'timeout' => 10
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Cannot connect to server, please check API URL'));
            return;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['plan'])) {
            wp_send_json_success(array('message' => 'Connection successful'));
        } else {
            wp_send_json_error(array('message' => 'Invalid API Key'));
        }
    }
    
    public function get_usage_stats() {
        check_ajax_referer('shop_assist_ai_settings', 'nonce');
        
        $api_url = sanitize_text_field(wp_unslash($_POST['api_url'] ?? ''));
        $api_key = sanitize_text_field(wp_unslash($_POST['api_key'] ?? ''));

        if (!$api_url || !$api_key) {
            wp_send_json_error(array('message' => 'API URL and API Key cannot be empty'));
            return;
        }
        
        // 转换 API URL 以适应容器环境
        $container_api_url = $this->convert_api_url_for_container($api_url);
        
        // Call SaaS API to get usage statistics
        $response = wp_remote_get($container_api_url . '/tenant/usage', array(
            'headers' => array(
                'X-API-Key' => $api_key
            ),
            'timeout' => 10
        ));
        
        if (is_wp_error($response)) {
            wp_send_json_error(array('message' => 'Cannot connect to server'));
            return;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (isset($data['plan'])) {
            wp_send_json_success($data);
        } else {
            wp_send_json_error(array('message' => 'Failed to get usage statistics'));
        }
    }
    
    public function enqueue_scripts() {
        // Load main styles
        wp_enqueue_style(
            'unishine-shop-assist',
            plugins_url('assets/css/wp-ai-chat-simple.css', __FILE__),
            [],
            $this->plugin_version
        );

        // Load inline styles
        wp_enqueue_style(
            'unishine-shop-assist-inline',
            plugins_url('assets/css/unishine-shop-assist-inline.css', __FILE__),
            ['unishine-shop-assist'],
            $this->plugin_version
        );

        // Add dynamic position styles
        $options = get_option('unishine_shop_assist_options', array());
        $theme = isset($options['theme']) ? esc_attr($options['theme']) : 'blue';
        $position = isset($options['position']) ? esc_attr($options['position']) : 'bottom-right';
        
        $colors = array(
            'blue' => '#1890ff',
            'green' => '#52c41a',
            'red' => '#f5222d',
            'purple' => '#722ed1',
            'dark' => '#1890ff'
        );
        $primary_color = $colors[$theme] ?? '#1890ff';
        
        $dynamic_styles = '';
        if (strpos($position, 'right') !== false) {
            $dynamic_styles .= '#unishine-shop-assist-container { right: 20px; }';
        } else {
            $dynamic_styles .= '#unishine-shop-assist-container { left: 20px; }';
        }
        
        if (strpos($position, 'bottom') !== false) {
            $dynamic_styles .= '#unishine-shop-assist-container { bottom: 20px; }';
        } else {
            $dynamic_styles .= '#unishine-shop-assist-container { top: 20px; }';
        }
        
        $dynamic_styles .= '--primary-color: ' . esc_attr($primary_color) . ';';
        
        wp_add_inline_style('unishine-shop-assist-inline', $dynamic_styles);

        // Load jQuery (built-in with WordPress)
        wp_enqueue_script('jquery');

        // Load scripts - unified widget entry point
        wp_enqueue_script(
            'ai-chatbot-widget',
            plugins_url('assets/js/ai-chatbot-widget.js', __FILE__),
            ['jquery'],
            $this->plugin_version,
            true
        );

        // Pass configuration to JavaScript
        $config = array(
            'renderMode' => 'direct',
            'apiUrl' => $this->convert_api_url_for_container($this->api_base_url),
            'apiKey' => $this->api_key,
            'title' => get_option('shop_assist_ai_title', 'AI Assistant'),
            'position' => get_option('shop_assist_ai_position', 'bottom-right'),
            'theme' => get_option('shop_assist_ai_theme', 'blue'),
            'ajaxUrl' => admin_url('admin-ajax.php')
        );

        wp_localize_script('ai-chatbot-widget', 'wpAiChatbotFree', $config);
    }
    
    public function add_chat_widget() {
        if (!$this->api_base_url || !$this->api_key) {
            return;
        }
        
        $position = get_option('shop_assist_ai_position', 'bottom-right');
        $title = get_option('shop_assist_ai_title', 'AI Support Assistant');
        $theme = get_option('shop_assist_ai_theme', 'blue');
        
        // Theme color mapping
        $colors = [
            'blue' => '#1890ff',
            'green' => '#52c41a',
            'red' => '#f5222d',
            'purple' => '#722ed1'
        ];
        $primary_color = $colors[$theme] ?? '#1890ff';
        
        ?>
        <style>
            #unishine-shop-assist-container {
                position: fixed;
                <?php echo esc_attr(strpos($position, 'right') !== false ? 'right: 20px;' : 'left: 20px;'); ?>
                <?php echo esc_attr(strpos($position, 'bottom') !== false ? 'bottom: 20px;' : 'top: 20px;'); ?>
                z-index: 9999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            #unishine-shop-assist-button {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: <?php echo esc_attr($primary_color); ?>;
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transition: all 0.3s;
            }
            #unishine-shop-assist-button:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 16px rgba(0,0,0,0.2);
            }
            #unishine-shop-assist-window {
                display: none;
                position: fixed;
                <?php echo esc_attr(strpos($position, 'right') !== false ? 'right: 20px;' : 'left: 20px;'); ?>
                <?php echo esc_attr(strpos($position, 'bottom') !== false ? 'bottom: 90px;' : 'top: 90px;'); ?>
                width: 380px;
                height: 600px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                flex-direction: column;
                overflow: hidden;
            }
            #unishine-shop-assist-window.active {
                display: flex;
            }
            .unishine-shop-assist-header {
                color: white;
                padding: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .unishine-shop-assist-header h3 {
                margin: 0;
                font-size: 16px;
            }
            .unishine-shop-assist-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
            }
            .unishine-shop-assist-messages {
                flex: 1;
                overflow-y: auto;
                padding: 16px;
                background: #f5f5f5;
            }
            .unishine-shop-assist-message {
                margin-bottom: 12px;
                display: flex;
                gap: 8px;
            }
            .unishine-shop-assist-message.user {
                justify-content: flex-end !important;
            }
            .unishine-shop-assist-message-content {
                max-width: 70%;
                padding: 10px 14px;
                border-radius: 12px;
                word-wrap: break-word;
            }
            .unishine-shop-assist-message.bot .unishine-shop-assist-message-content {
                background: white;
                color: #333;
            }
            .unishine-shop-assist-message.user .unishine-shop-assist-message-content {
                background: <?php echo esc_attr($primary_color); ?>;
                color: white;
            }
            .unishine-shop-assist-input-area {
                padding: 16px;
                border-top: 1px solid #e8e8e8;
                display: flex;
                gap: 8px;
            }
            .unishine-shop-assist-input {
                flex: 1;
                padding: 10px 14px;
                border: 1px solid #d9d9d9;
                border-radius: 8px;
                font-size: 14px;
                outline: none;
            }
            .unishine-shop-assist-input:focus {
                border-color: <?php echo esc_attr($primary_color); ?>;
            }
            .unishine-shop-assist-send {
                padding: 10px 20px;
                background: <?php echo esc_attr($primary_color); ?>;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
            }
            .unishine-shop-assist-send:hover {
                opacity: 0.9;
            }
            .unishine-shop-assist-send:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        </style>
        
        <div id="unishine-shop-assist-container" class="unishine-theme-<?php echo esc_attr($theme); ?>">
            <button id="unishine-shop-assist-button" onclick="wpAiChatbotToggle()">💬</button>
            
            <div id="unishine-shop-assist-window" class="unishine-theme-<?php echo esc_attr($theme); ?>">
                <div class="unishine-shop-assist-header">
                    <h3><?php echo esc_html($title); ?></h3>
                    <button class="unishine-shop-assist-close" onclick="wpAiChatbotToggle()">×</button>
                </div>
                
                <!-- Tab Navigation -->
                <div class="unishine-shop-assist-tabs">
                    <button class="wp-ai-tab-button active" data-tab="chat">
                        <span class="wp-ai-tab-icon">💬</span> Chat
                    </button>
                    <button class="wp-ai-tab-button" data-tab="history">
                        <span class="wp-ai-tab-icon">📝</span> History
                    </button>
                    <button class="wp-ai-tab-button" data-tab="settings">
                        <span class="wp-ai-tab-icon">⚙️</span> Settings
                    </button>
                </div>
                
                <!-- Chat Tab -->
                <div id="chat-tab" class="wp-ai-tab-content active">
                    <div class="unishine-shop-assist-body">
                        <div class="unishine-shop-assist-messages" id="unishine-shop-assist-messages">
                            <div class="unishine-shop-assist-message bot">
                                <div class="unishine-shop-assist-message-content">
                                    Hello! I'm your AI assistant. How can I help you today?
                                    <div class="wp-ai-message-time"><?php echo esc_html(gmdate("m/d/Y, g:i A")); ?></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="unishine-shop-assist-input-area">
                            <input type="text" class="unishine-shop-assist-input" id="unishine-shop-assist-input" placeholder="Type your question...">
                            <button class="unishine-shop-assist-send">Send</button>
                        </div>
                    </div>
                </div>
                
                <!-- History Tab -->
                <div id="history-tab" class="wp-ai-tab-content">
                    <div class="wp-ai-history-header">
                        <button class="wp-ai-export-btn" onclick="wpAiExportHistory()">📥 Export</button>
                        <button class="wp-ai-clear-btn" onclick="wpAiClearHistory()">🗑️ Clear</button>
                    </div>
                    <div class="wp-ai-history-list" id="wp-ai-history-list">
                        <p style="text-align: center; color: #999; padding: 20px;">No chat history yet</p>
                    </div>
                </div>
                
                <!-- Settings Tab -->
                <div id="settings-tab" class="wp-ai-tab-content">
                    <div class="wp-ai-settings-content">
                        <div class="wp-ai-setting-item">
                            <label for="unishine-theme-setting">🎨 Theme</label>
                            <select id="unishine-theme-setting" class="wp-ai-select">
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="purple">Purple</option>
                                <option value="red">Red</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        
                        <div class="wp-ai-setting-item">
                            <label for="wp-ai-position-setting">📍 Position</label>
                            <select id="wp-ai-position-setting" class="wp-ai-select">
                                <option value="bottom-right">Bottom Right</option>
                                <option value="bottom-left">Bottom Left</option>
                                <option value="top-right">Top Right</option>
                                <option value="top-left">Top Left</option>
                            </select>
                        </div>
                        
                        <div class="wp-ai-setting-item">
                            <label>
                                <input type="checkbox" id="wp-ai-sound-enabled" checked>
                                <span>🔔 Sound Notification</span>
                            </label>
                        </div>
                        
                        <div class="wp-ai-setting-item">
                            <label>
                                <input type="checkbox" id="wp-ai-history-enabled" checked>
                                <span>📝 Save Chat History</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }
    
    public function shortcode() {
        return '<div id="unishine-shop-assist-shortcode-placeholder"></div>';
    }
}

// Initialize plugin
new Shop_Assist_AI_Free();
