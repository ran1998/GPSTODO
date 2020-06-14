<?php

namespace app\admin\controller\monitor;

use app\admin\model\Customer;
use app\common\controller\Backend;
use think\Db;
use fast\Random;
use fast\Tree;

/**
 * 管理员管理
 *
 * @icon fa fa-users
 * @remark 一个管理员可以有多个角色组,左侧的菜单根据管理员所拥有的权限进行生成
 */
class Position extends Backend
{

    /**
     * @var \app\admin\model\Admin
     */
    protected $model = null;
    protected $childrenGroupIds = [];
    protected $childrenAdminIds = [];
    protected $status = [];
    // 公安对应管理员
    protected $relative = [
        array('source' => '10', 'relation' => '13'),
        array('source' => '26', 'relation' => '25')
    ];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Customer');
        $this->initStatus();
    }

    public function initStatus()
    {
        $this->status = [
            'Total' => array(
                'msg' => '全部',
                'total' => 0,
                'checked' => true,
                'icon' => 'bg-purple',
                'where' => array(),
            ),
            'Online' => array(
                'msg' => '在线',
                'total' => 0,
                'icon' => 'bg-green',
                'where' => array('s.time' => array('gt' ,strtotime('-3 minute')))
            ),
            'Offline' => array(
                'msg' => '离线',
                'total' => 0,
                'icon' => 'bg-gray',
                'where' => array('s.time' => array('lt' ,strtotime('-3 minute')))
            ),
            'Alarm' => array(
                'msg' => '预警',
                'total' => 0,
                'icon' => 'bg-red',
                'where' => array('a.readstate' => 0)
            ),
            'Lost' => array(
                'msg' => '被盗',
                'total' => 0,
                'icon' => 'bg-yellow',
                'where' => array('c.sn' => 0)
            ),
            'Leave' => array(
                'msg' => '出境',
                'total' => 0,
                'icon' => 'bg-aqua',
                'where' => array('c.sn' => 0)
            ),
            'NotInstall' => array(
                'msg' => '未装',
                'total' => 0,
                'icon' => 'bg-aqua',
                'where' => array('c.sn' => 0)
            ),

        ];
        $relativeId = null;
        foreach ($this->relative as $value) {
            if ($this->auth->id == $value['source']) {
                $relativeId = $value['relation'];
            }
        }
        $ids = implode(',', $this->auth->getAdminChilrensId($relativeId));
        foreach ($this->status as $key => &$value) {
            $condition = array_merge($value['where'], array('c.user_id' => ['in', $ids]));
            $count = model('customer')->alias('c')
            ->join('ggps.devicestatus s', 'c.sn=s.sn')
            ->join('ggps.alertinfo a', 'a.sn=c.sn', 'LEFT')
            ->group('c.sn')
            ->where($condition)
            ->where('is_pass',1)
            ->count();
            $value['total'] = $count;
        }
    }
    /**
     * 查看
     */
    public function index()
    {
        if ($this->request->isAjax())
        {
            //如果发送的来源是Selectpage，则转发到Selectpage
            if ($this->request->request('keyField'))
            {
                return $this->selectpage();
            }

            // 获取当前管理员下的设备
            $this->dataLimit = 'personal';
            $this->dataLimitField = 'user_id';
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            
            $sort = "createtime";
            $total = Db::table('customer_category_image')
                    ->where($where)
                    ->order($sort, $order)
                    ->count();

            $list = Db::table('customer_category_image')
                    ->where($where)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        $cates = model('category')->where(1)->field('id')->select();
        foreach ($cates as $key => $value) {
            $cate_id[] = $value['id'];
        }
        $result = $this->getDeviceByStatus(array('status'=>'Total', 'cate_id'=>$cate_id));
        $this->assign('data', $result);
        $this->assign('status', $this->status);
        return $this->view->fetch();
    }

    public function main()
    {
        if ($this->request->isAjax())
        {
            // //如果发送的来源是Selectpage，则转发到Selectpage
            // if ($this->request->request('keyField'))
            // {
            //     return $this->selectpage();
            // }

            // list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            // $where = array();
            
            // $sort = "account";
            // $AccountModel = new \app\common\model\ggps\Account();
            // $GroupinfoModel = new \app\common\model\ggps\Groupinfo();
            // $DevicegroupModel = new \app\common\model\ggps\Devicegroup();
           

            // $list = $AccountModel
            //         ->where($where)
            //         ->order($sort, 'desc')
            //         ->limit(0, 10)
            //         ->select();

            // foreach ($list as $key => &$value) {
            //     $group = $GroupinfoModel
            //         ->where('gid', $value['account'])
            //         ->order('id', 'asc')
            //         ->select();
            //     foreach ($group as $gkey => &$gval) {                
            //         // $devices = $DevicegroupModel->alias('dp')
            //         //     ->join('devicestatus ds', 'dp.id=ds.sn')
            //         //     ->where('dp.gid', $value['account'])
            //         //     ->where('dp.fid', $gval['id'])
            //         //     ->select();
            //         // $gval['devices'] = $devices;
            //     }
            //     $value['group'] = $group;
            // }

            // $result = array("rows" => $list);

            // return json($result);
        }
        $cates = model('category')->where(1)->field('id')->select();
        foreach ($cates as $key => $value) {
            $cate_id[] = $value['id'];
        }
        $result = $this->getDeviceByStatus(array('status'=>'Total', 'cate_id'=>$cate_id));
        $this->assign('data', $result);
        $this->assign('status', $this->status);
        return $this->view->fetch();
    }

    public function shiftDevice()
    {
        $sns = $this->request->request('sns');
        $group = $this->request->request('group');

        $DevicegroupModel = new \app\common\model\ggps\Devicegroup();
        list($account, $gid) = explode('_', $group);
        $sns = explode(',', $sns);

        $AccountModel = new \app\common\model\ggps\Account();
        $accountRow = $AccountModel->get(['account' => $account]);
        if (empty($accountRow)) {
            $this->error('账号不存在');
        }

        try {
            $where = array(
                'id'    => array('in', $sns)
            );
            $DevicegroupModel->where($where)->delete();
            foreach ($sns as $k => $sn) {
                $addData = array(
                    'gid'   => $account,
                    'fid'   => $gid,
                    'id'    => $sn,
                    'text'  => $sn,
                    'time'  => date('Y-m-d H:i:s')
                );
                $DevicegroupModel->insert($addData);        
            }
            
        } catch (\Exception $e) {
            $this->error($e->getMessage());            
        }
        return $this->success();

    }

    public function getDeviceGroup()
    {
        $AccountModel = new \app\common\model\ggps\Account();
        $GroupinfoModel = new \app\common\model\ggps\Groupinfo();
        $DevicegroupModel = new \app\common\model\ggps\Devicegroup();

        $where = array();
        $groupname = $this->request->request('groupname', null);
        $where['account'] = array('like', '%'.$groupname.'%');
        $where = array_filter($where);

        $sort = "account";
        $result = array();
        // $list = $AccountModel
        //         ->where($where)
        //         ->order($sort, 'desc')
        //         ->paginate(10,true,
        //             [
        //                 'type'     => 'Bootstrap',
        //                 'var_page' => 'page',
        //                 'path'=>'javascript:GroupPage("[PAGE]")',
        //             ]
                     
        //         );
        $list = $AccountModel
                ->where($where)
                ->order($sort, 'desc')
                ->select();

        foreach ($list as $key => &$value) {
            $accId = 'acc_'.$value['account'];
            $result[] = array(
                'id'    => $accId,
                'name'  => '账号: '.$value['account'],
                'pId'   => 0
            );
            $group = $GroupinfoModel
                ->where('gid', $value['account'])
                ->order('id', 'asc')
                ->select();
            foreach ($group as $gkey => $gval) {            
                $gId = $value['account'].'_'.$gval['id'];
                $result[] = array(
                    'id'    => $gId,
                    'name'  => $gval['text'],
                    'pId'   => $accId
                );
            }
        }
        // $res = array("rows" => $result, 'page'  => $list->render());
        $res = array("rows" => $result);
        return json($res);
    }

    public function devicegroupform()
    {
        return $this->view->fetch();
    }

    public function getGpsDevice($paramsArray=null)
    {
        $params = $this->request->get();
        if (!empty($paramsArray)) {
            $params = $paramsArray;
        }
        $condition = array();
        if ($params['status'] == 'Online') {
            $condition['ds.time'] = array('gt' ,strtotime('-3 minute'));
        }
        if ($params['status'] == 'Offline') {
            $condition['ds.time'] = array('lt' ,strtotime('-3 minute'));
        }

        if (isset($params['name']) && $params['name'] != '') {

            $condition['ds.sn'] = array('like', '%'.$params['name'].'%');
        }
        list($gid, $fid) = explode('_', $params['cate_id']);
        if ($gid == 'acc') {
            $where = ['dp.gid' => $gid];
        } else {
            $where = ['dp.gid' => $gid, 'dp.fid' => $fid];
        }

        $DevicegroupModel = new \app\common\model\ggps\Devicegroup();
        $model = $DevicegroupModel->alias('dp')
            ->join('devicestatus ds', 'dp.id=ds.sn')
            ->where($where)
            ->where($condition);

        if (isset($params['select']) && $params['select'] == 'all') {
            $list = $model->select();
            return $list;
        } else {
            $list = $model->paginate(10,true,
                [
                    'type'     => 'Bootstrap',
                    'var_page' => 'page',
                    'path'=>'javascript:AjaxPage("[PAGE]")',
                ]
                 
            );

        }
        $time = strtotime("-3 minute");
        foreach ($list as &$v) {
            if ($v['time'] == 0) {
                $v['statusText'] = '没有定位信息';
                $v['status_icon'] = 'icon-offline';
                $v['disabled'] = 'disabled';
            } else {
                $statusText = $time > $v['time'] ? '离线' : '在线';
                // 离线状态
                $distTime = $time - $v['time'];
                $day = floor(($distTime / 3600 / 24));
                $hour = floor(($distTime % (3600 * 24) / 3600));
                $minute = floor(($distTime % (3600 * 24) % 3600 / 60));
                $secend = floor(($distTime % (3600 * 24) % 3600 % 60));
                if ($time > $v['time']) {
                    $status = $statusText . ($day?$day.'天':'') . ($hour?$hour.'时':'') . ($minute?$minute.'分':''); 
                } else {
                    $status = $statusText;
                }
                $v['statusText'] = $status;
                $v['status_icon'] = $time > $v['time'] ? 'icon-offline' : 'icon-online';
                $v['disabled'] = '';
            }
        }
        

        $result = array("rows" => $list, "page" => $list->render());
        if (!empty($paramsArray)) {
            return $result;
        }
        return json($result);
    }

    public function getDeviceByStatus($paramsArray=null)
    {
        $params = $this->request->get();
        if (!empty($paramsArray)) {
            $params = $paramsArray;
        }
        $statusWhere = $this->status[$params['status']]['where'];
        $condition = array_merge($statusWhere, array('c.cate_id' => array('in', $params['cate_id'])));
        if (!$this->auth->isSuperAdmin()) {
            $relativeId = null;
            foreach ($this->relative as $value) {
                if ($this->auth->id == $value['source']) {
                    $relativeId = $value['relation'];
                }
            }
            $user_ids = $this->auth->getAdminChilrensId($relativeId);
            $condition['user_id'] = array('in', implode(",", $user_ids));
        }
        if (isset($params['name']) && $params['name'] != '') {

            $condition['c.sn|car_num|cus_iphone'] = array('like', '%'.$params['name'].'%');
        }

        $sort = "c.createtime";
        $model = model('customer')->alias('c')
        ->alias('c')
        ->join('ggps.devicestatus s', 's.sn=c.sn', "LEFT")
        ->join('tb_category g', 'c.cate_id=g.id')
        ->where($condition)
        ->where('is_pass',1);

        if (isset($params['select']) && $params['select'] == 'all') {
            $list = $model->select();
            return $list;
        } else {
            $list = $model->paginate(10,true,
                [
                    'type'     => 'Bootstrap',
                    'var_page' => 'page',
                    'path'=>'javascript:AjaxPage("[PAGE]")',
                ]
                 
            );

        }
        $time = strtotime("-3 minute");
        foreach ($list as &$v) {
            if ($v['time'] == 0) {
                $v['statusText'] = '没有定位信息';
                $v['status_icon'] = 'icon-offline';
                $v['disabled'] = 'disabled';
            } else {
                $statusText = $time > $v['time'] ? '离线' : '在线';
                // 离线状态
                $distTime = $time - $v['time'];
                $day = floor(($distTime / 3600 / 24));
                $hour = floor(($distTime % (3600 * 24) / 3600));
                $minute = floor(($distTime % (3600 * 24) % 3600 / 60));
                $secend = floor(($distTime % (3600 * 24) % 3600 % 60));
                if ($time > $v['time']) {
                    $status = $statusText . ($day?$day.'天':'') . ($hour?$hour.'时':'') . ($minute?$minute.'分':''); 
                } else {
                    $status = $statusText;
                }
                $v['statusText'] = $status;
                $v['status_icon'] = $time > $v['time'] ? 'icon-offline' : 'icon-online';
                $v['disabled'] = '';
            }
        }
    

        $result = array("rows" => $list, "page" => $list->render());
        if (!empty($paramsArray)) {
            return $result;
        }
        return json($result);
    }
    /**
     * 添加
     */
    public function add()
    {
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                $params['salt'] = Random::alnum();
                $params['password'] = md5(md5($params['password']) . $params['salt']);
                $params['avatar'] = '/assets/img/avatar.png'; //设置新管理员默认头像。
                $params['parent_id'] = $this->auth->id;
                $result = $this->model->validate('Admin.add')->save($params);
                if ($result === false)
                {
                    $this->error($this->model->getError());
                }
                $group = $this->request->post("group/a");

                //过滤不允许的组别,避免越权
                $group = array_intersect($this->childrenGroupIds, $group);
                $dataset = [];
                foreach ($group as $value)
                {
                    $dataset[] = ['uid' => $this->model->id, 'group_id' => $value];
                }
                model('AuthGroupAccess')->saveAll($dataset);
                $this->success();
            }
            $this->error();
        }
        return $this->view->fetch();
    }

    public function detail($sn = null) {
        $row = $this->model->get(['sn' => $sn]);
        if (!$row)
            $this->error(__('No Results were found'));
        $customer_image = model('customer')->alias('c')
        ->field('g.name as cate_name,c.sn,car_model,car_num,cus_name,cus_iphone')
        ->join('tb_category g', 'c.cate_id=g.id')
        ->where(['c.sn' => $row['sn']])
        ->find();
        return json(['row' => $customer_image]);
        $this->assign('row', $customer_image);
        echo $this->view->fetch();
    }

    public function alertinfo($sn = null) {
        $row = $this->model->get(['sn' => $sn]);
        if (!$row)
            $this->error(__('No Results were found'));
        $this->assign('row', $row);
        echo $this->view->fetch();
    }
    public function getAddress() {
        $latlon = $this->request->get();
        list($lat, $lon) = array($latlon['lat'], $latlon['lon']);
        $result = getAddress($lat, $lon);
        return json(array('address' => $result));
    }
    public function getAlertinfo() {
        if ($this->request->isAjax())
        {
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            $sn = $this->request->get('sn');
            $condition = array('s.sn' => $sn, 'readstate' => 0);
            $total = Db::table('ggps.alertinfo')->alias('a')
                    ->join('ggps.devicestatus s', 'a.sn=s.sn')
                    ->where($condition)
                    ->order($sort, $order)
                    ->count();

            $list = Db::table('ggps.alertinfo')->alias('a')
                    ->join('ggps.devicestatus s', 'a.sn=s.sn')
                    ->where($condition)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            if (!empty($list)) {
                foreach ($list as $k => &$v) {
                    switch ($v['type']) {
                        case 1:
                            $v['type_text'] = '低电量';
                            break;
                        case 2:
                            $v['type_text'] = 'SOS求救';
                            break;
                        case 3:
                            $v['type_text'] = '震动报警';
                            break;
                        case 6:
                            $v['type_text'] = '超速报警';
                            break;
                        case 4:
                            $v['type_text'] = '离开围栏';
                            break;
                        case 12:
                            $v['type_text'] = '进入围栏';
                            break;
                    }
                    $v['time'] = date('Y-m-d H:i:s', $v['time']);
                }
            }
            $result = array("rows" => $list, "total" => $total);

            return json($result);
        }
    }
    public function handleAlarm($id = null)
    {
        $row = Db::table('ggps.alertinfo')->where(['id' => $id])->find();
        if (!$row)
            $this->error(__('No Results were found'));
        Db::table('ggps.alertinfo')->where(['id' => $row['id']])->update(['readstate' => 1]);
        $this->success();
    }
    // 下发指令
    public function directive($sn=null)
    {
        if ($this->request->isAjax()) {
            $params = $this->request->get();
            $condition = array('sn' => $params['sn']);
            if ($params['cmd'] == 'defence') {
                // 设防撤防
                $data = ['maccenable' => $params['val']];
            } else if ($params['cmd'] == 'relay') {
                $data = ['pushcode' => $params['val']];
            }
            try {            
                Db::table('ggps.deviceconfig')->where($condition)->update($data);
            } catch (\Exception $e) {
                echo $e->getMessage();
                $this->error();
            }
            $this->success();
        }
    }

    public function history($sn = NULL, $name = NULL)
    {
        $row = $this->model->get(['sn' => $sn, 'car_num' => $name]);
        if (!$row)
            $this->error(__('No Results were found'));
        $this->assign('row', $row);
        return $this->view->fetch();
    }

    public function follow($sn = NULL, $name = NULL)
    {
        if ($this->request->isPost()) {
            $params = $this->request->post();
            $table = date("Ymd", time());
            $time = isset($params['time']) ? $params['time'] : time();
            $condition = array('sn' => $params['sn'], 'time' => array('gt', $time));
            $rows = collection(Db::table('locaterec.'.$table)->where($condition)->limit(0,10)->select())->toArray();
            if (count($rows)) {
                $next = array('sn' => $params['sn'], 'time' => $rows[count($rows)-1]['time']);
            } else {
                $next = array('sn' => $params['sn'], 'time' => time());
            }
            $result = array('result' => $rows, 'next' => $next);
            return json($result);
        }
        $row = $this->model->get(['sn' => $sn]);
        if (!$row)
            $this->error(__('No Results were found'));
        $ds = model('customer')->alias('c')
        ->join('ggps.devicestatus d', 'c.sn=d.sn')
        ->where(['c.sn' => $row['sn']])
        ->find();
        $ds['status'] = strtotime("-3 minute") < $ds['time'] ? '在线' : '离线'; 
        $ds['positionType'] = $ds['radius'] == 1 ? 'gps' : ($ds['radius'] == 550 ? '基站': 'wifi');
        // echo getAddress('114.2382815,22.7111363');exit;
        $this->assign('row', $row);
        $this->assign('ds', $ds);
        return $this->view->fetch();
    }

    // 历史轨迹查询
    public function track($sn = NULL)
    {
        if (request()->isPost()) {
            $row = $this->model->get(['sn' => $sn]);
            if (!$row)
                $this->error(__('No Results were found'));
            $data = $this->request->post();
            $startDate =!empty($data['startDate']) ? strtotime($data['startDate']) : strtotime('today');
            $endDate =!empty($data['endDate']) ? strtotime($data['endDate']) : time();
            $everyData = array();
            $latlon = array();
            $destDate = ceil(($endDate - $startDate)/(60*60*24));
            if ($destDate==0)
                $destDate=1;
            if ($destDate > 7) {
                return json(0, '只能查询7天以内的数据');
            } else {
                for ($i=0; $i <$destDate ; $i++) { 
                    $date = strtotime(date('Y-m-d', $endDate)." -".$i." day");
                    if ($date > time()) {
                        return show(0, '请输入今天之前的时间');
                    }
                    $table = date('Ymd',$date);
                    $onedayData = collection(Db::table('locaterec.'.$table)->where(['sn' => $row['sn']])->select())->toArray();
                    if (!empty($onedayData)) {                        
                        foreach ($onedayData as $key => &$value) {
                            $value['time'] = date("Y-m-d H:m:i", $value['time']);
                            if (isset($onedayData[$key-1])) {
                                $prveVal = $onedayData[$key-1];
                                if ( ($prveVal['lon'] == $value['lon']) && ($prveVal['lat'] == $value['lat']) ) {
                                    continue;
                                }
                            }
                            $latlon[] = array($value['lon'], $value['lat']);
                        }
                        $everyData = array_merge($onedayData, $everyData);
                    }
                }
                
            }
            if (!$everyData){
                return json('暂无轨迹信息');
            }
            $result = array(
                'data' => $everyData,
                'path' => $latlon
            );
            return json($result);
       }
    }

    /**
     * 编辑
     */
    public function edit($sns = NULL)
    {
        $row = $this->model->get(['sn' => $sns]);
        if (!$row)
            $this->error(__('No Results were found'));
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                $is_pass = $params['is_pass'];
                if ($is_pass == 1) {
                    // 通过审核                
                    $validate = validate('Customer');
                    if (!$validate->scene('save')->check($params)) {
                        $this->error($validate->getError());
                    }
                    model('customer')->updatePrimaryKey($params);
                } else {
                    // 未通过审核
                    model('customer')->save(['is_pass'=>$params['is_pass']], ['sn' => $params['sn']]);
                }
                $this->success("提交成功");
            }
            $this->error();
        }
        $customer = Db::table('customer_category_image')
                ->where(array('sn' => $row['sn']))
                ->find();

        $tree = Tree::instance();
        $tree->init(collection(model('category')->order('weigh desc,id desc')->select())->toArray(), 'pid');
        $this->categorylist = $tree->getTreeList($tree->getTreeArray(0), 'name');
        $cates = array();
        foreach ($this->categorylist as $key => $value) {
            $cates[$value['id']] = $value['name'];
        }
        $this->view->assign("row", $customer);
        $this->view->assign("cates", $cates);
        return $this->view->fetch();
    }

    /**
     * 删除
     */
    public function del($ids = "")
    {
        if ($ids)
        {
            // 避免越权删除管理员
            $childrenGroupIds = $this->childrenGroupIds;
            $adminList = $this->model->where('id', 'in', $ids)->where('id', 'in', function($query) use($childrenGroupIds) {
                        $query->name('auth_group_access')->where('group_id', 'in', $childrenGroupIds)->field('uid');
                    })->select();
            if ($adminList)
            {
                $deleteIds = [];
                foreach ($adminList as $k => $v)
                {
                    $deleteIds[] = $v->id;
                }
                $deleteIds = array_diff($deleteIds, [$this->auth->id]);
                if ($deleteIds)
                {
                    $this->model->destroy($deleteIds);
                    model('AuthGroupAccess')->where('uid', 'in', $deleteIds)->delete();
                    $this->success();
                }
            }
        }
        $this->error();
    }

    /**
     * 批量更新
     * @internal
     */
    public function multi($ids = "")
    {
        // 管理员禁止批量操作
        $this->error();
    }

    /**
     * 下拉搜索
     */
    protected function selectpage()
    {
        $this->dataLimit = 'auth';
        $this->dataLimitField = 'id';
        return parent::selectpage();
    }

}
