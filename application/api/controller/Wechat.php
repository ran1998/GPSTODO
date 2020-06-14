<?php

namespace app\api\controller;
use app\common\library\Auth;
use think\Db;
/**
 * 首页接口
 */
class Wechat extends Common
{

    protected $noNeedLogin = ['*'];
    protected $noNeedRight = ['*'];

    protected $WX_ADMIN = '管理员';
    protected $WX_EMP = '员工';

    /**
     * 首页
     * 
     */
    public function index()
    {
        $this->success('请求成功');
    }

    public function addAuth()
    {
        if ($this->request->isPost()) {
            $data = $this->request->post('data', NULL);
            if ($data == NULL) {
                return $this->error('添加权限失败');
            }
            $data = explode(',', $data);
            try {            
                foreach ($data as $openid) {
                    Db::table('tb_wx_user')->where(['openid'=>$openid])->update(['role'=>1]);
                }                
            } catch (Exception $e) {
                return $this->error('添加权限失败');
            }
            $result = $this->getUserFun();
            return $this->success('添加权限成功', $result);
        }
        return $this->error('添加权限失败');
    }

    public function getOpenid($url)
    {
        $curl = \utils\CurlUtils::getInstance();
        $result = $curl->setUrl($url)->get();
        $result = json_decode($result, true);
        return $result;
    }

    public function saveWxUser()
    {
        $url = $this->request->post('url');
        if (!$url) {
            $this->error('url无效');
        }
        $result = $this->getOpenid($url);
        $data = input('post.');
        if (!isset($result['errcode'])) {
            // 请求成功
            unset($data['url']);
            $openid = $result['openid'];
            $data['openid'] = $openid;
            $row = Db::table('tb_wx_user')->where(['openid'=>$openid])->find();
            if (empty($row)) {
                try {            
                    Db::table('tb_wx_user')->insert($data);
                } catch (\Exception $e) {
                    echo $e->getMessage();
                    $this->error('添加用户失败');
                }
            }
        } else {
            $this->error('请求失败');
        }
        $this->success('请求成功');
    }

    
    public function initManager()
    {
        if ($this->request->isPost()) {
            $openid = $this->request->post('openid', NULL);
            $url = $this->request->post('url', NULL);
            if (empty($openid)) {
                $result = $this->getOpenid($url);
                if (!isset($result['errcode'])) {
                    $openid = $result['openid'];
                } else {
                    $this->error('获取openid失败');
                }
            }
            if ($this->isAdmin($openid)) {
                $this->success('showview');
            }
        }
        $this->error('hideview');
    }

    public function isAdmin($openid)
    {
        // 检查当前是否是管理员
        $condition = array(
            'openid' => $openid,
            'role' => 1
        );
        $row = Db::table('tb_wx_user')->where($condition)->find();

        return !empty($row);
        
    }

    /**
    *获取所有用户
    */
    public function getAllWxUser()
    {
        $member = $this->getUserFun();
        if (!$member) {
            $this->error('获取失败');
        } else {        
            return $this->success('success', $member);
        }
    }

    public function getUserFun()
    {
        $allUser = Db::table('tb_wx_user')->select();
        if (empty($allUser))
            return false;
        $member = array();
        foreach ($allUser as &$user) {
            $user['roleText'] = $user['role'] == 1 ? $this->WX_ADMIN : $this->WX_EMP;
            $user['checked'] = false;
            if ($user['role'] == 1) {
                $member['manager'][] = $user;
            } else {
                $member['emp'][] = $user;
            }
        }
        return $member;
    }

    /**
    *删除用户
    */
    public function deleteUser()
    {
        if ($this->request->isPost()) {
            $openid = $this->request->post('openid', NULL);
            $admins = Db::table('tb_wx_user')->where(['role'=>1])->select();
            if (count($admins)==1 && $admins[0]['openid'] == $openid) {
                return $this->error('管理员不能删除');
            }
            try {            
                Db::table('tb_wx_user')->where(['openid'=>$openid])->delete();
            } catch (Exception $e) {
                return $this->error('删除失败');
            }
            $result = $this->getUserFun();
            return $this->success('删除成功', $result);
        }
        return $this->error('请求错误');
    }

    /**
    *删除用户
    */
    public function removeUser()
    {
        if ($this->request->isPost()) {
            $openid = $this->request->post('openid', NULL);
            $admins = Db::table('tb_wx_user')->where(['role'=>1])->select();
            if (count($admins)==1 && $admins[0]['openid'] == $openid) {
                return $this->error('管理员不能移除');
            }
            try {            
                Db::table('tb_wx_user')->where(['openid'=>$openid])->update(['role'=>2]);
            } catch (Exception $e) {
                return $this->error('移除失败');
            }
            $result = $this->getUserFun();
            return $this->success('移除成功', $result);
        }
        return $this->error('请求错误');
    }

    public function isAuth()
    {
        if ($this->request->isPost()) {
            $openid = $this->request->post('openid', NULL);
            $url = $this->request->post('url', NULL);
            if (empty($openid)) {
                $result = $this->getOpenid($url);
                if (!isset($result['errcode'])) {
                    $openid = $result['openid'];
                } else {
                    $this->error('获取openid失败');
                }
            }

            $row = Db::table('tb_wx_user')->where(['openid'=>$openid])->find();
            if (!empty($row)) {
                $this->success('权限认证成功', ['openid' => $openid]);
            }
            $this->error('您没有权限');
        }
        $this->error('您没有权限');
    }

    public function getLocklog()
    {
        $sTime = $this->request->get('sTime', strtotime('-1 month'));
        $eTime = $this->request->get('eTime', time());
        $openid = $this->request->get('openid', NULL);
        $condition = array(
            'locktime' => array('gt', $sTime),
            'locktime' => array('lt', $eTime),
            'openid' => $openid
        );
        $result = Db::table('tb_wx_locklog')
        ->join('tb_wx_user', 'tb_wx_user.openid=tb_wx_locklog.openid')
        ->where(array_filter($condition))->order('locktime desc')->select();
        foreach ($result as &$value) {
            $value['locktime'] = date('Y-m-d H:i:s', $value['locktime']);
        }
        $this->success('success', $result);
    }

    public function saveLocklog()
    {
        $openid = $this->request->post('openid', NULL);
        if ($openid == NULL) {
            $this->error('获取openid失败');
        }
        $data = array(
            'openid' => $openid,
            'locktime' => time()
        );
        try {        
            $result = Db::table('tb_wx_locklog')->insert($data);
        } catch (\Exception $e) {
            print_r($e->getMessage());
            return $this->error('记录日志失败');
        }
        return $this->success('记录日志成功');
    }

}
