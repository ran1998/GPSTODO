<?php
namespace utils;

class CurlUtils {

	private $ch;
	public $default_header;
	private $_url;
	private static $instance;

	public function __construct() {
		$this->ch = curl_init();
		$this->default_header = array(
			"accept" => "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,image/wxpic,image/sharpp,image/apng,image/tpg,*/*;q=0.8",
			"accept-encoding" => "gzip, deflate",
			"accept-language" => "zh-CN,en-US;q=0.8",
			"cache-control" => "no-cache",
			"connection" => "keep-alive",
			"content-type" => "application/x-www-form-urlencoded; charset=UTF-8",
			"origin" => "https://www.langma.cn",
			"pragma" => "no-cache",
			"referer" => "https://www.langma.cn/wx-func/binding?to=bindList&source=wx&r=669007&wxPublicCode=txwl",
			"user-agent" => "Mozilla/5.0 (Linux; Android 5.0.1; MX4 Build/LRX22C; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/57.0.2987.132 MQQBrowser/6.2 TBS/044306 Mobile Safari/537.36 MMWEBID/6946 MicroMessenger/6.7.3.1360(0x26070338) NetType/WIFI Language/zh_CN Process/tools",
			"x-requested-with" => "XMLHttpRequest",
		);
		curl_setopt($this->ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($this->ch, CURLOPT_HEADER, 0);
	}

	public function __destruct() {
		curl_close($this->ch);
	}

	public static function getInstance()
	{
		if (!self::$instance) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	public function setUrl($url) {
		// if ($this->$_url) {
		// 	curl_setopt($this->ch, CURLOPT_URL, $this->$_url);
		// 	return true;
		// } else {
		// 	return false;
		// }
		curl_setopt($this->ch, CURLOPT_URL, $url);
		return $this;
	}

	public function setHeader($value) {
		if (is_array($value)) {
			foreach ($value as $k => $v) {
				$header[] = $k . ': ' . $v;
			}
		}
		curl_setopt($this->ch, CURLOPT_HTTPHEADER, $header);
	}

	public function setHeaderParames($key, $value) {
		if (isset($this->default_header[$key])) {
			$this->default_header[$key] = $value;
		}
	}

	public function setCookie() {
		$cookie_file = __DIR__ . "/" . 'cookies.txt';
		$cookie_file = realpath($cookie_file);
		curl_setopt($this->ch, CURLOPT_COOKIEFILE, $cookie_file);
	}

	public function setExtra() {
		curl_setopt($this->ch, CURLOPT_ENCODING, "");
		curl_setopt($this->ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($this->ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($this->ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
	}

	public function exec() {
		// $this->setHeader($this->default_header);
		$this->setExtra();
		return curl_exec($this->ch);
	}

	public function getInfo() {
		return curl_getinfo($this->ch);
	}

	public function get() {
		return $this->exec();
	}

	public function post($value = '') {
		curl_setopt($this->ch, CURLOPT_POST, 1);
		curl_setopt($this->ch, CURLOPT_POSTFIELDS, $value);
		return $this->exec();
	}
}