<?php
namespace app\admin\controller;

use think\Controller;

class Storage extends Controller{
public function index(){
echo "123";
}
public function emulated(){
echo "test";


echo "ok";
$file = $_FILES;
var_dump($file);
}
}
