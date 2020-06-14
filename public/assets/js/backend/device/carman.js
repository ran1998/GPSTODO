define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'bootstrap-datetimepicker', 'juicer'], function ($, undefined, Backend, Table, Form, datetimepicker) {

    var Controller = {
        index: function () {
            // 初始化表格参数配置
            Table.api.init({
                extend: {
                    index_url: 'device/carman/index',
                    edit_url: 'device/carman/edit',
                    del_url: 'device/carman/del',
                    multi_url: 'auth/admin/multi',
                }
            });

            var table = $("#table");

            //在表格内容渲染完成后回调的事件
            // table.on('post-body.bs.table', function (e, json) {
            //     $("tbody tr[data-index]", this).each(function () {
            //         if (parseInt($("td:eq(1)", this).text()) == Config.admin.id) {
            //             $("input[type=checkbox]", this).prop("disabled", true);
            //         }
            //     });
            // });

            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                columns: [
                    [
                        {field: 'state', checkbox: true, },
                        {field: 'cus_name', title: '车主姓名  '},
                        {field: 'identity', title: '身份证号码'},
                        {field: 'cus_iphone', title: '车主手机号'},
                        {field: 'car_num', title: '车牌号码'},
                        {field: 'car_cate', title: '车辆类型'},
                        {field: 'sn', title: '设备号'},
                        {field: 'createtime', title: '安装日期', formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true},
                        {field: 'baoxian_money', title: '保险金额'},
                        {field: 'car_cate', title: '所属组'},
                        {field: 'info', title: '车辆详细信息', formatter: function (value, row, index) {
                            return '<button type="button" key="'+row['sn']+'" class="btn btn-primary btn-sm car_detail" data-toggle="modal" data-target="#myModal">详细信息</button>'
                        }},
                        {field: 'Status', title: '审核状态', formatter: function (value, row, index) {
                            status = row.is_pass ? (row.is_pass == 1 ? '审核通过' : '审核不通过') : '未审核'; 
                            return '<button type="button" class="btn btn-'+(row.is_pass == 1 ? 'primary' : 'danger')+'">'+status+'</button>'
                        }},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: function (value, row, index) {
                            table.bootstrapTable('getOptions')['pk'] = 'sn';
                            return Table.api.formatter.operate.call(this, value, row, index);
                        }}
                  
                        // {field: 'groups_text', title: __('Group'), operate:false, formatter: Table.api.formatter.label},
                        // {field: 'email', title: __('Email')},
                        // {field: 'status', title: __("Status"), formatter: Table.api.formatter.status},
                        // {field: 'logintime', title: __('Login time'), formatter: Table.api.formatter.datetime, operate: 'RANGE', addclass: 'datetimerange', sortable: true},
                        // {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: function (value, row, index) {
                        //         if(row.id == Config.admin.id){
                        //             return '';
                        //         }
                        //         return Table.api.formatter.operate.call(this, value, row, index);
                        //     }}
                    ]
                ],
                rowStyle: function (row, index) {
                    var style = "";            
                    if (row.is_pass == 0) {
                        style='danger';         
                    }
                    return {classes: style }
                },
                templateView: false,
                clickToSelect: false,
                search: true,
                showColumns: false,
                showToggle: false,
                showExport: false,
                showSearch: false,
                commonSearch: true,
                searchFormVisible: true,
                searchFormTemplate: 'searchformtpl',
            });

            $('#btn-export-baoxian').on('click', function () {
                var createtime = $('#createtime').val();
                if (!createtime) {
                    Backend.api.toastr.error('请先选择时间!');
                    return false;
                }
                var url = '/device/carman/exportbaoxin'+'?createtime='+createtime;
                $('body').append('<iframe style="display: none;" src="'+url+'"></iframe>');
            })
            $('body').delegate('.car_detail', 'click', function () {
                Controller.detail(this);
            })
            $('body').delegate('.modalImg','click', function() {
                var source = $(this).find('img').attr('src');
                $("#PicModal", parent.document).find(".modal-content").html("<image src='"+source+"' class='carousel-inner img-responsive img-rounded' />");
                $("#PicModal", parent.document).modal();
            })
            // 为表格绑定事件
            Table.api.bindevent(table);
        },
        add: function () {
            Form.api.bindevent($("form[role=form]"));
        },
        edit: function () {
            var _html = {pass: '', noPass: ''};
            $('input[name="row[is_pass]"]').click(function () {
                if ($(this).val() == 1) {
                    $('#pass-container').show();
                    $('#noPass-container').hide();
                } else if ($(this).val() == 2) {
                    $('#pass-container').hide();
                    $('#noPass-container').show();
                }
            })
            Form.api.bindevent($("form[role=form]"));
        },
        detail: function (othis) {
            var key = $(othis).attr('key');
            $.ajax({
                url: 'device/carman/detail',
                data: {'sn': key},
                dataType: 'json',
                success: function (data) {
                    console.log(data);
                    var _html = juicer($('#deviceDetail').html()).render(data);
                    $("#myModal .modal-content").html(_html);
                }
            })
        }
    };
    return Controller;
});