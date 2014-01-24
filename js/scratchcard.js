/* Scratchcard - A scratch card library based on canvas
 * @author kikoshoung (kikoshoung@gmail.com)
 */
(function(){
	var isPC = ('ontouchstart' in window) ? false : true,
		isIE = (window.navigator.userAgent.indexOf('MSIE'));

	// Constructor of scratch card
	function ScratchCard(options){
		this.options = options;
		this.scratchActivated = false;
		this.extendOptions();
		this.initialize();
	}

	// Clone an object deeply
	function clone(obj){
		// If obj is not an Object instance, return it. Except null and DOM object.
		if(typeof obj != 'object' || obj == null || obj.nodeType) return obj;

		var clonedObj = obj.constructor === Array ? [] : {};

		for(var prop in obj){
			clonedObj[prop] = arguments.callee(obj[prop]);
		}

		return clonedObj;
	}

	// Extend origin object with default options object 
	function extend(origin, options){
		var extendedOpt = clone(options);
			origin = origin || {};
			options = options || {};

		for(var prop in origin){
			if(origin[prop] instanceof Object && !origin[prop].nodeType){
				if(origin[prop] instanceof Array || origin[prop] instanceof Function){
					extendedOpt[prop] = clone(origin[prop]);
				} else {
					extendedOpt[prop] = arguments.callee(origin[prop], extendedOpt[prop]);
				}
			} else {
				extendedOpt[prop] = origin[prop];
			}
		}

		return extendedOpt;
	}

	function getOffset(elem){
		var offset = [elem.offsetLeft, elem.offsetTop],
			parent = elem.offsetParent;

		while(parent){
			offset[0] += parent.offsetLeft;
			offset[1] += parent.offsetTop;
			parent = parent.offsetParent;
		}

		return offset;
	}

	function addEvent(elem, eventName, callback){
		if(document.addEventListener){
			elem.addEventListener(eventName, callback, false);
		} else if(document.attachEvent){
			elem.attachEvent('on' + eventName, callback);
		} else {
			elem['on' + eventName] = callback; 
		}
	}

	function removeEvent(elem, eventName, callback){
		if(document.removeEventListener){
			elem.removeEventListener(eventName, callback, false);
		} else if(document.detachEvent){
			elem.detachEvent('on' + eventName, callback);
		} else {
			elem['on' + eventName] = null; 
		}
	}

	function bind(fnuc, context){
		return function(){
			fnuc.apply(context, arguments);
		}
	}

	// Prototype of constructor ScratchCard
	ScratchCard.prototype = {

		defaults: {
			// A wrapper element for scratch card, must be an original dom object
            container: null,

            // Image src for win or not
            imgSrc: '',

		    // Card size, [{width}, {height}]
		    size: [240, 180],

		    // Valid scratch area, [{left}, {top}, {width}, {hight}]
		    // Defaults to [0, 0, {cardWidth}, {cardHeight}]
		    // validArea: [0, 0, {cardWidth}, {cardWidth}],

		    // Percentage of valid scratched pixels, based on valid area
		    percentage: 0.6,

		    // Scratch layer's property
		    scratchLayer: {
		        background: '#E0E0E0',
		        text: '刮开此涂层',
		        color: '#888',
		        font: '30px Verdana',

		        // Scratch width
		        lineWidth: 30
		    },

		    // Text to show when users' browser does not support canvas
		    notSupportText: 'Sorry, [Canvas] is not supported.',

		    // A callback function, invoked after a scratch action
            onScratch: null,

            // A callback function, invoked when scratch completed
            onComplete: null
		},

		events: {
			mousedown: isPC ? 'mousedown' : 'touchstart',
			mousemove: isPC ? 'mousemove' : 'touchmove',
			mouseup: isPC ? 'mouseup' : 'touchend'
		},

		extendOptions: function(){
			this.options = extend(this.options, this.defaults);
		},

		initialize: function(){
			var options = this.options,
				self = this;

			if(this.isOptionsAvailable(options)){
				this.setImage(options, function(){
					self.setContainer(options);
					self.setCanvas(options);
					self.initCanvas();
					self.bindEvents();
				});
			};
		},

		// Check options, ensure it is available
		isOptionsAvailable: function(options){
			var container = options.container,
				img = options.imgSrc,
				size = options.size,
				validArea = options.validArea,
				percentage = options.percentage;

			if(!(container && container.nodeType && container.nodeType == 1)){
				throw new Error('Param [container] must be given and must be a original dom element.');
				return false;
			}

			if(!(img && typeof img == 'string')){
				throw new Error('Param [imgSrc] must be given and must be a string.');
				return false;
			}

			if(size && !(size instanceof Array)){
				throw new Error('Param [size] must be an array like [{width}, {height}].');
				return false;
			}

			if(validArea && !(validArea instanceof Array)){
				throw new Error('Param [validArea] must be an array like [{left}, {top}, {width}, {height}].');
				return false;
			}

			if(percentage && typeof percentage != 'number' && typeof percentage != 'string'){
				throw new Error('Param [percentage] must be a number or string like 0.8 or "0.8".');
				return false;
			}

			return true;
		},

		// Set container
		setContainer: function(options){
			var container = options.container,
				curSize = this.curSize,
				cssText = 'display: inline-block; position: relative; background: transparent;';

			container.innerHTML = '';
			container.style.cssText = cssText;
			container.style.width = this.curSize[0] +'px';
			container.style.height = this.curSize[1] +'px';

			this.container = container;
		},

		// Set image to the container
		setImage: function(options, callback){
			var img = new Image(),
				self = this,
				cssText = 'position: relative; z-index: 1; vertical-align: middle;';

			img.onload = function(){
				var curSize = self.getCurSize(options);

				self.origSize = [img.width, img.height];
				self.curSize = curSize;
				img.width = curSize[0];
				img.height = curSize[1];

				callback && callback();

				img.style.cssText = cssText;
				options.container.appendChild(img);
			}

			img.src = options.imgSrc;

			this.img = img;
		},

		// Set canvas to the container
		setCanvas: function(options){
			var container = options.container,
				canvas = document.createElement('canvas'),
				cssText = 'position: absolute; z-index: 2; top: 0; left: 0;'

			canvas.innerHTML = options.notSupportText;
			canvas.style.cssText = cssText;
			canvas.width = canvas.style.width = this.curSize[0];
			canvas.height = canvas.style.height = this.curSize[1];
			container.appendChild(canvas);

			this.canvas = canvas;
		},

		setCanvasToErrorMode: function(){
			// HTML5 tag shim, use this hack to set canvas's style
			// in browsers which do not support Canvas.
			// document.createElement('canvas');
			var scratchLayer = this.defaults.scratchLayer;

			this.canvas.style.background = scratchLayer.background;
			this.canvas.style.color = scratchLayer.color;
		},

		// Get the dom(container, image, canvas) size[{width}, {height}]
		// we choosed finally
		getCurSize: function(options){
			var size = options.size,
				origSize = options.origSize;

			return (size || origSize).slice();
		},

		getScratchedPercentage: function(){
			var ctx = this.ctx,
				canvas = this.canvas,
				options = this.options,
				validArea = options.validArea || [0, 0, canvas.width, canvas.height],
				imageData = ctx.getImageData.apply(ctx, validArea).data,
				validScratchedPx = 0;

			for(var i = 0, len = imageData.length; i < len; i += 4){
				if(imageData[i + 3] == 0) validScratchedPx++;
			}

			return validScratchedPx / (len / 4);
		},

		getCoordinate: function(event){
			var pageX, pageY;

			if(event.targetTouches) event = event.targetTouches[0];
			pageX = event.pageX;
			pageY = event.pageY;

			// For IE
			if(isIE){
				pageX = event.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft);
				pageY = event.clientY + (document.body.scrollTop || document.documentElement.scrollTop);
			}

			return [pageX, pageY];
		},

		initCanvas: function(){
			var canvas = this.canvas,
				options = this.options,
				scratchLayer = options.scratchLayer,
				ctx;

			try{
				ctx = this.ctx = canvas.getContext('2d');
			} catch(err) {
				this.setCanvasToErrorMode();
				throw new Error(options.notSupportText);
			}

			// this.canvasOffset = getOffset(canvas);

			ctx.globalCompositeOperation = "source-over";

			// Paint canvas to gray 
			ctx.fillStyle = scratchLayer.background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);

			// Paint extra text on canvas
			ctx.font = scratchLayer.font;
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			ctx.fillStyle = scratchLayer.color;
			ctx.fillText(scratchLayer.text, canvas.width / 2, canvas.height / 2);

			// Set stroke style
			ctx.strokeStyle = 'rgba(255, 255, 255, 1)';
			ctx.lineJoin = 'round';
			ctx.lineCap = 'round';
			ctx.lineWidth = scratchLayer.lineWidth; 
		},

		bindEvents: function(){
			var canvas = this.canvas,
				container = this.container,
				events = this.events,
				self = this;

			var md = this.onmousedown = bind(this.mousedownHandler, this);
			var mm = this.onmousemove = bind(this.mousemoveHandler, this);
			var mu = this.onmouseup = bind(this.mouseupHandler, this);
			var mo = this.onmouseout = bind(this.mouseoutHandler, this);
			var mmContainer = this.onmousemoveContainer = bind(this.mousemoveContainerHandler, this);

			addEvent(canvas, events['mousedown'], md);
			addEvent(canvas, events['mousemove'], mm);
			addEvent(canvas, events['mouseup'], mu);
			addEvent(canvas, 'mouseout', mo);
			addEvent(container, events['mousemove'], mmContainer);
		},

		mousedownHandler: function(e){
			var ctx = this.ctx,
				canvas = this.canvas,
				// In case canvas' position changed
				canvasOffset = this.canvasOffset || (this.canvasOffset = getOffset(canvas)),
				pageCoordinate = this.getCoordinate(e);

			this.scratchActivated = true;
			ctx.beginPath();
			ctx.moveTo(pageCoordinate[0] - canvasOffset[0], pageCoordinate[1] - canvasOffset[1]);
		},

		mousemoveHandler: function(e){
			if(!this.scratchActivated) return;

			var ctx = this.ctx,
				canvas = this.canvas,
				canvasOffset = this.canvasOffset,
				pageCoordinate = this.getCoordinate(e);

			ctx.lineTo(pageCoordinate[0] - canvasOffset[0], pageCoordinate[1] - canvasOffset[1]);
			ctx.globalCompositeOperation = "destination-out";
			ctx.stroke();

			if(canvas.style.opacity){
				canvas.style.opacity = '';
			} else {
				canvas.style.opacity = '0.999';
			}
		},

		mouseupHandler: function(e){
			var ctx = this.ctx,
				onScratch = this.options.onScratch;

			this.scratchActivated = false;
			ctx.closePath();
			onScratch && onScratch(this.getScratchedPercentage());		
			this.isOktoShowAll(this.getScratchedPercentage());
		},

		mouseoutHandler: function(e){
			this.scratchActivated = false;
		},

		mousemoveContainerHandler: function(e){
			e.preventDefault();
		},

		isOktoShowAll: function(curPercentage){
			var options = this.options,
				onComplete = options.onComplete;

			if(curPercentage >= options.percentage){
				this.showAll();
				onComplete && onComplete();
			}
		},

		showAll: function(){
			this.canvas.style.display = 'none';
		},

		destroy: function(){
			var container = this.container,
				canvas = this.canvas,
				img = this.img;

			removeEvent(canvas, events['mousedown'], this.onmousedown);
			removeEvent(canvas, events['mousemove'], this.onmousemove);
			removeEvent(canvas, events['mouseup'], this.onmouseup);
			removeEvent(canvas, 'mouseout', this.onmouseout);
			removeEvent(container, events['mousemove'], this.onmousemoveContainer);
			img.onload = null;

			container.removeChild(canvas);
			container.removeChild(img);
		}
	};

	// Export ScratchCard to window object
	window.ScratchCard = ScratchCard;

	// Export to $.fn for jQuery coding style
	if(window.jQuery){
		$.fn.ScratchCard = function(options){
			options.container = $(this)[0];
			return new ScratchCard(options);
		}
	}
})();