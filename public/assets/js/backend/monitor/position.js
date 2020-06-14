define(['jquery', 'bootstrap', 'backend', 'table', 'form', 'amap', 'moment','tracker', 'zTree','zTreeCheck', 'juicer','bootstrap-slider', 'bootstrap-daterangepicker'], function ($, undefined, Backend, Table, Form, Amap, Monment, Tracker) {

    var Controller = {
        index: function () {
            var myMap = Amap.init({});
            var treeObj;
            myMap.showMarkers = {};

            var setting = {
              view: {
                dblClickExpand: false,
                showLine: true,
                selectedMulti: false
              },
              data: {
                simpleData: {
                  enable: true,
                  idKey: "id",
                  pIdKey: "pId",
                  rootPId: ""
                }
              },
              callback: {
                onClick: treenodeClick
              }
            };

            $(document).ready(function () {
                $.ajaxSettings.async = false;
                var t = $("#tree");
                $.get('/category/getCategoryTree', function (data) {
                    zNodes = data;
                })
                t = $.fn.zTree.init(t, setting, zNodes);
                treeObj = $.fn.zTree.getZTreeObj("tree");
                var nodes = treeObj.getNodes();
                if (nodes.length>0) {
                    treeObj.selectNode(nodes[0]);
                }
                // 指令下发tree
                var data = [
                    {'id': 1, 'name': '设防，撤防', 'cmd': 'defence'},
                    {'id': 1, 'name': '断油，断电', 'cmd': 'relay'},
                ];
                var cmd_setting = setting;
                setting.callback.onClick = function (event, treeId, treeNode, clickFlag) {
                  $('.JsonData[cmd="'+ treeNode['cmd'] +'"]').show().siblings().hide();
                }
                $.fn.zTree.init($("#cmd_ztree"), cmd_setting, data);
                var cmd_treeObj = $.fn.zTree.getZTreeObj("cmd_ztree");

                // 选项卡
                $('#navbar a').click(function () {
                    $(this).addClass('active').siblings().removeClass('active');
                    $('#navdiv ul').eq($(this).index()).show().siblings().hide();
                    AjaxPage();
                })
                // 点击显示marker
                myMap.createMarker = function (data) {
                    var content = new Array();
                    var position = new AMap.LngLat(data.lon, data.lat);
                    markerParams = {map: myMap.map, position: position, icon: data.image};
                    content.push('<table style="width:180px;margin-top:10px;" class="options-table"><tbody>');
                    content.push('<tr><td colspan="2" style="font-size:20px;width:100px"><font color="#00a6ac"> '+ data.car_num +'</font></td><td style="text-align:right;font-size:14px">'+ data.cus_name +'</td></tr>');
                    content.push('<tr><td colspan="2" > 电量: </font></td><td style="text-align:right;font-size:14px">'+ data.battery +'</td></tr>');
                    content.push('<tr><td style="text-align:left;width:40px;">电话&nbsp;:&nbsp;</td><td style="text-align:left;">'+ data.cus_iphone +'</td><td style="text-align:right;"><a href="javascript:void(0)" class="show_detailsbtns">详情</a></td></tr>');
                    content.push('<tr style="display: none;">');
                    content.push('<td style="text-align:left;width:180px;" colspan="3"><div class="btn-group" style="margin-top: 10px; display: inline-block;"><button type="button" key="'+ data.sn +'" attr-type="detail" data-toggle="modal" data-target="#DeviceDetails" class="btn btn-default btn-sm deviceDetails_btn" style="width:85px;margin-right:10px;">车辆详情</button>');
                    content.push('<button type="button" key="'+data.sn+'" attr-type="directive" data-toggle="modal" class="btn btn-default btn-sm cmd_btn" data-toggle="modal" data-target="#directive" style="width:85px;">指令下发</button></div>');
                    content.push('<div class="btn-group" style="margin-top: 3px; display: inline-block;"><button type="button" key="'+data.sn+'" attr-type="report" class="btn btn-default btn-sm overLosts_btn" data-toggle="modal" data-target="#report" style="width:85px;margin-right:10px;">报案处置</button>');
                    content.push('<button type="button" key="'+data.sn+'" class="btn btn-default btn-sm follow_btn" style="width:85px;"><a target="_blank" href="/monitor/position/follow?sn='+data.sn+'&name='+ data.car_num +'">实时跟踪</a></button></div>');
                    content.push('<div class="btn-group" style="margin-top: 3px; display: inline-block;"><button type="button" key="'+data.sn+'" attr-type="alertinfo" data-toggle="modal" data-target="#alertinfo" class="btn btn-default btn-sm handleAlarms_btn" style="width:85px;margin-right:10px;">预警处置</button>');
                    content.push('<button type="button" key="'+data.sn+'" class="btn btn-default btn-sm playback_btn" style="width:85px;"><a target="_blank" href="/monitor/position/history?sn='+data.sn+'&name='+ data.car_num +'">轨迹回放</a></button></div></td></tr></tbody></table>');
                    content = content.join("")
                    markerInfo = myMap.markerInfo(content, markerParams);        
                    myMap.showMarkers[data.sn] = markerInfo;
                    // myMap.geocoder(position, function (address) {
                    //     // content.push('<tr><td colspan="2" >地址:</td><td style="text-align:right;font-size:14px">'+ address +'</td></tr>');
                    // })
                }
                myMap.removeMarker = function (markerId) {
                    markerInfo = this.showMarkers[markerId];
                    markerInfo['marker'].setMap(null);
                    markerInfo['marker'] = null;
                    markerInfo['infoWindow'].close();
                    myMap.showMarkers[markerId] = null;
                }
                $('input:checkbox').click(function (event) {
                    event.stopPropagation();
                })
                $('#navdiv ul').on('click', 'li', function (event) {
                    var checkbox = $(this).find('input:checkbox');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    var data = JSON.parse($(this).attr('row'));
                    if (data.disabled != 'disabled') {
                        if (myMap.showMarkers[data.sn] != null) {
                            myMap.removeMarker(data.sn);
                        } else {
                            myMap.createMarker(data);                            
                        }
                    }
                })
                // 详情切换
                $('body').on('click', '.show_detailsbtns', function () {
                    var oTr = $(this).parents('table').find('tr').eq(3);
                    if ($(oTr).css('display') == 'none') {
                        $(oTr).show();
                        $(this).html('取消详情');
                    } else {
                        $(oTr).hide();
                        $(this).html('详情');
                    }
                })
                // 搜索设备
                $('.monitor-btn').click(function () {
                    var type = $(this).attr('attr-type');
                    if (type) {                    
                        monitor_fun[type]();
                    }
                })
                $('body').on('click', '.options-table button', function () {
                    var type = $(this).attr('attr-type');
                    if (type != undefined) {                    
                        Controller[type]($(this));
                    }
                })
                $('body').on('hidden.bs.modal', '.modal', function () {
                    $(this).removeData('bs.modal');
                });
            
            });
            function treenodeClick(event, treeId, treeNode, clickFlag) {
                //此处treeNode 为当前节点
                var str ='' ;
                nodeStr = getChildNodes(treeNode,str);
                
                AjaxPage();
            }
             
            function getChildNodes(treeNode,result){
                result += treeNode['id'];
                return result;
                if (treeNode.isParent) {
                    var childrenNodes = treeNode.children;
                    if (childrenNodes) {
                        for (var i = 0; i < childrenNodes.length; i++) {
                            result += ',' + childrenNodes[i].id;
                            result = getChildNodes(childrenNodes[i], result);
                        }
                    }
                } else {
                    if (!result) {                    
                        result += treeNode['id'];
                    }
                }
                return result;
            }
            // 设备列表
            AjaxPage = function (page) {
                var page = page || 1;
                var condition = {
                    'status': $('#navbar a.active').attr('key'),
                    'cate_id': getChildNodes(treeObj.getSelectedNodes()[0], ''),
                    'name': $('.search-input').val()
                }
                $.ajax({
                    'url': 'monitor/position/getDeviceByStatus?page='+page,
                    'dataType': 'json',
                    'data': condition,
                    success: function (data) {
                        var _html = juicer($('#deviceList').html()).render(data.rows);
                        var index = $('#navbar a.active').index();
                        $('#navdiv ul').eq(index).html(_html);
                        $('#btn-wrap').html(data['page']);
                        $.each(data.rows.data, function (i, obj) {
                            if (myMap.showMarkers[obj.sn] && myMap.showMarkers[obj.sn] != null) {
                                $("#navdiv input[key='"+obj.sn+"']").prop('checked', 'checked');
                            }
                        })
                    }
                })
            }
            $('.search-btn').click(AjaxPage());
            // 监控按钮
            var monitor_fun = {
                all: function () {
                    var condition = {
                        'status': $('#navbar a.active').attr('key'),
                        'cate_id': getChildNodes(treeObj.getSelectedNodes()[0], ''),
                        'select': 'all',
                    }
                    $.get('monitor/position/getDeviceByStatus', condition, function (data) {
                        $.each(data, function (i, obj) {
                            if (obj.lat!=null && !myMap.showMarkers[obj.sn]) {
                                myMap.createMarker(obj);
                                $("#navdiv input[key='"+obj.sn+"']").prop('checked', 'checked');
                            }
                        })
                    })
                },
                current: function () {
                    var navdiv = $('#navdiv ul').eq($('#navbar a.active').index());
                    $(navdiv).find('li').each(function (i, obj) {
                        var data = JSON.parse($(obj).attr('row'));
                        if (data.lat != null && !myMap.showMarkers[data.sn]) {
                            myMap.createMarker(data);
                            $("#navdiv input[key='"+data.sn+"']").prop('checked', 'checked');
                        }
                    })
                },
                cancel: function () {
                    $('#navdiv input').prop('checked', '');
                    myMap.clearMap();
                    myMap.showMarkers = {};
                }
            }
         
        },
        devicegroupform: function () {
            var setting = {
                // check: {
                //     enable: true,
                //     chkStyle: "radio",
                //     radioType: "all"
                // },
                data: {
                    simpleData: {
                        enable: true
                    }
                },
                callback: {
                  onClick: treenodeClick
                }
            };
            $.ajaxSettings.async = false;
            var t = $("#modaltree");
            $.get('/monitor/position/getDeviceGroup', function (data) {
                zNodes = data['rows'];
                // $('#group-page').html(data['page']);
            })
            t = $.fn.zTree.init(t, setting, zNodes);
            treeObj = $.fn.zTree.getZTreeObj("tree");
            this.modalTree = treeObj;
            var nodes = treeObj.getNodes();
            if (nodes.length>0) {
                treeObj.selectNode(nodes[0]);
            }
            function treenodeClick(event, treeId, treeNode, clickFlag) {
                Controller.modalCheckNode = treeNode;
                console.log(treeNode);
            }

            //setCheck();
            function setCheck() {
                var zTree = $.fn.zTree.getZTreeObj("modaltree"),
                py = $("#py").attr("checked")? "p":"",
                sy = $("#sy").attr("checked")? "s":"",
                pn = $("#pn").attr("checked")? "p":"",
                sn = $("#sn").attr("checked")? "s":"",
                type = { "Y":py + sy, "N":pn + sn};
                zTree.setting.check.chkboxType = type;
            }
            function showCode(str) {
                if (!code) code = $("#code");
                code.empty();
                code.append("<li>"+str+"</li>");
            }
            window.add_from = function () {
                if (!Controller.modalCheckNode) {
                    alert('请选中分组');
                    return false;
                }
                var keys = new Array();
                if (Controller.modalCheckNode.pId == null) {
                    alert('请选择分组');
                    return false;
                } else {
                    var checkNode = Controller.modalCheckNode;
                }
                var checked = $('#navdiv ul input[type="checkbox"]:checked');
                $(checked).each(function (i, obj) {
                    var key = $(obj).attr('key');
                    keys.push(key);
                })
                if (!keys.length) {
                    alert('请先选中设备!');
                    return false;
                }
                var params = {sns: keys.join(','), group: checkNode['id']};
                $.ajax({
                    'url': 'monitor/position/shiftDevice',
                    'dataType': 'json',
                    'data': params,
                    success: function (res) {
                        if (res.code == 1) {
                            alert('转移设备成功!');
                            jQuery('#modal-add').modal('hide');
                            setTimeout(function () {
                                location.reload();
                            }, 1500)
                        } else {
                            alert('转移设备失败');
                        }
                    }
                })
            }
        },
        main: function () {
            var myMap = Amap.init({});
            var treeObj;
            myMap.showMarkers = {};

            var setting = {
              view: {
                dblClickExpand: false,
                showLine: true,
                selectedMulti: false
              },
              data: {
                simpleData: {
                  enable: true,
                  idKey: "id",
                  pIdKey: "pId",
                  rootPId: ""
                }
              },
              callback: {
                onClick: treenodeClick
              }
            };

            $(document).ready(function () {
                $.ajaxSettings.async = false;
                var t = $("#tree");
                $.get('/monitor/position/getDeviceGroup', function (data) {
                    zNodes = data['rows'];
                    // $('#group-page').html(data['page']);
                })
                t = $.fn.zTree.init(t, setting, zNodes);
                treeObj = $.fn.zTree.getZTreeObj("tree");
                var nodes = treeObj.getNodes();
                if (nodes.length>0) {
                    treeObj.selectNode(nodes[0]);
                }
                
                // 指令下发tree
                var data = [
                    {'id': 1, 'name': '设防，撤防', 'cmd': 'defence'},
                    {'id': 1, 'name': '断油，断电', 'cmd': 'relay'},
                ];
                var cmd_setting = setting;
                setting.callback.onClick = function (event, treeId, treeNode, clickFlag) {
                  $('.JsonData[cmd="'+ treeNode['cmd'] +'"]').show().siblings().hide();
                }
                $.fn.zTree.init($("#cmd_ztree"), cmd_setting, data);
                var cmd_treeObj = $.fn.zTree.getZTreeObj("cmd_ztree");

                // 选项卡
                $('#navbar a').click(function () {
                    $(this).addClass('active').siblings().removeClass('active');
                    $('#navdiv ul').eq($(this).index()).show().siblings().hide();
                    AjaxPage();
                })
                // 点击显示marker
                myMap.createMarker = function (data) {
                    var content = new Array();
                    var position = new AMap.LngLat(data.lon, data.lat);
                    markerParams = {map: myMap.map, position: position, icon: data.image};
                    content.push('<table style="width:180px;margin-top:10px;" class="options-table"><tbody>');
                    content.push('<tr><td colspan="2" style="font-size:20px;width:100px"><font color="#00a6ac"> '+ data.sn +'</font></td><td style="text-align:right;font-size:14px">'+ data.cus_name +'</td></tr>');
                    content.push('<tr><td colspan="2" > 电量: </font></td><td style="text-align:right;font-size:14px">'+ data.battery +'</td></tr>');
                    // content.push('<tr><td style="text-align:left;width:40px;">电话&nbsp;:&nbsp;</td><td style="text-align:left;">'+ data.cus_iphone +'</td><td style="text-align:right;"><a href="javascript:void(0)" class="show_detailsbtns">详情</a></td></tr>');
                    // content.push('<tr style="display: none;">');
                    // content.push('<td style="text-align:left;width:180px;" colspan="3"><div class="btn-group" style="margin-top: 10px; display: inline-block;"><button type="button" key="'+ data.sn +'" attr-type="detail" data-toggle="modal" data-target="#DeviceDetails" class="btn btn-default btn-sm deviceDetails_btn" style="width:85px;margin-right:10px;">车辆详情</button>');
                    // content.push('<button type="button" key="'+data.sn+'" attr-type="directive" data-toggle="modal" class="btn btn-default btn-sm cmd_btn" data-toggle="modal" data-target="#directive" style="width:85px;">指令下发</button></div>');
                    // content.push('<div class="btn-group" style="margin-top: 3px; display: inline-block;"><button type="button" key="'+data.sn+'" attr-type="report" class="btn btn-default btn-sm overLosts_btn" data-toggle="modal" data-target="#report" style="width:85px;margin-right:10px;">报案处置</button>');
                    // content.push('<button type="button" key="'+data.sn+'" class="btn btn-default btn-sm follow_btn" style="width:85px;"><a target="_blank" href="/monitor/position/follow?sn='+data.sn+'&name='+ data.car_num +'">实时跟踪</a></button></div>');
                    // content.push('<div class="btn-group" style="margin-top: 3px; display: inline-block;"><button type="button" key="'+data.sn+'" attr-type="alertinfo" data-toggle="modal" data-target="#alertinfo" class="btn btn-default btn-sm handleAlarms_btn" style="width:85px;margin-right:10px;">预警处置</button>');
                    // content.push('<button type="button" key="'+data.sn+'" class="btn btn-default btn-sm playback_btn" style="width:85px;"><a target="_blank" href="/monitor/position/history?sn='+data.sn+'&name='+ data.car_num +'">轨迹回放</a></button></div></td></tr></tbody></table>');
                    content = content.join("")
                    markerInfo = myMap.markerInfo(content, markerParams);        
                    myMap.showMarkers[data.sn] = markerInfo;
                    // myMap.geocoder(position, function (address) {
                    //     // content.push('<tr><td colspan="2" >地址:</td><td style="text-align:right;font-size:14px">'+ address +'</td></tr>');
                    // })
                }
                myMap.removeMarker = function (markerId) {
                    markerInfo = this.showMarkers[markerId];
                    markerInfo['marker'].setMap(null);
                    markerInfo['marker'] = null;
                    markerInfo['infoWindow'].close();
                    myMap.showMarkers[markerId] = null;
                }
                $('input:checkbox').click(function (event) {
                    event.stopPropagation();
                })
                $('#navdiv ul').on('click', 'li', function (event) {
                    var checkbox = $(this).find('input:checkbox');
                    checkbox.prop('checked', !checkbox.prop('checked'));
                    var data = JSON.parse($(this).attr('row'));
                    if (data.disabled != 'disabled') {
                        if (myMap.showMarkers[data.sn] != null) {
                            myMap.removeMarker(data.sn);
                        } else {
                            myMap.createMarker(data);                            
                        }
                    }
                })
                // 详情切换
                $('body').on('click', '.show_detailsbtns', function () {
                    var oTr = $(this).parents('table').find('tr').eq(3);
                    if ($(oTr).css('display') == 'none') {
                        $(oTr).show();
                        $(this).html('取消详情');
                    } else {
                        $(oTr).hide();
                        $(this).html('详情');
                    }
                })
                // 搜索设备
                $('.monitor-btn').click(function () {
                    var type = $(this).attr('attr-type');
                    if (type) {                    
                        monitor_fun[type]();
                    }
                })
                $('body').on('click', '.options-table button', function () {
                    var type = $(this).attr('attr-type');
                    if (type != undefined) {                    
                        Controller[type]($(this));
                    }
                })
                $('body').on('hidden.bs.modal', '.modal', function () {
                    $(this).removeData('bs.modal');
                });
                $('.shift-btn').click(function () {
                    jQuery('#modal-add').modal('show', {backdrop: 'static'});
                    //jQuery('#modal-add .modal-body').html('111');
                })
                Controller.devicegroupform();
            
            });
            function treenodeClick(event, treeId, treeNode, clickFlag) {
                //此处treeNode 为当前节点
                var str ='' ;
                nodeStr = getChildNodes(treeNode,str);
                
                AjaxPage();
            }
             
            function getChildNodes(treeNode,result){
                if (treeNode.isParent) {
                    var childrenNodes = treeNode.children;
                    if (childrenNodes) {
                        for (var i = 0; i < childrenNodes.length; i++) {
                            result += ',' + childrenNodes[i].id;
                            result = getChildNodes(childrenNodes[i], result);
                        }
                    }
                } else {
                    if (!result) {                    
                        result += treeNode['id'];
                    }
                }
                return result;
            }
            // 设备列表
            AjaxPage = function (page) {
                var page = page || 1;
                var condition = {
                    'status': $('#navbar a.active').attr('key'),
                    'cate_id': getChildNodes(treeObj.getSelectedNodes()[0], ''),
                    'name': $('.search-input').val()
                }
                $('#loading').modal('show');
                var beginTime = (new Date()).getTime();
                $.ajax({
                    'url': 'monitor/position/getGpsDevice?page='+page,
                    'dataType': 'json',
                    'data': condition,
                    success: function (data) {
                        var _html = juicer($('#deviceList').html()).render(data.rows);
                        var index = $('#navbar a.active').index();
                        $('#navdiv ul').eq(index).html(_html);
                        $('#btn-wrap').html(data['page']);
                        $.each(data.rows.data, function (i, obj) {
                            if (myMap.showMarkers[obj.sn] && myMap.showMarkers[obj.sn] != null) {
                                $("#navdiv input[key='"+obj.sn+"']").prop('checked', 'checked');
                            }
                        })
                    },
                    complete: function () {
                        var endTime = (new Date()).getTime();
                        var destTime = endTime - beginTime;
                        if ( destTime < 2000 ) {
                            setTimeout(function () {                            
                                $('#loading').modal('hide');
                            }, destTime)
                        } else {
                            $('#loading').modal('hide');
                        }
                    }
                })
            }
            window.GroupPage = function (page) {
                var page = page || 1;
                var groupname = $('#groupname').val();
                var params = '?page='+page+'&groupname='+groupname;
                $.get('/monitor/position/getDeviceGroup'+params, function (data) {
                    var zNodes = data['rows'];
                    $.fn.zTree.destroy("tree");
                    var t = $("#tree");
                    t = $.fn.zTree.init(t, setting, zNodes);
                    treeObj = $.fn.zTree.getZTreeObj("tree");
                    var nodes = treeObj.getNodes();
                    if (nodes.length>0) {
                        treeObj.selectNode(nodes[0]);
                    }
                    // $('#group-page').html(data['page']);
                })
                
            }
            
            $('.search-btn').click(AjaxPage());
            // 监控按钮
            var monitor_fun = {
                all: function () {
                    var condition = {
                        'status': $('#navbar a.active').attr('key'),
                        'cate_id': getChildNodes(treeObj.getSelectedNodes()[0], ''),
                        'select': 'all',
                    }
                    $.get('monitor/position/getGpsDevice', condition, function (data) {
                        $.each(data, function (i, obj) {
                            if (obj.lat!=null && !myMap.showMarkers[obj.sn]) {
                                myMap.createMarker(obj);
                                $("#navdiv input[key='"+obj.sn+"']").prop('checked', 'checked');
                            }
                        })
                    })
                },
                current: function () {
                    var navdiv = $('#navdiv ul').eq($('#navbar a.active').index());
                    $(navdiv).find('li').each(function (i, obj) {
                        var data = JSON.parse($(obj).attr('row'));
                        if (data.lat != null && !myMap.showMarkers[data.sn]) {
                            myMap.createMarker(data);
                            $("#navdiv input[key='"+data.sn+"']").prop('checked', 'checked');
                        }
                    })
                },
                cancel: function () {
                    $('#navdiv input').prop('checked', '');
                    myMap.clearMap();
                    myMap.showMarkers = {};
                }
            }
        },
        add: function () {
            Form.api.bindevent($("form[role=form]"));
        },
        edit: function () {
            var _html = {pass: '', noPass: ''};
            $('input[name="row[is_pass]"]').click(function () {
                if ($(this).val() == 1) {
                    $('#pass-container').append(_html.pass);
                    $('#noPass-container').hide();
                } else if ($(this).val() == 2) {
                    if (!_html.pass) {                    
                        _html.pass = $('#pass-container').html(); 
                    }
                    $('#pass-container').empty();
                    $('#noPass-container').show();
                }
            })
            Form.api.bindevent($("form[role=form]"));
        },
        history: function () {
            var myMap = Amap.init({});
            var movingControl = null;
            // With JQuery 使用JQuery 方式调用
            $('#ex1').slider({
                formatter: function (value) {
                    return 'Current value: ' + value;
                }
            }).on('change', function (e) {
               if (movingControl != null) {
                    movingControl.speed(e.value.newValue);
               }
            });
            $(function () {
                $('input[name="startDate"]').val(Monment().hours(0).minutes(0).seconds(0).format('YYYY-MM-DD HH:mm:ss'));
                $('input[name="endDate"]').val(Monment().hours(23).minutes(59).seconds(59).format('YYYY-MM-DD HH:mm:ss'));
                $('input[name="datePicker"]').daterangepicker({
                    timePicker: true, //显示时间
                    timePicker24Hour: true, //时间制
                    timePickerSeconds: true, //时间显示到秒
                    startDate: Monment().hours(0).minutes(0).seconds(0), //设置开始日期
                    endDate: Monment().hours(23).minutes(59).seconds(59), //设置结束器日期
                    maxDate: Monment().hours(23).minutes(59).seconds(59), //设置最大日期
                    "opens": "center",
                    ranges: {
                        // '今天': [Monment(), Monment()],
                        '昨天': [Monment().subtract(1, 'days'), Monment().subtract(1, 'days')],
                        '上周': [Monment().subtract(6, 'days'), Monment()],
                        '前30天': [Monment().subtract(29, 'days'), Monment()],
                        '本月': [Monment().startOf('month'), Monment().endOf('month')],
                        '上月': [Monment().subtract(1, 'month').startOf('month'), Monment().subtract(1, 'month').endOf('month')]
                    },
                    showWeekNumbers: true,
                    locale: {
                        format: "YYYY-MM-DD HH:mm:ss", //设置显示格式
                        applyLabel: '确定', //确定按钮文本
                        cancelLabel: '取消', //取消按钮文本
                        customRangeLabel: '自定义',
                        daysOfWeek: ['日', '一', '二', '三', '四', '五', '六'],
                        monthNames: ['一月', '二月', '三月', '四月', '五月', '六月',
                            '七月', '八月', '九月', '十月', '十一月', '十二月'
                        ],
                        firstDay: 1
                    },
                }, function(start, end, label) {
                    timeRangeChange = [{startDate: start.format('YYYY-MM-DD HH:mm:ss')}, {endDate: end.format('YYYY-MM-DD HH:mm:ss')}];
                    $(timeRangeChange).each(function (i, obj) {
                        $.each(obj, function (k, v) {
                            $('#dataForm input[name="'+ k +'"]').val(v);
                        })
                    })
                });
                //
                $('.control_btn').click(function () {
                    var type = $(this).attr('attr-type');
                    if (type == 'play') {
                        if (movingControl != null) {
                            if (movingControl._status == 'run') {
                                movingControl.move();
                            } else {
                                movingControl.stop();
                                $.ajax({
                                    type: 'post',
                                    url: '/monitor/position/track',
                                    data: $('#dataForm').serializeArray(),
                                    success: function (data) {
                                        movingControl = myMap.initTrack(data.data);
                                    }
                                })
                            }

                        } else {
                            $.ajax({
                                type: 'post',
                                url: '/monitor/position/track',
                                data: $('#dataForm').serializeArray(),
                                success: function (data) {
                                    
                                    if (data.data == undefined) {
                                        alert('暂无轨迹信息');
                                    } else {                                    
                                        movingControl = myMap.initTrack(data.data);
                                    }
                                }
                            })
                        }
                    } else if(type == 'stop') {
                        if (movingControl != null) {
                            movingControl.stop();
                        }
                    }
                })

                

            })
            Form.api.bindevent($("form[role=form]"));
        },
        follow: function () {
            var myMap = Amap.init({});
            var movingControl = null;
            var lat = $('input[name="lat"]').val();
            var lon = $('input[name="lon"]').val();
            var sn = $('input[name="sn"]').val();
            var route = myMap.markerInfo($('#positionMarker').html(), {
                map: myMap.map, position: new AMap.LngLat(lon, lat)
            })
            var passedPolyline = new AMap.Polyline({
                map: myMap.map,
                // path: lineArr,
                strokeColor: "#AF5",  //线颜色
                // strokeOpacity: 1,     //线透明度
                strokeWeight: 6,      //线宽
                // strokeStyle: "solid"  //线样式
            });

            // 监控
            function monitor(next) {
                $.ajax({
                    type: 'post',
                    url: '/monitor/position/follow',
                    data: next,
                    success: function (data) {
                        if (data.result.length) {
                            if (movingControl) {
                                movingControl.addPath(data.result);
                                movingControl.move();
                            } else {
                                movingControl = new Tracker(myMap.map, route, passedPolyline, []);
                                movingControl.addPath(data.result);
                                movingControl.restart();
                                movingControl.complete = function () {
                                    
                                }
                            }
                        }
                        setTimeout(function () {                        
                            monitor(data.next);
                        }, 3000);
                    }
                })
            }
            monitor({'sn': sn});
        },
        alertinfo: function (othis) {
            var sn = $(othis).attr('key');
            console.log(sn);
            $('#alertinfo-title').html(sn + '预警处置');
            Table.api.init({
                extend: {
                    index_url: '/monitor/position/getAlertinfo?sn='+sn,
                }
            });

            var table = $("#alertinfo_table");
            $("#alertinfo_table").bootstrapTable('destroy');
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                columns: [
                    [
                        {field: 'state', checkbox: true, },
                        {field: 'time', title: '报警时间'},
                        {field: 'type_text', title: '报警类型'},
                        {field: 'operate', title: '地址', table: table, events: Table.api.events.operate, formatter: function (value, row, index) {                               
                                return '<a onClick="showGeocoder('+row.lon+','+row.lat+',this)">查看</a>';
                        }}
                    ]
                ],
                onCheck:enableEdit,
                onUncheck:enableEdit
            });
            // 为表格绑定事件
            Table.api.bindevent(table);
            showGeocoder = function (lat,lon, othis) {      
            var position = new AMap.LngLat(lat, lon);   
                Amap.geocoder(position, function (address) {
                    $(othis).html(address);
                })
            }
            function enableEdit() {
                var data = $(table).bootstrapTable('getSelections');
                if (data.length == 1) {
                    $('.alertinfo_btn').removeAttr('disabled');
                } else {
                    $('.alertinfo_btn').attr('disabled', 'disabled');
                }
            }
            // 处理报警
            $('.alarm_btn').unbind("click").click(function () {
                var data = $(table).bootstrapTable('getSelections')[0];
                var selectVal = $('#Reason_id option:selected').val();
                $.ajax({
                    url: 'monitor/position/handleAlarm',
                    data: {id: data['id']},
                    success: function (data) {
                        if (data.code == 1) {
                            $('#alarm_modal').modal('hide');
                            table.bootstrapTable('refresh');
                        } else {
                            alert(data.msg);
                        }
                    }
                })
            })
        }, 
        report: function (othis) {
            var key = $(othis).attr('key');
            var table = $("#report_table");
            $('#report-title').html(key + '报案处置');
            console.log(key);
            $("#report_table").bootstrapTable('destroy');
            Table.api.init({
                extend: {
                    index_url: 'monitor/report/index?sn='+key,
                }
            });
          
            // 初始化表格
            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                columns: [
                    [
                        {field: 'state', checkbox: true, },
                        {field: 'reporter', title: '报案人'},
                        {field: 'phone', title: '电话'},
                    ]
                ],
                onCheck:enableEdit,
                onUncheck:enableEdit
            });

            // 为表格绑定事件
            Table.api.bindevent(table);
            //opear
            $('.report-btn').unbind("click").on('click', function () {
                var type = $(this).attr('attr-type');
                report_fun[type]();
            })
            $('.report-confirm').unbind("click").on('click',function () {
                report_fun.post();
            })
            
            var report_fun = {
                url: {
                    add: 'monitor/report/add',
                    edit: 'monitor/report/edit',
                },
                post: function () {
                    var This = this;
                    this.request(this._url, function (data) {
                        if (data.code == 1) {
                            $('#report-add').modal('hide');
                            table.bootstrapTable('refresh');
                            alert("更新成功");
                        } else {                                
                            alert(data.msg);
                        }
                    })
                },
                add: function () {
                    this._url = this.url.add;
                    $("#report-add input[name='row[address]']").val('');
                    $("#report-add input[name='row[reporter]']").val('');
                    $("#report-add input[name='row[phone]']").val('');
                    $("#report-add input[name='row[sn]']").val(key);
                },
                edit: function () {
                    var data = $(table).bootstrapTable('getSelections')[0];
                    this._url = this.url.edit + '?id=' + data['id'];
                    $("#report-add input[name='row[address]']").val(data['address']);
                    $("#report-add input[name='row[reporter]']").val(data['reporter']);
                    $("#report-add input[name='row[phone]']").val(data['phone']);
                    $("#report-add input[name='row[sn]']").val(data['sn']);
                },
                request: function (url, func) {
                    $.ajax({
                        url: url,
                        type: 'post',
                        data: $('#report-addForm').serializeArray(),
                        dataType: 'json',
                        success: func
                    })
                }
            }
            function enableEdit() {
                var data = $(table).bootstrapTable('getSelections');
                if (data.length == 1) {
                    $('button[attr-type="edit"]').removeAttr('disabled');
                } else {
                    $('button[attr-type="edit"]').attr('disabled', 'disabled');
                }
            }
        },
        directive: function (othis) {
            var showBox;
            var key = $(othis).attr('key');
            $('.directive-btn').click(function () {

                $('.JsonData').each(function (i, obj) {
                    if ($(obj).css('display') == 'block') {
                        showBox = $(obj);
                    }
                })
                var val = $(showBox).find('input:radio:checked').val();
                var data = {'cmd': $(showBox).attr('cmd'), 'val': val, 'sn': key};
                $.ajax({
                    url: 'monitor/position/directive',
                    data: data,
                    success: function (data) {
                        if (data.code == 1) {
                            alert("下发成功");
                        } else {
                            alert("下发失败");
                        }
                    }
                })
            })
        },
        detail: function (othis) {
            var key = $(othis).attr('key');
            $.ajax({
                url: 'monitor/position/detail',
                data: {'sn': key},
                success: function (data) {
                    console.log(data);
                    var _html = juicer($('#detail_html').html()).render(data);
                    $("#DeviceDetails .modal-content").html(_html);
                }
            })
        },
      
    };
    return Controller;
});