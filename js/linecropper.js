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

    if (dragdrop)
    {
        dragdrop.init(document.getElementById("dragDropOverlay"));
        dragdrop.softEvents.onnewinput = function(input)
        {
            loadImage(input, doCrop);
        };
    }
}

function loadImage(file, cb)
{
    let image = new Image();

    image.onload = function()
    {
        cb(this);
        window.URL.revokeObjectURL(this.src);
    };

    image.src = window.URL.createObjectURL(file);
}

function doCrop(image)
{
    let cropHeight = 1280;
    let cropWidth = 800;

    let canvas = new Canvas();
    canvas.width = cropWidth;
    canvas.height = canvas.width * image.height / image.width;
    canvas.drawImage(image, 0, 0, canvas.width, canvas.height);

    let cropCanvas = new Canvas();
    cropCanvas.resize(cropWidth, cropHeight);

    let numSlices = ~~(canvas.height / cropHeight);
    let zip = new JSZip();

    let fn = function(i)
    {
        let h =  Math.min(cropHeight, (canvas.height - (cropHeight * i)));
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

        cropCanvas.canvas.toBlob(function(blob)
        {
            /*let $img = document.createElement("img");
            $img.src = image.src;
            document.body.appendChild($img);*/

            zip.file(i.toString().padStart(3, "0") + ".jpg", blob);

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
        }, "image/jpeg", 1);
    };

    fn(0);
}

window.onload = init;