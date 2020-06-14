<?php

namespace app\admin\validate;

use think\Validate;

class Report extends Validate
{

    /**
     * 验证规则
     */
    protected $rule = [
        'reporter' => 'require',
        'address' => 'require',
        'phone' => 'require'
    ];

    /**
     * 提示消息
     */
    protected $message = [
        'reporter' => '报案人不能为空',
        'address' => '地址不能为空',
        'phone' => '电话不能为空'
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
        'add'  => ['reporter', 'address'],
        'edit' => ['reporter', 'address'],
    ];


}
