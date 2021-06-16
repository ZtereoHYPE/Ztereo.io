const child_process = require('child_process');

start();

function start() {
    var proc = child_process.spawn('node', ['server.js']);

    proc.stdout.on('data', function (data) {
        console.log(data.toString());
    });

    proc.stderr.on('data', function (data) {
        console.log(data.toString());
    });

    proc.on('exit', function (code) {
        console.log('Child process exited with code ' + code + ', restarting it...');
        delete(proc);
        setTimeout(start, 5000);
    });
}