define(['jquery', 'tracker'], function ($, Tracker) {
    var MAP_TYPE = "amap";
    var myMap = {
        init: function(option) {
            var This = this;
            container = option.container || 'container';
            //初始化地图BMap
            switch (MAP_TYPE) {
                case "google":
                    //google map
                    this.map = new google.maps.Map(document.getElementById(container), option);
                    if (!option.center) {
                        this.map.setCenter({
                            lat: this.latlng.lat,
                            lng: this.latlng.lng
                        });
                    }
                    var lat = this.map.getCenter().lat();
                    var lng = this.map.getCenter().lng();
                    this.latlng = {
                        lng,
                        lat
                    };
                    break;
                case "amap":
                    //高德 map
                    this.map = new AMap.Map(container, option);
                    this.latlng = this.map.getCenter();
                    this.map.plugin(["AMap.ToolBar"], function() {
                        //加载工具条
                        var tool = new AMap.ToolBar();
                        This.map.addControl(tool);
                    });
                    break;
                case "BMap":
                    this.map = new BMap.Map(container);
                    var point = new BMap.Point(this.latlng.lng, this.latlng.lat);
                    this.map.centerAndZoom(point, 15);
                    this.map.enableScrollWheelZoom(); //启用滚轮缩放地图
                    this.Satellite(); //开启卫星地图
                    break;
            }

            return this
        },
        getInstance: function() {
            return this.map;
        },
        marker: {
            setMarker: function(params) {
                switch (MAP_TYPE) {
                    case "google":
                        //google map
                        marker = new google.maps.Marker(params);
                        break;
                    case "amap":
                        //高德 map
                        marker = new AMap.Marker(params);
                        myMap.map.setFitView();
                        break;
                    case "BMap":
                        var point = new BMap.Point(params.position.lng, params.position.lat);
                        var convertor = new BMap.Convertor();
                        var pointArr = [];
                        pointArr.push(point);
                        translateCallback = function(data) {
                            if (data.status === 0) {
                                console.log(data.points[0]);
                                var marker = new BMap.Marker(data.points[0]);
                                myMap.map.addOverlay(marker);
                                myMap.map.setCenter(data.points[0]);
                                console.log(marker);
                                return marker;
                            }
                        }
                        convertor.translate(pointArr, 3, 5, translateCallback)

                        // console.log(params);
                        // var marker = new BMap.Marker(point);  // 创建标注
                        // console.log(marker);
                        // myMap.map.addOverlay(marker);          // 将标注添加到地图中
                        break;
                }
                return marker;
            }
        },
        infoWindow: {
            setInfoWindow: function(content, position) {
                switch (MAP_TYPE) {
                    case "google":
                        // google infoWindow
                        var infoWindow = new google.maps.InfoWindow({
                            content: content,
                            maxWidth: 400
                        });
                        infoWindow.open(myMap.map, myMap.markerObj);
                        break;
                    case "amap":
                        // 高德 infoWindow
                        var infoWindow = new AMap.InfoWindow({
                            // isCustom: true, //使用自定义窗体
                            content: content,
                            autoMove: true,
                            offset: new AMap.Pixel(16, -45)
                        });
                        infoWindow.open(myMap.map, position);
                        break;
                    case "BMap":
                        var infoWindow = new BMap.InfoWindow(content); // 创建信息窗口对象
                        myMap.map.openInfoWindow(infoWindow, position); // 打开信息窗口
                        break;
                }

                return infoWindow;
            },
            closeInfoWindow: function() {
                myMap.infoWindowObj.close();
            },
        },
        markerInfo: function(content, markerParams) {
            /**
             * @params  content, markerParams:标记点的参数
             */
            if (MAP_TYPE != "BMap") {
                markerObj = this.marker.setMarker(markerParams);
                infoWindowObj = this.infoWindow.setInfoWindow(content, markerObj.getPosition());
            }
            switch (MAP_TYPE) {
                case "google":
                    markerObj.addListener('click', function() {
                        infoWindowObj.open(myMap.map, markerObj);
                    });
                    break;
                case "amap":
                    // 高德 infoWindow
                    markerObj.content = content;
                    markerObj.on('click', function markerClick(e) {
                        infoWindowObj.setContent(e.target.content);
                        infoWindowObj.open(myMap.map, e.target.getPosition());
                    });
                    break;
                case "BMap":
                    var point = new BMap.Point(markerParams.position.lng, markerParams.position.lat);
                    var convertor = new BMap.Convertor();
                    var pointArr = [];
                    pointArr.push(point);
                    translateCallback = function(data) {
                        if (data.status === 0) {
                            var marker = new BMap.Marker(data.points[0]);
                            infoWindowObj = myMap.infoWindow.setInfoWindow(content, marker.getPosition());
                            myMap.map.addOverlay(marker);
                            myMap.map.setCenter(data.points[0]);
                            marker.addEventListener("click", function() {
                                myMap.map.openInfoWindow(infoWindowObj, marker.getPosition()); //开启信息窗口
                            });
                            return {
                                marker: marker,
                                infoWindow: infoWindowObj
                            };
                        }
                    }
                    convertor.translate(pointArr, 3, 5, translateCallback)

                    // markerObj.addEventListener("click", function(){          
                    //     myMap.map.openInfoWindow(infoWindowObj, myMap.markerObj.getPosition()); //开启信息窗口
                    // });
                    break;
            }
            return {
                marker: markerObj,
                infoWindow: infoWindowObj
            };
        },
        geocoder: function(lnglat, callback) {
            /**
             *@params lnglat坐标点，callback获取地址后的回调
             */
            switch (MAP_TYPE) {
                case "google":
                    //lnglat: {lat: lat, lng: lng}
                    var geocoder = new google.maps.Geocoder;
                    geocoder.geocode({
                        'location': lnglat
                    }, function(results, status) {
                        if (status === 'OK') {
                            if (results[1]) {
                                callback(results[1].formatted_address);
                            } else {
                                window.alert('No results found');
                            }
                        } else {
                            window.alert('Geocoder failed due to: ' + status);
                        }
                    });
                    break;
                case "amap":
                    //lnglat: [lng, lat]
                    if (!myMap.Ageocoder) {
                        myMap.Ageocoder = new AMap.Geocoder({
                            radius: 1000,
                            extensions: "all"
                        });
                    }
                    myMap.Ageocoder.getAddress(lnglat, function(status, result) {
                        if (status === 'complete' && result.info === 'OK') {
                            callback(result.regeocode.formattedAddress);
                        } else {
                            //获取地址失败
                            window.alert('No results found');
                        }
                    });
                    break;
                case "BMap":
                    //百度latlng 统一转化成json格式
                    var myGeo = new BMap.Geocoder();
                    // 根据坐标得到地址描述    
                    myGeo.getLocation(new BMap.Point(lnglat.lng, lnglat.lat), function(result) {
                        if (result) {
                            callback(result.address);
                        }
                    });
                    break;
            }
        },
        // 二押点
        showHideRiskPoint: function(checkbox) {
            //创建地图
            var that = this;
            var bound = that.map.getBounds();
            var placeSearch;
            if (!placeSearch) {
                placeSearch = new AMap.PlaceSearch({ //构造地点查询类
                });
            }
            var bounds = new AMap.Bounds(bound.southwest, bound.northeast);
            placeSearch.searchInBounds('二手车|抵押公司|担保公司|车辆仓库|拆机点', bounds, function(status, result) {
                var data = result.poiList.pois;
                $(data).each(function(i, obj) {
                    var content = '<div><div class="vtcontent"><dl><dt>名称：</dt><dd>' + obj.name + '</dd></dl><dl><dt>范围：</dt><dd>50米</dd></dl><dl><dt>类型：</dt><dd>' + obj.type + '</dd></dl><dl><dt>地址：</dt><dd>' + obj.address + '</dd></dl></div></div>';
                    if (obj.type.indexOf("金融保险服务")) {
                        icon = "/static/index/images/financial/location_mortgage.png";
                    } else if (obj.type.indexOf("汽车服务")) {
                        icon = "/static/index/images/financial/location_market.png";
                    } else if (obj.type.indexOf("公司企业")) {
                        icon = "/static/index/images/financial/location_bonding.png";
                    }
                    var info = that.markerInfo(content, {
                        map: that.map,
                        position: [obj.location.lng, obj.location.lat],
                        icon: icon
                    });
                    riskJson.push(info);
                    info.infoWindow.close();
                })

            });
        },
        clearMap: function() {
            this.map.clearMap(); //清空覆盖物
        },

        mouseTool: function(tool) {
            var mouseTool = new AMap.MouseTool(this.map); //在地图中添加MouseTool插件
            switch (tool) {
                case 'rectangle':
                    mouseTool.rectangle(); //绘制矩形
                    break;
                case 'circle':
                    mouseTool.circle(); //绘制圆形
                    break;
                case 'polygon':
                    mouseTool.polygon(); //绘制多边形
                    break;
            }
            return mouseTool;
        },
        reloadMap: function(data, content) {
            var pointId = data.sn;
            content = content ? content : '<div attr-sn="' + data.sn + '" id="infoWindowObj" class="p_a_a_content" style="background-color:white;"><div id="listMore" style="position:absolute;top:280px;left:322px;display: none;"> <ul class="menu_more" > <li><a href="javascript:;" onclick="imMonitor(\'isCall\', 1)"  title="点名">点名</a></li> <li><a href="javascript:;" onclick="gps_edit(\'限速\', \'/index/position/limitSpeed?id=' + data.id + '\', 400, 200)" title="限速">限速</a></li> <li><a href="javascript:;" onclick="window.location.href=\'/index/history\'" title="轨迹">轨迹</a></li> <li><a href="javascript:;" onclick="gps_edit(\'限速\', \'/index/position/limitSpeed?id=' + data.id + '\', 400, 200)" title="重置里程">重置里程</a></li> <li id="monitorkey"><a href="javascript:;" onclick="imMonitor(\'isImportant\', 1)" title="重点监控">重点监控</a></li> <li id="monitorcancel"><a href="javascript:;" onclick="imMonitor(\'isImportant\', 0)" title="取消重点监控">取消重点监控</a></li> <li><a href="javascript:;" onclick="gps_comfirm(\'设备信息\', \'/index/position/deviceMsg?sn=' + data.sn + '\', 700, 400)" title="设备信息">设备信息</a></li> <li id="moveToGroup"><a href="javascript:;" onclick="gps_check(\'分组管理\',\'/index/customer/treeGroup?url=/api/customer/deviceGroup\',386,307,transferFn)" title="移至分组">移至分组</a></li> <li id="Fortification"><a href="javascript:;" onclick="gps_edit(\'限速\', \'/index/position/fenceRange?id=' + data.id + '\', 400, 200)" title="设防">设防</a></li> <li id="more"><a href="javascript:;" onclick="gps_edit(\'设置指令\',\'/index/position/directive.html\',800,540)" title="设置指令">设置指令 &gt;&gt;</a></li> </ul> <ul id="moveGroupList" class="menu_more menu_more_two" style="display: none;"></ul> </div><div class="title">' + data.sn + '<img class="DeviceInfoTable close" onclick="myMap.infoWindow.closeInfoWindow()" border="0" src="/static/index/images/closethick.png"></div><div class="content"><dl><dt>设备号：</dt><dd class="f_l" style="width:114px;">' + data.sn + '</dd><dt>电量：</dt><dd>' + data['deviceStatus'].battery + '%</dd></dl><dl><dt>定位方式：</dt><dd class="f_l">' + data['deviceStatus'].pointType + '</dd><dt>定位模式：</dt><dd>' + data['deviceStatus'].pointMode + '</dd></dl><dl><dt>上传频率：</dt><dd class="f_l">' + data['deviceStatus'].frequency + '天</dd><dt>定时间点：</dt><dd>00:00</dd></dl><dl><dt>使用条数：</dt><dd class="f_l">' + data['deviceStatus'].useBar + '</dd><dt>额定条数：</dt><dd>1500</dd></dl><dl><dt>定位时间：</dt><dd>' + data.point_time + '</dd></dl><dl><dt>报警：</dt><dd>无</dd></dl><dl><dt>ICCID号：</dt><dd>' + "" + '</dd></dl><dl><dt>软件版本信息：</dt><dd>A2.006T6004002</dd></dl><dl><span><div style="position:relative;" attr-id="' + data.sn + '" class="showMore-wrap"><div style="float:left;margin-right:10px;"><img style="vertical-align: top;" src="/static/index/images/monitoring.png" alt=""><a href="/index/position/monitor?sn=' + data.sn + '" target="_blank" >监控</a>&nbsp;</div><div style="float:left;margin-right:10px;"><img style="vertical-align: top;" src="/static/index/images/track.png" alt=""><a target="_blank" href="/index/history/index?sn=' + data.sn + '">轨迹</a>&nbsp;</div><div style="float:left;margin-right:10px;"><img style="vertical-align: top;" src="/static/index/images/streetscape.png" alt=""><a target="_blank" href="/index/position/street?sn=' + data.sn + '">街景</a>&nbsp;</div><a onClick="showMore()" style="margin-left: 10px;" href="javascript:;">更多▼</a></div><div id="listMore" style="position:absolute;top:60px;left:300px;display: none;"> <ul class="menu_more"> <li><a href="javascript:;" onclick="imMonitor(\'isCall\', 1)"  title="点名">点名</a></li> <li><a href="javascript:;" onclick="gps_edit(\'限速\', \'/index/position/limitSpeed?id=' + data.id + '\', 400, 200)" title="限速">限速</a></li> <li><a href="javascript:;" onclick="window.indexpage.openHistory(window.listSelectedDevice)" title="轨迹">轨迹</a></li> <li><a href="javascript:;" onclick="gps_edit(\'重置里程\', \'/index/position/limitSpeed?id=' + data.id + '\', 400, 200)" title="重置里程">重置里程</a></li> <li id="monitorkey"><a href="javascript:;" onclick="imMonitor(\'isImportant\', 1)" title="重点监控">重点监控</a></li> <li id="monitorcancel"><a href="javascript:;" onclick="imMonitor(\'isImportant\', 0)" title="取消重点监控">取消重点监控</a></li> <li><a href="javascript:;" onclick="gps_comfirm(\'设备信息\', \'/index/position/deviceMsg?id=' + data.device_id + '\', 700, 400)" title="设备信息">设备信息</a></li> <li id="moveToGroup"><a href="javascript:;" onclick="gps_check(\'分组管理\',\'/index/customer/treeGroup?url=/api/customer/deviceGroup\',386,307,transferFn)" title="移至分组">移至分组</a></li> <li id="Fortification"><a href="javascript:;" onclick="gps_edit(\'限速\', \'/index/position/fenceRange?id=' + data.id + '\', 400, 200)" title="设防">设防</a></li> <li id="more"><a href="javascript:;" onclick="indexpage.openControlPanel(0)" title="设置指令">设置指令 &gt;&gt;</a></li> </ul> <ul id="moveGroupList" class="menu_more menu_more_two" style="display: none;"></ul> </div></span></dl></div></div>';
            latlng = format(data['lat'], data['lon']);
            if (dataJson[pointId]) {
                if (MAP_TYPE == "amap") {
                    // 已存在
                    var infoWindowObj = dataJson[pointId]['info']['infoWindow'];
                    infoWindowObj.open(myMap.map, latlng); //重新打开信息窗体
                }

            } else {
                dataJson[pointId] = {};
                icon = iconShow(data.deviceconfig['gpsicon'], data['status']);
                markerParams = {
                    map: myMap.map,
                    position: latlng,
                    icon: icon
                };
                info = myMap.markerInfo(content, markerParams); //窗体信息

                dataJson[pointId]['info'] = info;

            }
            // 设置中心点
            switch (MAP_TYPE) {
                case "google":
                    myMap.map.setCenter(latlng);
                    break;
                case "amap":
                    var center = new AMap.LngLat(data['lon'], data['lat']);
                    myMap.map.panTo(center);
                    myMap.map.setZoom(18);
                    break;
                case "BMap":
                    myMap.map.setCenter(new BMap.Point(latlng.lng, latlng.lat));
                    break;
            }
            //获取位置信息
            displayList(data);

        },
        initTrack: function(res) {

            this.clearMap();
            // getDevicePoint();
            var lineArr = new Array();
            var data = new Array();
            for (var i = 0; i < res.length; i++) {
                var d = res[i];
                if (d.lon!=null && d.lat!=null) {
                    data.push(d);
                }
            }
            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                var pt = new AMap.LngLat(d.lon, d.lat);
                lineArr.push(pt);
            }
            if (!lineArr.length) return;
            this.route = myMap.markerInfo('', {
                map: this.map,
                position: lineArr[0],
                icon: "http://webapi.amap.com/images/car.png",
                offset: new AMap.Pixel(-26, -13),
                autoRotation: true
            })

            // // 起点图标
            // myMap.markerInfo('', {
            //     map: this.map,
            //     position: lineArr[0],
            //     content: '<div class="marker-route marker-marker-bus-from1"></div>'
            // })
            // // 终点图标
            // myMap.markerInfo('', {
            //     map: this.map,
            //     position: lineArr[lineArr.length - 1],
            //     content: '<div class="marker-route marker-marker-bus-from2"></div>'
            // })
            // 绘制轨迹
            var polyline = new AMap.Polyline({
                map: myMap.map,
                path: lineArr,
                showDir:true,
                strokeColor: "#28F",  //线颜色
                // strokeOpacity: 1,     //线透明度
                strokeWeight: 6,      //线宽
                // strokeStyle: "solid"  //线样式
            });
            var passedPolyline = new AMap.Polyline({
                map: myMap.map,
                // path: lineArr,
                strokeColor: "#AF5",  //线颜色
                // strokeOpacity: 1,     //线透明度
                strokeWeight: 6,      //线宽
                // strokeStyle: "solid"  //线样式
            });
            console.log(passedPolyline);
            movingControl = new Tracker(myMap.map, this.route, passedPolyline, data);
            movingControl._path = lineArr;
        
            movingControl.restart();
            return movingControl;
        },
        addRisk: function() {
            var This = this;
            if (!this.riskMarker) {
                var risk = myMap.markerInfo('', {
                    map: this.map,
                    position: this.map.getCenter(),
                    icon: "/static/index/images/risk/mark.png",
                    offset: new AMap.Pixel(-26, -13),
                    draggable: true,
                    cursor: 'move'
                });
                this.riskMarker = risk['marker'];
                this.riskMarker.on('dragend', function() {
                    var lnglat = [this.getPosition().lng, this.getPosition().lat];
                    This.geocoder(lnglat, risk_CallBack);
                })
            }
            this.riskMarker.setPosition(this.map.getCenter());
            return this.riskMarker;
        }
    };
    window.myMap = myMap;
    return myMap;
})
