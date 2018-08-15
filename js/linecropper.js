function init()
{
    document.getElementById("input-file").onchange = function(e)
    {
        if (this.files && this.files[0])
        {
            loadImage(this.files[0], doCrop);
        }
        else
        {
            console.log("Bad file!");
        }
    };
}

function loadImage(file, cb)
{
    var image = new Image();

    image.onload = function()
    {
        cb(this);
        window.URL.revokeObjectURL(this.src);
    };

    image.src = window.URL.createObjectURL(file);
}

function doCrop(image)
{
    var cropHeight = 1280;
    var cropWidth = 800;

    var canvas = new Canvas();
    canvas.width = cropWidth;
    canvas.height = canvas.width * image.height / image.width;
    canvas.drawImage(image, 0, 0, canvas.width, canvas.height);

    var cropCanvas = new Canvas();
    cropCanvas.resize(cropWidth, cropHeight);

    var numSlices = ~~(canvas.height / cropHeight);
    var zip = new JSZip();

    var fn = function(i)
    {
        var h =  Math.min(cropHeight, (canvas.height - (cropHeight * i)));
        cropCanvas.height = h;
        cropCanvas.clear();
        cropCanvas.drawCroppedImage(
            canvas.canvas,
            0,
            0,
            0,
            cropHeight * i,
            cropWidth,
            h
        );

        cropCanvas.createBlob(function(blob)
        {
            /*var $img = document.createElement("img");
            $img.src = image.src;
            document.body.appendChild($img);*/

            zip.file(i.toString().padStart(3, "0") + ".png", blob);

            i++;
            if (i <= numSlices)
            {
                fn(i);
            }
            else
            {
                zip.generateAsync({type:"blob"}).then(function(blob)
                {
                    saveAs(blob, "cropped.zip");
                });
            }
        });
    };

    fn(0);
}

window.onload = init;