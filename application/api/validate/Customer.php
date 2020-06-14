<?php

namespace app\api\validate;

use think\Validate;

class Customer extends Validate
{

    /**
     * 验证规则
     */
    protected $rule = [
        'sn' => 'number|max:15',
        'img_shenfen' => 'require',
        'img_baoxian'    => 'require',
        'img_chepai'    => 'require',
        'img_chejia'    => 'require',
        'img_fadongji'    => 'require',
        'img_cheshen1'    => 'require',
        'img_cheshen2'    => 'require',
        'cus_name'    => 'require',
        'cus_iphone'    => 'require',
        'car_type'    => 'require',
        'sex'    => 'require',
        'place'    => 'require',
        'birthday'    => 'require',
        'identity'    => 'require',
        'addr'    => 'require',

    ];

    /**
     * 提示消息
     */
    protected $message = [
        'sn.number' => '设备号必须为数字',
        'sn.max' => '设备号不能超过15位',
        'img_shenfen' => '身份证照',
        'img_baoxian'    => '保险照片',
        'img_chepai'    => '车牌照片',
        'img_chejia'    => '车架照片',
        'img_fadongji'    => '发动机照片',
        'img_cheshen1'    => '车身照片',
        'img_cheshen2'    => '车身照片',
        'cus_name'    => '客户姓名',
        'cus_iphone'    => '客户电话',
        'car_type'    => '车辆类型',
        'sex'    => '性别',
        'place'    => '籍贯',
        'birthday'    => '出生日期',
        'identity'    => '身份证号',
        'addr'    => '地址',
    ];

    /**
     * 字段描述
     */
    protected $field = [
    ];

    /**
     * 验证场景
     */
    protected $scene = [
        'upload'  => ['sn', 'img_shenfen', 'img_baoxian', 'img_chepai', 'img_chejia', 'img_fadongji', 'img_cheshen1', 'img_cheshen2'],
        'save' => ['sn', 'cus_name', 'cus_iphone', 'car_type', 'sex', 'place', 'birthday', 'identity', 'addr'],
    ];


   

}
