class Canvas
{
    constructor(canvasElement, options)
    {
        if (!canvasElement)
        {
            canvasElement = document.createElement("canvas");
        }

        if (typeof(canvasElement) === "string")
        {
            canvasElement = document.querySelector(canvasElement);
        }

        options = options || {};

        this.canvas = canvasElement;

        if (options.size)
        {
            this.resize(options.size.width || canvasElement.width, options.size.height || canvasElement.height);
        }

        this.translation = { x: 0, y: 0 };

        this.align =
        {
            horizontal: (options.align && options.align.horizontal) || false,
            vertical: (options.align && options.align.vertical) || false
        };

        if (this.align.horizontal || this.align.vertical)
        {
            this.canvas.style["transform-origin"] = "center";
        }
        else
        {
            this.canvas.style["transform-origin"] = "top left";
        }

        this.usingDeepCalc = options.deepCalc || false;
        this.useImageSmoothing = options.imageSmoothing || false;

        if (this.usingDeepCalc)
        {
            this.deepCalcPosition();
            window.addEventListener("resize", this.deepCalcPosition);
        }

        this.mouse =
        {
            isDown: false,
            lastPos: null,
            originalPos: null,
            events:
            {
                move: [],
                down: [],
                up: [],
                leave: []
            },
            addEventListener: function(eventName, fn)
            {
                this.events[eventName].push(fn);
            }
        };

        this.canvas.addEventListener("mousemove", this.mouseMove.bind(this));
        this.canvas.addEventListener("touchmove", this.mouseMove.bind(this));
        this.canvas.addEventListener("mousedown", this.mouseDown.bind(this));
        this.canvas.addEventListener("touchstart", this.mouseDown.bind(this));
        this.canvas.addEventListener("mouseup", this.mouseUp.bind(this));
        this.canvas.addEventListener("touchend", this.mouseUp.bind(this));
        this.canvas.addEventListener("mouseleave", this.mouseLeave.bind(this));
        this.canvas.addEventListener("touchcancel", this.mouseLeave.bind(this));
    }

    resize(w, h)
    {
        this.canvas.width = w;
        this.canvas.height = h;
    }

    clear()
    {
        this.context.clearRect(-this.translation.x, -this.translation.y, this.canvas.width, this.canvas.height);  
    }

    deepCalcPosition()
    {
        var z = this.canvas, x = 0, y = 0, c; 

        while(z && !isNaN(z.offsetLeft) && !isNaN(z.offsetTop)) {        
            c = isNaN(window.globalStorage) ? 0 : window.getComputedStyle(z, null); 
            x += z.offsetLeft - z.scrollLeft + (c ? parseInt(c.getPropertyValue('border-left-width') , 10) : 0);
            y += z.offsetTop - z.scrollTop + (c ? parseInt(c.getPropertyValue('border-top-width') , 10) : 0);
            z = z.offsetParent;
        }

        this.offset = { x: x, y: y };
    }

    posFromEvent(e)
    {
        let x = e.pageX;
        let y = e.pagey;

        if (e.changedTouches)
        {
            x = e.changedTouches[0].pageX;
            y = e.changedTouches[0].pagey;
        }

        if (this.usingDeepCalc)
        {
            this.deepCalcPosition();
        }

        let ox = this.usingDeepCalc ? this.offset.x : this.canvas.offsetLeft;
        let oy = this.usingDeepCalc ? this.offset.y : this.canvas.offsetTop;

        let bounds = this.canvas.getBoundingClientRect();

        if (this.align.horizontal && ox > 0)
        {
            ox = (2 * ox - bounds.width) / 2;
        }

        if (this.align.vertical && oy > 0)
        {
            oy = (2 * oy - bounds.height) / 2;
        }

        x -= ox;
        y -= oy;

        x *= this.canvas.width / bounds.width;
        y *= this.canvas.height / bounds.height;

        return { x, y };
    }

    mouseMove(e)
    {
        let pos = this.posFromEvent(e);
        if (this.mouse.lastPos === undefined) this.mouse.lastPos = pos;
        if (!this.mouse.isDown) this.originalPos = pos;

        this.mouse.events.move.forEach(fn =>
        {
            let event = fn.call(
                this,
                pos.x,
                pos.y,
                this.mouse.isDown,
                this.mouse.lastPos.x,
                this.mouse.lastPos.y,
                this.mouse.originalPos.x,
                this.mouse.originalPos.y,
                e
            );

            if (event !== false)
            {
                this.mouse.lastPos = pos;
            }
        });
    }

    mouseDown(e)
    {
        let pos = this.posFromEvent(e);
        this.mouse.isDown = true;
        this.mouse.lastPos = pos;
        this.mouse.originalPos = pos;

        this.mouse.events.down.forEach(fn =>
        {
            fn.call(this, pos.x, pos.y, e);
        });
    }

    mouseUp(e)
    {
        let pos = this.posFromEvent(e);
        this.mouse.isDown = false;

        this.mouse.events.up.forEach(fn =>
        {
            fn.call(this, pos.x, pos.y, this.mouse.originalPos.x, this.mouse.originalPos.y, e);
        });

        this.mouse.lastPos = pos;
    }

    mouseLeave(e)
    {
        let pos = this.posFromEvent(e);

        this.mouse.events.leave.forEach(fn =>
        {
            fn.call(this, pos.x, pos.y, e);
        });
    }

    get context()
    {
        return this.canvas.getContext("2d");
    }

    set useImageSmoothing(bool)
    {
        let ctx = this.context;
        ctx.mozImageSmoothingEnabled = bool;
        ctx.webkitImageSmoothingEnabled = bool;
        ctx.msImageSmoothingEnabled = bool;
        ctx.imageSmoothingEnabled = bool;
    }

    get width() { return this.canvas.width; }
    set width(w) { this.canvas.width = w; }
    get height() { return this.canvas.height; }
    set height(h) { this.canvas.height = h; }

    createBlob(callback)
    {
        this.canvas.toBlob(function(blob)
        {
            callback(blob);
        });
    }

    createImage(callback)
    {
        this.canvas.toBlob(function(blob) {
            var ret = new Image();
    
            ret.onload = function() {
                callback(this);
                this.onload = null;
                URL.revokeObjectURL(this.src);
            };
        
            var url = URL.createObjectURL(blob);
            ret.src = url;
        });
    }

    drawImage(image, x, y, w, h)
    {
        if (x === undefined) x = 0;
        if (y === undefined) y = 0;
        if (w === undefined) w = image.width;
        if (h === undefined) h = image.height;
        
        this.context.drawImage(image, x, y, w, h);
    }

    drawImageScaled(image, x, y, sw, sh)
    {
        let w = image.width * sw;
        let h = image.height * sh;

        this.drawImage(image, x, y, w, h);
    }

    drawCroppedImage(image, x, y, cx, cy, cw, ch, w, h)
    {
        if (w === undefined) w = cw;
        if (h === undefined) h = ch;

        this.context.drawImage(image, cx, cy, cw, ch, x, y, w, h);
    }
}
