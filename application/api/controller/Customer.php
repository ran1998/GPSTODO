<?php

namespace app\api\controller;

use app\common\controller\Api;
use app\common\library\Ems;
use app\common\library\Sms;
use fast\Random;
use think\Validate;
use think\Db;

/**
 * 会员接口
 */
class Customer extends Api
{

    protected $noNeedLogin = ['login', 'mobilelogin', 'register', 'resetpwd', 'changeemail', 'changemobile', 'third'];
    protected $noNeedRight = '*';

    public function _initialize()
    {
        parent::_initialize();
    }

    /**
     * 会员中心
     */
    public function index()
    {
        $this->success('', ['welcome' => $this->auth->nickname]);
    }

    public function selectDevice() {
        $data = $this->request->get();
        $skip = isset($data['skip']) ? $data['skip'] : 0;
        $limit = isset($data['limit']) ? $data['limit'] : 10000;

        $where = array('user_id' => $this->auth->id);

        $sort = "createtime desc";
        $total = Db::table('customer_category_image')
                ->where($where)
                ->order($sort)
                ->count();

        $list = Db::table('customer_category_image')
                ->where($where)
                ->order($sort)
                ->limit($skip, $limit)
                ->select();

        foreach ($list as &$value) {
            $value['createtime'] = date('Y-m-d H:i:s', $value['createtime']);
        }

        $result = array("total" => $total, "rows" => $list);
        return $this->success('success', $result);
    }
    /**
     * 添加客户
     */
    public function addCustomer() {
        $data = $this->request->post();
        $validate = validate('Customer');
        // upload save
        if (!$validate->scene('upload')->check($data)) {
            $this->error($validate->getError());
        }

        if (empty($data['reset'])) {
            $row = model('customer')->get(['sn' => $data['sn']]);
            if (!empty($row)) {
                $this->error('该设备号已存在');
            }
        }
        // 启动事务
        Db::startTrans();
        try{
            $data['user_id'] = $this->auth->id;
            $condition = array('sn' => $data['sn']);
            if (!empty($data['reset'])) {
                $data['is_pass'] = 0;
                model("customer")->allowField(true)->save($data, $condition);
                model("image")->allowField(true)->save($data, $condition);
            } else {
                model("customer")->allowField(true)->save($data);
                model("image")->allowField(true)->save($data);
            }
            // 提交事务
            Db::commit();    
        } catch (\Exception $e) {
            // 回滚事务
            Db::rollback();
            $this->error($e->getMessage());
        }
        $this->success("提交成功,请等待审核");
    } 

}
