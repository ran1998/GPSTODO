define(['jquery'], function ($) {
    //
        /**     第一部分，动画暂停、继续的实现     */
        /**
         * @param {Map} map    地图对象
         * @param {Marker} marker Marker对象
         * @param {Array} path   移动的路径，以坐标数组表示
         */
        var MarkerMovingControl = function (map, route, polyline, data, path) {
            this._map = map;
            this._marker = route['marker'];
            this._infoWindow = route['infoWindow'];
            this._path = path || [];
            this._data = data;
            this._polyline = polyline;
            this._currentIndex = 0;
            this._timerInterval = 1000;
            this._status = 'run';
            // marker.setMap(map);
            // marker.setPosition(path[0]);
        }
        /**
         * 移动marker，会从当前位置开始向前移动
         */
        MarkerMovingControl.prototype.move = function () {
            if (!this._listenToStepend) {
                // 自定义事件stepend
                this._listenToStepend = AMap.event.addListener(this, 'stepend', function () {
                    this.step();
                }, this);
            }
            this.step();
        };

        /**
         * 停止移动marker，由于控件会记录当前位置，所以相当于暂停
         */
        MarkerMovingControl.prototype.stop = function () {
            this._marker.stopMove();
        };

        /**
         * 重新开始，会把marker移动到路径的起点然后开始移动
         */
        MarkerMovingControl.prototype.restart = function () {
            this.stop();
            this._marker.setPosition(this._path[0]);
            this._currentIndex = 0;
            this.move();
        };

        /**
         * 向前移动一步
         */
        MarkerMovingControl.prototype.step = function () {
            var This = this;
           
            if (this._currentIndex != 0 && this._currentIndex < this._path.length-1) {
              while (this._path[this._currentIndex+1].toString() == this._path[this._currentIndex].toString()) {
                this._currentIndex++;
              } 
            }
            var nextIndex = this._currentIndex + 1;

            if (nextIndex == this._path.length) {
                // 移动完成后 
                this.complete();
                // this.removePath();
            }
            if (nextIndex < this._path.length) {
                if (!this._listenToMoveend) {
                    this._listenToMoveend = AMap.event.addListener(this._marker, 'moveend', function () {
                        this._currentIndex++;
                        AMap.event.trigger(this, 'stepend');
                    }, this);
                }
                console.log(this._data[nextIndex]);
                this._infoWindow.setContent(this.buildContent(this._data[nextIndex]));
                this._infoWindow.setPosition(this._path[nextIndex]);
                this._marker.moveTo(this._path[nextIndex], this._timerInterval);
                this._marker.on('moving', function (e) {
                    This._polyline.setPath(This._path.slice(0, nextIndex));
                });
                this.moving();
                // myMap.geocoder(this._path[nextIndex], addtrackMsg);
            }
            else {
                this._currentIndex = 0;
                this.stop();
                // this.removePath();
            }
        };

        //后退一步
        MarkerMovingControl.prototype.back = function () {
            var beforeIndex = this._currentIndex - 1;
            if (!this._listenToMoveend) {
                this._listenToMoveend = AMap.event.addListener(this._marker, 'moveend', function () {
                    this._currentIndex++;
                    AMap.event.trigger(this, 'stepend');
                }, this);
            }
            this._currentIndex--;
            //this._map.setCenter(this._path[beforeIndex]);
            this._marker.setPosition(this._path[beforeIndex]);
            this._marker.moveTo(this._path[beforeIndex + 1], this._timerInterval);
        };

        //快进一步
        MarkerMovingControl.prototype.fast = function () {
            var nextIndex = this._currentIndex + 1;
            if (nextIndex < this._path.length) {
                if (!this._listenToMoveend) {
                    this._listenToMoveend = AMap.event.addListener(this._marker, 'moveend', function () {
                        this._currentIndex++;
                        AMap.event.trigger(this, 'stepend');
                    }, this);
                }
                this._currentIndex++;
                //this._map.setCenter(this._path[nextIndex]);
                this._marker.setPosition(this._path[nextIndex]);
                this._marker.moveTo(this._path[nextIndex + 1], this._timerInterval);

            }
        };

        MarkerMovingControl.prototype.addPath = function (data) {
            for (var i = 0; i < data.length; i++) {
                var d = data[i];
                var pt = new AMap.LngLat(d.lon, d.lat);
                this._data.push(data[i]);
                this._path.push(pt);
            }
        };

        MarkerMovingControl.prototype.removePath = function () {
            this._path = [];
        };

        MarkerMovingControl.prototype.speed = function(speed) {
            this._timerInterval = speed;
        };

        MarkerMovingControl.prototype.buildContent = function (data) {
            return '<table><tbody><tr><td style="text-align:right;">时间：</td><td>'+ data.time +'</td></tr><tr><td style="text-align:right;">经度：</td><td>'+ data.lat +'</td></tr><tr><td style="text-align:right;">纬度：</td><td>'+ data.lon +'</td></tr><tr><td style="text-align:right;">定位：</td><td>北斗</td></tr><tr><td style="text-align:right;">速度：</td><td>'+ data.speed +'</td></tr></tbody></table>';
        }

        MarkerMovingControl.prototype.complete = function () {
            this.stop();
            layer.msg('播放完毕');
            this._status = 'complete';
            // this._marker.setPosition(this._path[0]);
            // this._infoWindow.setPosition(this._path[0]);
        }

        MarkerMovingControl.prototype.moving = function () {
            
        }

        /**     第二部分，应用示例     */

        // 创建地图、marker、路径和线
        // 创建移动控件
        var movingControl = null;

    
    window.MarkerMovingControl = MarkerMovingControl;
    return MarkerMovingControl;
})
