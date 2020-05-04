importScripts('./aesjs.js');
console.log("HI. WORKER HERE");

onmessage = function(e) {
    //e.data
    var file = e.data[0];
    var reader = new FileReader();
    reader.onload = function() {
        if (getExtension(file.name) != "dcrypt") {
            var res = encryptFile(file, this.result, e.data[1]);
            console.log("worker finished encrypting");
            postMessage(res);
        } else {
            var res = decryptFile(file, this.result, e.data[1]);
            console.log("worker finished decrypting");
            postMessage(res);
        }
    }
    reader.readAsArrayBuffer(file);
}

function encryptFile(file, bytes, hashedKey) {
    console.log(file, bytes, hashedKey);
    var filename = file.name;
    var type = file.type;
    var textBytes = aesjs.utils.utf8.toBytes(filename + ";" + type + ";");
    var arrayBuffer = bytes;
    var array = concatTypedArrays(textBytes, new Uint8Array(arrayBuffer));
    console.log(array);

    var aesCtr = new aesjs.ModeOfOperation.ctr(hashedKey);
    var encryptedBytes = aesCtr.encrypt(array);

    return {
        bytesToSave: encryptedBytes,
        fileNameToSave: filename.substring(0, filename.lastIndexOf(".")) + ".dcrypt",
        fileSaveType: ""
    }
}

function decryptFile(file, bytes, hashedKey) {
    var aesCtr = new aesjs.ModeOfOperation.ctr(hashedKey);
    var arrayBuffer = bytes;
    var array = new Uint8Array(arrayBuffer);
    var decryptedBytes = aesCtr.decrypt(array);

    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    var secIndex = getNthOccurrence(decryptedText, ";", 2);
    var textUntilSecondSemicolon = decryptedText.substring(0, secIndex).split(";");
    var filen = textUntilSecondSemicolon[0];
    var typ = textUntilSecondSemicolon[1];
    decryptedBytes = decryptedBytes.slice(secIndex + 1);
    var bytes = new Uint8Array(decryptedBytes);
    return {
        bytesToSave: bytes,
        fileNameToSave: filen,
        fileSaveType: typ
    }
}


function getExtension(name) {
    return name.substring(name.lastIndexOf(".") + 1);
}

function getNthOccurrence(str, pat, n) {
    var L = str.length,
        i = -1;
    while (n-- && i++ < L) {
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}


function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new(a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}
