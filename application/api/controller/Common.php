<?php
namespace app\api\controller;

use app\common\controller\Api;
use app\api\controller\Compressimg;
use app\common\model\Area;
use app\common\model\Version;
use fast\Random;
use think\Config;

/**
 * 公共接口
 */
class Common extends Api
{

    protected $noNeedLogin = ['init'];
    protected $noNeedRight = '*';

    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 加载初始化
     *
     * @param string $version 版本号
     * @param string $lng 经度
     * @param string $lat 纬度
     */
    public function init()
    {
        if ($version = $this->request->request('version')) {
            $lng = $this->request->request('lng');
            $lat = $this->request->request('lat');
            $content = [
                'citydata'    => Area::getCityFromLngLat($lng, $lat),
                'versiondata' => Version::check($version),
                'uploaddata'  => Config::get('upload'),
                'coverdata'   => Config::get("cover"),
            ];
            $this->success('', $content);
        } else {
            $this->error(__('Invalid parameters'));
        }
    }

    public function noCompress_upload()
    {
        $file = $this->request->file('file');
        $fileInfo = $file->getInfo();
        $suffix = strtolower(pathinfo($fileInfo['name'], PATHINFO_EXTENSION));
        $fdfs = new \FastDFS(); 
        $tracker = $fdfs->tracker_get_connection();  
        $fileId = $fdfs->storage_upload_by_filebuff1(file_get_contents($fileInfo['tmp_name']), $suffix);  
        $fdfs->tracker_close_all_connections();
        if (!empty($fileId)) {
            $this->success(__('Upload successful'), [
                'url' => '/'.$fileId
            ]);
        }
        $this->error("上传失败,请重试");
    }
    public function _upload()
    {
        $file = $this->request->file('file');
        $fileInfo = $file->getInfo();
        $suffix = strtolower(pathinfo($fileInfo['name'], PATHINFO_EXTENSION));
        $path = ROOT_PATH.'../pic/'.$fileInfo['name'];
        $compress = new Compressimg($fileInfo['tmp_name'], 0.5);
        $compress->compressImg($path);
        $fdfs = new \FastDFS(); 
        $tracker = $fdfs->tracker_get_connection();  
        $fileId = $fdfs->storage_upload_by_filebuff1(file_get_contents($path), $suffix);  
        $fileinfo = $fdfs->get_file_info1($fileId);
        $fdfs->tracker_close_all_connections();
        $storageAddr = array(
            'local' => '47.90.36.253',
            '120.76.205.67' => 'www.smt110.com'
        );
        if (!empty($fileId)) {
            // 压缩图片
            if ($fileinfo['source_ip_addr'] == $storageAddr['local']) {
                $localAddr = 'http://server.vmui.net'.'/'.$fileId;
                $result = array('url' => $localAddr);
            } else {
                $addr = $storageAddr[$fileinfo['source_ip_addr']];
                $url = 'http://'.$addr.'/'.$fileId;
                $result = array('url' => $url);
            }
            $this->success(__('Upload successful'), $result);
        }
        $this->error("上传失败,请重试");
    }
    public function testUpload()
    {
        $file = $this->request->file('file');
        $fileInfo = $file->getInfo();
        $suffix = strtolower(pathinfo($fileInfo['name'], PATHINFO_EXTENSION));
        $path = ROOT_PATH.'../pic/'.$fileInfo['name'];
        $compress = new Compressimg($fileInfo['tmp_name'], 0.5);
        $compress->compressImg($path);
        $fdfs = new \FastDFS(); 
        $tracker = $fdfs->tracker_get_connection();  
        $fileId = $fdfs->storage_upload_by_filebuff1(file_get_contents($path), $suffix);  
        $fileinfo = $fdfs->get_file_info1($fileId);
        $fdfs->tracker_close_all_connections();
        $storageAddr = array(
            'local' => '47.90.36.253',
            '120.76.205.67' => 'www.smt110.com'
        );
        if (!empty($fileId)) {
            // 压缩图片
            if ($fileinfo['source_ip_addr'] == $storageAddr['local']) {
                $localAddr = 'http://server.vmui.net'.'/'.$fileId;
                $result = array('url' => $localAddr);
            } else {
                $addr = $storageAddr[$fileinfo['source_ip_addr']];
                $url = 'http://'.$addr.'/'.$fileId;
                $result = array('url' => $url);
            }
            $this->success(__('Upload successful'), $result);
        }
        var_dump($fdfs->get_last_error_info());
        $this->error("上传失败,请重试");
    }
    /**
     * 上传文件
     * @ApiMethod (POST)
     * @param File $file 文件流
     */
    public function upload()
    {  
        $file = $this->request->file('file');
		$base64 = input('image', '');
		if (!empty($base64)) {			
			$image_content = preg_replace('#^data:image/\w+;base64,#i', '', $base64);
			$image_content = base64_decode($image_content);//解密base64编码的图片数据
			
			$pic_path = '/uploads/'.date('Ymd').'/';//定义一个保存图片的文件目录，此处是已创建的文件目录
			if (!is_dir(ROOT_PATH .'/public'. $pic_path)) {
				mkdir(ROOT_PATH .'/public'. $pic_path, 0777);
			}
			$pic_path .= md5(md5(time())) . '.jpg';//根据时间生成图片名并使用md5加密，也可以前端传递一个文件名

			$size = file_put_contents(ROOT_PATH.'/public'.$pic_path, $image_content);//利用file_put_contents进行图片文件的写入
			if ($size) {
				$this->success(__('Upload successful'), [
					'url' => $pic_path
				]);
			}else {
				$this->error('上传失败');
			}
		}
		
        //判断是否已经存在附件
        $sha1 = $file->hash();

        $upload = Config::get('upload');

        preg_match('/(\d+)(\w+)/', $upload['maxsize'], $matches);
        $type = strtolower($matches[2]);
        $typeDict = ['b' => 0, 'k' => 1, 'kb' => 1, 'm' => 2, 'mb' => 2, 'gb' => 3, 'g' => 3];
        $size = (int)$upload['maxsize'] * pow(1024, isset($typeDict[$type]) ? $typeDict[$type] : 0);
        $fileInfo = $file->getInfo();
        $suffix = strtolower(pathinfo($fileInfo['name'], PATHINFO_EXTENSION));
        $suffix = $suffix ? $suffix : 'file';

        $mimetypeArr = explode(',', strtolower($upload['mimetype']));
        $typeArr = explode('/', $fileInfo['type']);

        //验证文件后缀
        if ($upload['mimetype'] !== '*' &&
            (
                !in_array($suffix, $mimetypeArr)
                || (stripos($typeArr[0] . '/', $upload['mimetype']) !== false && (!in_array($fileInfo['type'], $mimetypeArr) && !in_array($typeArr[0] . '/*', $mimetypeArr)))
            )
        ) {
            $this->error(__('Uploaded file format is limited'));
        }
        $replaceArr = [
            '{year}'     => date("Y"),
            '{mon}'      => date("m"),
            '{day}'      => date("d"),
            '{hour}'     => date("H"),
            '{min}'      => date("i"),
            '{sec}'      => date("s"),
            '{random}'   => Random::alnum(16),
            '{random32}' => Random::alnum(32),
            '{filename}' => $suffix ? substr($fileInfo['name'], 0, strripos($fileInfo['name'], '.')) : $fileInfo['name'],
            '{suffix}'   => $suffix,
            '{.suffix}'  => $suffix ? '.' . $suffix : '',
            '{filemd5}'  => md5_file($fileInfo['tmp_name']),
        ];
        $savekey = $upload['savekey'];
        $savekey = str_replace(array_keys($replaceArr), array_values($replaceArr), $savekey);

        $uploadDir = substr($savekey, 0, strripos($savekey, '/') + 1);
        $fileName = substr($savekey, strripos($savekey, '/') + 1);
        //
        if (!is_dir(ROOT_PATH . '/public' . $uploadDir)) {
            mkdir(ROOT_PATH . '/public' . $uploadDir, 0777);

        }
        $splInfo = $file->move(ROOT_PATH . '/public' . $uploadDir, $fileName);
        if ($splInfo) {
            // \think\Hook::listen("upload_after", $customer);
            $this->success(__('Upload successful'), [
                'url' => $uploadDir . $splInfo->getSaveName()
            ]);
        } else {
            // 上传失败获取错误信息
            $this->error($file->getError());
        }

       
    }

}
