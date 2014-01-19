/* Scratchcard - A scratch card library based on canvas
 * @author kikoshoung (kikoshoung@gmail.com)
 */
(function(){
	var isPC = ('ontouchstart' in window) ? false : true;

	// Constructor of scratch card
	function ScratchCard(options){
		this.options = options;
		this.scratchActivated = false;
		this.extendOptions();
		this.initialize();
	};

	function clone(original){
        if(typeof original != 'object' || !original || original.nodeType) return original;

        var clonedObject = original.constructor === Array ? [] : {};

        for(var i in original){
        	clonedObject[i] = arguments.callee(original[i])
        }

        return clonedObject;
	}

	function extend(target, defaults){
        var extended = clone(defaults);

        for(var j in target){
            if(extended[j] instanceof Object && target[j]){
                if(extended[j] instanceof Array){
                        extended[j] = clone(target[j]);
                } else {
                        extended[j] = arguments.callee(target[j], extended[j]);
                }
            } else {
                extended[j] = target[j];
            }
        }
        return extended;
	};

	function getOffset(elem){
		var offset = [elem.offsetLeft, elem.offsetTop],
			parent = elem.offsetParent;

		while(parent){
			offset[0] += parent.offsetLeft;
			offset[1] += parent.offsetTop;
			parent = parent.offsetParent;
		}

		return offset;
	};

	// prototype of constructor ScratchCard
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
		        lineWidth: 30,
		    },

		    // Text to show when users' browser does not support canvas
		    notSupportText: 'Sorry, your browser dose not support [Canvas], please use a higher version browser and try again.',

		    // A callback function, invoked after a scratch action
            onScratch: null,

            // A callback function, invoked when scratch completed
            onComplete: null,
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
				throw new Error('Param [container] must be given and must be a dom element.');
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
				cssText = 'display: inline-block; position: relative;';

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

		// get the dom(container, image, canvas) size[{width}, {height}]
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
			if(event.targetTouches) event = event.targetTouches[0];
			return [event.pageX, event.pageY];
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

			this.canvasOffset = getOffset(canvas);

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

			canvas.addEventListener(events['mousedown'], function(e){
				self.mousedownHandler(e);
			});

			canvas.addEventListener(events['mousemove'], function(e){
				self.mousemoveHandler(e);
			});

			canvas.addEventListener(events['mouseup'], function(e){
				self.mouseupHandler(e);
				self.isOktoShowAll(self.getScratchedPercentage());
			});

			canvas.addEventListener('mouseout', function(e){
				// self.mouseupHandler(e);
				self.mouseoutHandler(e);
			});

			container.addEventListener(events['mousemove'], function(e){
				e.preventDefault();
			});
		},

		mousedownHandler: function(e){
			var ctx = this.ctx,
				canvasOffset = this.canvasOffset,
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
		},

		mouseoutHandler: function(e){
			this.scratchActivated = false;
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

			container.removeChild(canvas);
			container.removeChild(img);

			canvas.removeEventListener(events['mousedown']);
			canvas.removeEventListener(events['mousemove']);
			canvas.removeEventListener(events['mouseup']);
			canvas.removeEventListener('mouseout');
			container.removeEventListener(events['mousemove']);
		}
	};

	window.ScratchCard = ScratchCard;
})();