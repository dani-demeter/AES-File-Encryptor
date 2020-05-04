const {
    ipcRenderer
} = require('electron')
$ = require('jquery');
var $inputDiv = $("#inputDiv");

var workers = [];

$inputDiv.on('drop', function(e) {
    dropHandler(e);
});

$inputDiv.on('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

ipcRenderer.on('fileData', (event, data) => {
    $('#txtarea').text(data);
})

async function dropHandler(e) {
    e.preventDefault();
    var files = e.originalEvent.dataTransfer.files
    console.log(files);
    if (files) {
        var hashedKey;
        Swal.fire({
            title: 'Enter a key:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Go!',
            allowOutsideClick: false,
            preConfirm: (pass) => {
                return digestMessage(pass).then((hash) => {
                    hashedKey = new Uint8Array(hash);
                });
            }
        }).then((res) => {
            if (res.value) {
                console.log(files);
                var numFiles = files.length;
                console.log(numFiles);
                var listOfFilenames = "";
                var showDownloadAll = false;

                for (var i = 0; i < files.length; i++) {
                    ipcRenderer.send('ondragstart', files[i].path)
                }
                handleFiles(files, hashedKey);
                Swal.fire({
                    title: "Your file" + (numFiles > 1 ? "s are" : " is") + " being processed.",
                });
            }


        });

    } else {
        for (var i = 0; i < ev.dataTransfer.files.length; i++) {
            console.log('file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
        }
    }
}

function handleFiles(files, hashedKey) {
    console.log(files);
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        console.log(f);
        console.log("about to spawn worker");
        var w = new Worker('resources/fileHandler.js');
        w.postMessage([f, hashedKey]);
        w.onmessage = function(e) {
            console.log(e.data);
            new Noty({
                    text: `${e.data.fileNameToSave} is ready!`,
                    theme: 'nest',
                })
                .on('onClick', () => {
                    var blob = new Blob([e.data.bytesToSave], {
                        type: e.data.fileSaveType
                    });
                    var link = document.createElement('a');
                    link.href = window.URL.createObjectURL(blob);
                    link.download = e.data.fileNameToSave;
                    link.click();
                })
                .show();
            w.terminate();
        }
        workers.push(w);
    }
}




function dragOverHandler(ev) {
    ev.preventDefault();
    for (let f of ev.dataTransfer.files) {
        console.log('The file(s) you dragged: ', f)
        ipcRenderer.send('ondragstart', f.path)
    }
}

async function digestMessage(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return (hash);
}

function getExtension(name) {
    return name.substring(name.lastIndexOf(".") + 1);
}
