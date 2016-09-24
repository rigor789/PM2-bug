const PM2ProcessWrapper = require('./PM2ProcessWrapper')

var otherProcessWrap = new PM2ProcessWrapper('Other', 'other.js')

otherProcessWrap.startProcess().then((res) => {
    setTimeout(() => {
        console.log('Restarting other process now...')

        otherProcessWrap.restartProcess().then((res) => {
            console.log('Success.')
        })
    }, 10000)

})

setInterval(() => {
    console.log('Hello from entry process ', new Date())
}, 2000)
