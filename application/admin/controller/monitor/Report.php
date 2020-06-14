<?php

namespace app\admin\controller\monitor;

use app\admin\model\AuthGroup;
use app\common\controller\Backend;
use fast\Tree;

/**
 * 角色组
 *
 * @icon fa fa-group
 * @remark 角色组可以有多个,角色有上下级层级关系,如果子角色有角色组和管理员的权限则可以派生属于自己组别下级的角色组或管理员
 */
class Report extends Backend
{

    /**
     * @var \app\admin\model\AuthGroup
     */
    protected $model = null;  

    public function _initialize()
    {
        parent::_initialize();
        $this->model = model('Report');
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
            $sn = $this->request->get('sn');
            $condition = array('sn' => $sn);
            list($where, $sort, $order, $offset, $limit) = $this->buildparams();
          
            $total = $this->model
                    ->where($where)
                    ->where($condition)
                    ->order($sort, $order)
                    ->count();

            $list = $this->model
                    ->where($where)
                    ->where($condition)
                    ->order($sort, $order)
                    ->limit($offset, $limit)
                    ->select();

            $result = array("total" => $total, "rows" => $list);

            return json($result);
        }
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
                $result = $this->model->validate('Report.add')->save($params);
                if ($result === false)
                {
                    $this->error($this->model->getError());
                }
                $this->success();
            }
            $this->error();
        }
        return $this->view->fetch();
    }
 

    /**
     * 编辑
     */
    public function edit($id = NULL)
    {
        $row = $this->model->get(['id' => $id]);
        if (!$row)
            $this->error(__('No Results were found'));
        if ($this->request->isPost())
        {
            $params = $this->request->post("row/a");
            if ($params)
            {
                $result = $row->validate('Report.edit')->save($params);
                if ($result === false)
                {
                    $this->error($row->getError());
                }

                $this->success();
            }
            $this->error();
        }
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


}
