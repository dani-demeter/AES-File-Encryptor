// const path = require('path');
// const express = require('express');
// const parser = require('body-parser');
// const cors = require('cors');
// const exp = express();
// const server = require('http').Server(exp);
const fs = require('fs');
const {
    app,
    BrowserWindow,
    ipcMain
} = require('electron')

// server.listen(process.env.PORT || 80);
// exp.use(express.static(__dirname));
//
// // cross origin requests accepted
// exp.use(cors());
// exp.use(parser.json());
// exp.use(parser.urlencoded({extended: true}));
//
// exp.get('/', (req, res) => {
//   res.sendFile(path.resolve(__dirname+'/index.html'));
// });

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    })

    // and load the index.html of the app.
    win.loadFile('index.html')
}

ipcMain.on('ondragstart', (event, filePath) => {

    readFile(filePath);

    function readFile(filepath) {
        fs.readFile(filepath, 'utf-8', (err, data) => {

            if (err) {
                alert("An error ocurred reading the file :" + err.message)
                return
            }

            // handle the file content
            event.sender.send('fileData', data)
        })
    }

})
app.whenReady().then(createWindow)
