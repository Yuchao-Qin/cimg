var CI = function(){

	var imgFile;
	var cSize;
	var fileName;
	var readStart;
	var readEnd;
	var readError;
	var mc;
	var oSize;
	var c = getCanvas();
	c.canvas.className = "ci_canvas";
	var imgbox = $('<div class="ci-imgbox" style="line-height:0">');
	var clip = $('<div class="ci-clipbox">');
	var pan = new Hammer.Pan({threshold: 0, pointers: 0});
	var rotate = new Hammer.Rotate({threshold: 0});
	var pinch = new Hammer.Pinch({threshold: 0});
	var transform = {
			translate: { x: 0, y: 0 },
			scale: 1,
			angle: 0,
			rx: 0,
			ry: 0,
			rz: 1
		};

	function init(obj){
		if(!obj.fileInput){
			console.error("没有提供文件选择框选择器！");
			return;
		}
		if(!obj.imgBox){
			console.error("没有提供图片预览容器选择器！");
			return;
		}
		if(!obj.touchCtrl){
			console.error("没有提供触控DOM选择器！");
			return;
		}

		var s1 = obj.fileInput;
		var s2 = obj.imgBox;
		var clipStyle;
		touchHandle(obj.touchCtrl);
		readStart = obj.readStart || null;
		readEnd = obj.readEnd || null;
		readError = obj.readError || null;
		cSize = obj.size || {w:100, h:100};
		
		clipStyle = {
			"width": cSize.w * 2,
			"height": cSize.h * 2
		};
		clip.css(clipStyle);
		imgbox.append(c.canvas);
		$(s2).append(imgbox);
		$(s1).on("change", function(e){
			imgFile = this.files[0];
			fileName = imgFile.name;
			if(!/^image\//.test(imgFile.type)){
				console.warn("文件不是图片！！！");
				return;
			}
			if(readEnd){
				readFile(readEnd);
			}
		});
	}

	function touchHandle(selector){

		mc = new Hammer.Manager($(selector)[0]);

		mc.add(pan);
		mc.add(rotate).recognizeWith(mc.get("pan"));
		mc.add(pinch).recognizeWith(mc.get("rotate"));
		
		mc.on("rotatestart rotatemove rotateend", onRotate);
		mc.on("pinchstart pinchmove pinchend", onPinch);
		mc.on("panstart panmove", onPan);
	}

	function readFile(readEnd){

		var fileReader = new FileReader();
		if(readStart){
			fileReader.onloadstart = setTimeout(function(ev){
				readStart(ev);
			});
		}
		if(readError){
			fileReader.onerror = function(ev){
				readError(ev);
			}
		}
		fileReader.readAsDataURL(imgFile);
		fileReader.onload = function(ev){
			var temp = new Image();
			temp.src = ev.target.result;
			temp.onload = function(){
				c.canvas.width = temp.width;
				c.canvas.height = temp.height;
				c.ctx.drawImage(temp,0,0,c.canvas.width,c.canvas.height);
				oSize = {w:imgbox.width(), h:imgbox.height()};
				imgbox.append(clip);
				if(readEnd) readEnd();
			};
		};
	}

	function getImage(){

		return image;
	}

	var initAngle = 0;
	var rStartAngle = 0;
	function onRotate(ev){

		if(ev.type == "rotatestart"){
			initAngle = transform.angle || 0;
			rStartAngle = ev.rotation;
			mc.remove(pan);
		}
		if(ev.type == "rotateend"){
			setTimeout(function(){
				mc.add(pan);
			},300)
		}
		transform.angle = Math.round(ev.rotation - rStartAngle + initAngle) % 360;
		updateElementTransform();
	}

	var initAngle = 0;
	var rStartAngle = 0;
	function onRotate(ev){

		if(ev.type == "rotatestart"){
			initAngle = transform.angle || 0;
			rStartAngle = ev.rotation;
			mc.remove(pan);
		}
		if(ev.type == "rotateend"){
			setTimeout(function(){
				mc.add(pan);
			},300)
		}
		transform.angle = Math.round(ev.rotation - rStartAngle + initAngle) % 360;
		updateElementTransform();
	}

	var initScale = 1;
	function onPinch(ev){

		if(ev.type == "pinchstart"){
			initScale = transform.scale || 1;
			mc.remove(pan);
		}
		if(ev.type == "pinchend"){
			setTimeout(function(){
				mc.add(pan);
			},300);
		}
		transform.scale = initScale * ev.scale;
		updateElementTransform();
	}

	var initSite = {x: 0, y: 0};
	function onPan(ev){

		if(ev.type == "panstart"){
			initSite.x = transform.translate.x;
			initSite.y = transform.translate.y;
		}
		transform.translate.x = Math.round(initSite.x + ev.deltaX);
		transform.translate.y = Math.round(initSite.y + ev.deltaY);
		updateElementTransform();
	}

	function updateElementTransform(){

		var value = [
					'translate3d(' + transform.translate.x + 'px, ' + transform.translate.y + 'px, 0)',
					'scale(' + transform.scale + ', ' + transform.scale + ')',
					'rotate3d('+ transform.rx +','+ transform.ry +','+ transform.rz +','+  transform.angle + 'deg)'
		].join(" ");

		$(c.canvas).css({"-webkit-transform": value,
						     "-ms-transform": value,
								 "transform": value});
	}

	function dataURLtoBlob(dataURL) {

		var arr = dataURL.split(',');
		var mime = arr[0].match(/:(.*?);/)[1];
		var bstr = window.atob(arr[1]);
		var len = bstr.length;
		var u8arr = new Uint8Array(len);
		while(len--) {
			u8arr[len] = bstr.charCodeAt(len);
		}
		return new Blob([u8arr], {
			type: mime
		});
	}

	// 上传 base64 字节
	function upload(url, obj){
		var data = i.src.replace(/^data:.*64,/,"");
		$.ajax(
			{
				type: "POST",
				url: url,
				data: {data:data,fileName:fileName},
				beforeSend: obj.beforeSend,
				error: obj.error,
				dataFilter: obj.dataFilter,
				success: obj.success,
				complete: obj.complete
			}
		)
	}

	var i = new Image();
	function clipImage(){

		var h = oSize.h * transform.scale;
		var w = oSize.w * transform.scale;
		var clipSite = {
			x: (clip.offset().left - $(c.canvas).offset().left), 
			y: (clip.offset().top - $(c.canvas).offset().top)
		};

		var c1 = getCanvas();
		c1.canvas.height =$(c.canvas).height();
		c1.canvas.width = $(c.canvas).width();
		c1.ctx.translate(c1.canvas.width/2, c1.canvas.height/2);
		c1.ctx.rotate(transform.angle * Math.PI / 180);
		c1.ctx.drawImage(c.canvas, -w/2, -h/2, w, h);

		var c2 = getCanvas();
		c2.canvas.height = cSize.h * 2;
		c2.canvas.width = cSize.w * 2;
		c2.ctx.drawImage( c1.canvas, clipSite.x, clipSite.y, cSize.w * 2, cSize.h * 2, 0, 0, cSize.w * 2, cSize.h * 2);
		i.src = c2.canvas.toDataURL();

		i.width = cSize.w;
		i.height = cSize.h;
		i.className = "ci-img";

		c1 = c2 = null;
		return i;
	}

	function getCanvas(){
		
		var canvas = document.createElement("canvas");
		if(!canvas.getContext){
			console.warn("当前浏览器不支持canvas！！！");
			return;
		}else{
			var ctx = canvas.getContext("2d");
		}

		return {
			canvas: canvas,
			ctx: ctx
		}
	}

	return {
		init: init,
		clipImage: clipImage,
		upload: upload
	}

}();
