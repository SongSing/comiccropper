let zip;
let numFiles = 0;
let counter = 0;

function init()
{
    console.log("help");
    document.getElementById("input-file").onchange = function(e)
    {
        if (this.files && this.files[0])
        {
            zip = new JSZip();
            numFiles = this.files.length;
            counter = 0;
            for (let i = 0; i < this.files.length; i++)
            {
                loadImage(this.files[i], doCrop);
            }
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
            zip = new JSZip();
            numFiles = input.length;
            counter = 0;
            for (let i = 0; i < input.length; i++)
            {
                loadImage(input[i], doCrop);
            }
        };
    }
}

function loadImage(file, cb)
{
    let image = new Image();

    image.onload = function()
    {
        cb(this, file.name);
        window.URL.revokeObjectURL(this.src);
    };

    image.src = window.URL.createObjectURL(file);
}

function doCrop(image, filename)
{
    let ratio = 8.5 / 11;
    let imageRatio = image.width / image.height;

    let cropWidth = image.width;
    let cropHeight = image.width * (1 / ratio);

    let canvas = new Canvas();
    canvas.width = image.width;
    canvas.height = image.height;
    canvas.drawImage(image, 0, 0, canvas.width, canvas.height);

    let cropCanvas = new Canvas();
    cropCanvas.resize(cropWidth, cropHeight);

    let numSlices = ~~(canvas.height / cropHeight);

    let fn = function(i)
    {
        let h =  Math.min(cropHeight, (canvas.height - (cropHeight * i)));
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

            zip.file(filename.substr(0, filename.lastIndexOf(".")) + "_" + i.toString().padStart(3, "0") + ".png", blob);
            console.log("zipped: " + filename.substr(0, filename.lastIndexOf(".")) + "_" + i.toString().padStart(3, "0") + ".png");

            i++;
            if (i <= numSlices)
            {
                fn(i);
            }
            else
            {
                counter++;
                console.log(counter);

                if (counter === numFiles)
                {
                    zip.generateAsync({type:"blob"}).then(function(blob)
                    {
                        saveAs(blob, "cropped.zip");
                    });
                }
            }
        });
    };

    fn(0);
}

window.onload = init;