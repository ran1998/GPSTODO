<?php

namespace app\admin\validate;

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
        'img_shenfen' => '身份证照不能为空',
        'img_baoxian'    => '保险照片不能为空',
        'img_chepai'    => '车牌照片不能为空',
        'img_chejia'    => '车架照片不能为空',
        'img_fadongji'    => '发动机照片不能为空',
        'img_cheshen1'    => '车身照片不能为空',
        'img_cheshen2'    => '车身照片不能为空',
        'cus_name'    => '客户姓名不能为空',
        'cus_iphone'    => '客户电话不能为空',
        'car_type'    => '车辆类型不能为空',
        'sex'    => '性别不能为空',
        'place'    => '籍贯不能为空',
        'birthday'    => '出生日期不能为空',
        'identity'    => '身份证号不能为空',
        'addr'    => '地址不能为空',
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
        'save' => ['sn', 'cus_name', 'sex', 'place', 'birthday', 'identity', 'addr'],
    ];


   

}
