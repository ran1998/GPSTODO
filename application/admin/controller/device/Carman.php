<?php

namespace app\admin\controller\device;

use app\admin\model\Customer;
use app\common\controller\Backend;
use think\Db;
use fast\Random;
use fast\Tree;
use \zip\Zipfile;

/**
 * 管理员管理
 *
 * @icon fa fa-users
 * @remark 一个管理员可以有多个角色组,左侧的菜单根据管理员所拥有的权限进行生成
 */
class Carman extends Backend
{

    /**
     * @var \app\admin\model\Admin
     */
    protected $model = null;
    protected $childrenGroupIds = [];
    protected $childrenAdminIds = [];

    // 公安对应管理员
    protected $relative = [
        array('source' => '10', 'relation' => '13'),
        array('source' => '26', 'relation' => '25'),
        array('source' => '21', 'relation' => '19')
    ];

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Customer');
        // $relative = Db::table('relative')->select();
        // if (!empty($relative)) {
        //     $relative = collection($relative)->toArray();
        //     $this->relative = $relative;
        // }
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
            if (!$this->auth->isSuperAdmin()) {
                $relativeId = null;
                foreach ($this->relative as $value) {
                    if ($this->auth->id == $value['source']) {
                        $relativeId = $value['relation'];
                    }
                }
                $user_ids = $this->auth->getAdminChilrensId($relativeId);
                $condition['user_id'] = array('in', implode(",", $user_ids));
            } else {
                $condition = array();
            }
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
            
            $sort = "createtime";
            $total = Db::table('customer_category_image')
                    ->where($where)
                    ->where($condition)
                    ->order($sort, $order)
                    ->count();

            $list = Db::table('customer_category_image')
                    ->where($where)
                    ->where($condition)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
        return $this->view->fetch();
    }


    public function exportbaoxin()
    {
        $createtime = $this->request->request('createtime', null);
        if ($createtime != null) {
            $beginend = explode(' - ', $createtime);
            list($begin, $end) = $beginend;
            $createtime = array('between', [strtotime($begin), strtotime($end)]);
        }
        $where = array(
            'createtime'    => $createtime
        );
        $list = Db::table('customer_category_image')
                    ->where($where)
                    ->select();
        $dfile =  tempnam('/tmp', 'tmp');//产生一个临时文件，用于缓存下载文件

        $zip = new Zipfile();
        $filename = '保险单'.date("Y-m-d H:i",time()).'.zip'; //下载的默认文件名

        $image = array();
        // print_r($list);exit;
        foreach ($list as $key => $item) {
            $imgname = $item['user_id'].'_'.$item['cus_iphone'].'_'.$item['cus_name'].'.jpg';
            $image[] = array('image_src' => $item['img_baoxian'], 'image_name' => $imgname);
        }
        foreach($image as $v){
            $zip->add_file(file_get_contents($v['image_src']),  $v['image_name']);
        }

        $zip->output($dfile);
        // 下载文件

        ob_clean();

        header('Pragma: public');

        header('Last-Modified:'.gmdate('D, d M Y H:i:s') . 'GMT');

        header('Cache-Control:no-store, no-cache, must-revalidate');

        header('Cache-Control:pre-check=0, post-check=0, max-age=0');

        header('Content-Transfer-Encoding:binary');

        header('Content-Encoding:none');

        header('Content-type:multipart/form-data');

        header('Content-Disposition:attachment; filename="'.$filename.'"'); //设置下载的默认文件名

        header('Content-length:'. filesize($dfile));

        $fp = fopen($dfile, 'r');

        while(connection_status() == 0 && $buf = @fread($fp, 8192)){

            echo $buf;

        }

        fclose($fp);

        @unlink($dfile);

        @flush();

        @ob_flush();

        exit();
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
        ->join('tb_image i', 'c.sn=i.sn')
        ->where(['c.sn' => $row['sn']])
        ->find();
        $customer_image['createtime'] = date('Y-m-d', $customer_image['createtime']);

        // $customer_image['img_baoxian'] = str_replace('http://www.smt110.com/', 'http://server.vmui.net/', $customer_image['img_baoxian']);
        // $customer_image['img_chejia'] = str_replace('http://www.smt110.com/', 'http://server.vmui.net/', $customer_image['img_chejia']);

        return json(['row' => $customer_image]);
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
                $is_pass = isset($params['is_pass']) ? $params['is_pass'] : 0;
                if ($is_pass == 1) {
                    // 通过审核                
                    $validate = validate('Customer');
                    if (!$validate->scene('save')->check($params)) {
                        $this->error($validate->getError());
                    }
                    model('customer')->updatePrimaryKey($params);
                    // 通过审核，创建客户账户
                    $exists = Db::table('ggps.account')->where(['account'=>$row['cus_iphone']])->find();
                    if (empty($exists)) {                    
                        $account = array(
                            'sn' => $row['sn'],
                            'account' => $row['cus_iphone'],
                            'pwd' => '123456'
                        );
                        Db::table('ggps.account')->insert($account);
                    }
                } else if ($is_pass == 2) {
                    // 未通过审核
                    if (empty($params['remark'])) {
                        $this->error('请说明审核不通过原因');
                    }
                    model('customer')->save(['is_pass'=>$params['is_pass'], 'remark'=>$params['remark']], ['sn' => $params['sn']]);
                } else {
                    $this->error("请选择审核状态");
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
            if (empty($tree->getChild($value['id']))) {            
                $cates[$value['id']] = $value['name'];
            }
        }
        $this->view->assign("row", $customer);
        $this->view->assign("cates", $cates);
        return $this->view->fetch();
    }

    /**
     * 删除
     */
    public function del($sns = "")
    {
        if ($sns)
        {
            // 启动事务
            Db::startTrans();
            try{
                model('image')->where('sn', 'in', $sns)->delete();
                $this->model->where('sn', 'in', $sns)->delete();
                model('devicestatus')->where('sn', 'in', $sns)->delete();
                // 提交事务
                Db::commit();    
            } catch (\Exception $e) {
                // 回滚事务
                Db::rollback();
                $this->error($e->getMessage());
            }
            $this->success();
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
