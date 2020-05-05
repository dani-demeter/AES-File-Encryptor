const {
    ipcRenderer
} = require('electron')
$ = require('jquery');
var $inputDiv = $("#inputDiv");
Noty.setMaxVisible(20);

for(var i = 0; i<5; i++){
    new Noty({
        text: `Encountered error while processing!`,
        type: 'error',
        theme: 'sunset',
    }).show();
}

var workers = [];

$inputDiv.on('drop', function(e) {
    dropHandler(e);
});

$inputDiv.on('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
});

async function dropHandler(e) {
    e.preventDefault();
    var files = e.originalEvent.dataTransfer.files
    if (files) {
        Swal.fire({
            title: 'Enter a key:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Go!',
            allowOutsideClick: false,
        }).then((res) => {
            if (res.value) {
                // console.log(res.value);
                var numFiles = files.length;
                let enc = new TextEncoder();
                var keyAsBytes = enc.encode(res.value);
                for (var i = 0; i < files.length; i++) {
                    ipcRenderer.send('ondragstart', files[i].path)
                }
                handleFiles(files, keyAsBytes);

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

function handleFiles(files, keyAsBytes) {
    console.log(files);
    for (var i = 0; i < files.length; i++) {
        var f = files[i];
        console.log(f);
        // console.log("about to spawn worker");
        var w = new Worker('resources/fileHandler.js');
        w.postMessage([f, keyAsBytes]);
        w.onmessage = function(e) {
            if(e.data.status!="success"){
                console.log("error");
                new Noty({
                    text: `Encountered error while processing ${f.name}!`,
                    type: 'error',
                    theme: 'sunset',
                }).show();
            }else{
                // console.log(e.data);
                new Noty({
                    text: `${e.data.fileNameToSave} is ready!`,
                    type: 'success',
                    theme: 'sunset',
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
            }
            w.terminate();
        }
        workers.push(w);
    }
}

function dragOverHandler(ev) {
    ev.preventDefault();
    for (let f of ev.dataTransfer.files) {
        // console.log('The file(s) you dragged: ', f)
        ipcRenderer.send('ondragstart', f.path)
    }
}

async function hash256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return (hash);
}

function getExtension(name) {
    return name.substring(name.lastIndexOf(".") + 1);
}
