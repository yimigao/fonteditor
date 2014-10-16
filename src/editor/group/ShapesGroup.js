/**
 * @file ShapesGroup.js
 * @author mengke01
 * @date 
 * @description
 * 多个形状编辑组
 */


define(
    function(require) {
        var pathAdjust = require('graphics/pathAdjust');
        var lang = require('common/lang');
        var computeBoundingBox = require('graphics/computeBoundingBox');

        var moveTransform = require('./moveTransform');
        var scaleTransform = require('./scaleTransform');
        var rotateTransform = require('./rotateTransform');

        var updateControls = require('./updateControls');
        

        /**
         * 获取多个shape的边界
         */
        function getBound(shapes) {
            var points = [];
            shapes.forEach(function(shape) {
                var b = computeBoundingBox.computePath(shape.points);
                points.push(b);
                points.push({
                    x: b.x + b.width,
                    y: b.y + b.height
                });
            });
            return computeBoundingBox.computeBounding(points);
        }

        /**
         * 选择组控制器
         */
        function ShapesGroup(shapes, editor) {
            this.editor = editor;
            this.setShapes(shapes);
        }

        /**
         * 根据控制点做图形变换
         */
        ShapesGroup.prototype.beginTransform = function(point, camera) {

            this.bound = getBound(this.shapes);
            this.editor.coverLayer.addShape({
                type: 'polygon',
                dashed: true,
                id: 'bound'
            });
        };

        /**
         * 根据控制点做图形变换
         */
        ShapesGroup.prototype.transform = function(point, camera) {
            if (this.mode === 'move') {
                moveTransform.call(this, camera);
            }
            else if (this.mode === 'scale') {
                scaleTransform.call(this, point, camera);
            }
            else if (this.mode === 'rotate') {
                rotateTransform.call(this, point, camera);
            }
        };

        /**
         * 刷新Shapesgroup信息
         */
        ShapesGroup.prototype.finishTransform = function(point, camera) {

            // 保存最后一次修改
            var coverShapes = this.coverShapes;
            this.coverShapes = this.shapes;
            this.transform(point, camera);
            this.coverShapes = coverShapes;
            this.editor.fontLayer.refresh();


            this.editor.coverLayer.removeShape('bound');
            this.editor.coverLayer.removeShape('boundcenter');
            delete this.bound;

            this.refresh();
        };

        /**
         * 设置操作的shapes
         */
        ShapesGroup.prototype.setShapes = function(shapes) {

            var coverLayer = this.editor.coverLayer;

            if(this.shapes) {
                this.shapes = null;
            }
            
            if (this.coverShapes) {
                this.coverShapes.forEach(function(shape) {
                    coverLayer.removeShape(shape);
                });
                this.coverShapes = null;
            }

            this.shapes = shapes;

            this.coverShapes = lang.clone(this.shapes);
            this.coverShapes.forEach(function(shape) {
                shape.id = 'cover-' + shape.id;
                shape.selectable = false;
                shape.style = {
                    strokeColor: 'red'
                };
                coverLayer.addShape(shape);
            });
        };

        /**
         * 获取边界
         */
        ShapesGroup.prototype.getBound = function() {
            if(this.shapes.length) {
               return getBound(this.shapes);
            }
            return false;
        };

        /**
         * 设置操作的shapes
         */
        ShapesGroup.prototype.setMode = function(mode) {
            this.mode = mode; // 两种变化模式，scale和rotate
        };


        /**
         * 移动到指定位置
         */
        ShapesGroup.prototype.move = function(mx, my) {

            this.shapes.forEach(function(shape) {
                pathAdjust(shape.points, 1, 1, mx, my);
            });
            
            this.editor.fontLayer.refresh();
            this.editor.coverLayer.move(mx, my);
            this.editor.coverLayer.refresh();
        };

        /**
         * refresh
         */
        ShapesGroup.prototype.refresh = function() {
            updateControls.call(this, getBound(this.shapes));
            this.editor.coverLayer.refresh();
        };

        /**
         * 注销
         */
        ShapesGroup.prototype.dispose = function() {

            this.editor.coverLayer.clearShapes();
            this.editor.coverLayer.refresh();
            this.shapes = this.coverShapes = this.controls = this.editor = null;
        };

        return ShapesGroup;
    }
);