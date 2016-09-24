'use strict'

const pm2 = require('pm2')

class PM2ProcessWrapper {

    constructor(process, path) {
        this._process = process
        this._path = path
    }

    startProcess() {
        var start = () => {
            return new Promise((resolve, reject) => {
                this._startProcess({
                    script: this._path,
                    name: this._process,
                    watch: false
                }).then(() => {
                    this.getProcessInfo().then(resolve, reject)
                }, reject)
            })
        }

        return this.getProcessInfo().then((info) => {
            if (info.processInfo.status != 'online') {
                return start()
            }
        }, (err) => {
            return start()
        })
    }

    stopProcess() {
        return new Promise((resolve, reject) => {
            this._stopProcess(this._process).then(() => {
                this.getProcessInfo().then(resolve, reject)
            }, reject)
        })
    }

    restartProcess() {
        return new Promise((resolve, reject) => {
            this._restartProcess(this._process).then(() => {
                this.getProcessInfo().then(resolve, reject)
            }, reject)
        })
    }

    getProcessInfo(event) {
        return new Promise((resolve, reject) => {
            this._describeProcess(this._process).then((description) => {
                if (description.length < 1) {
                    return reject('Process does not exist.')
                }

                let processInfo = {
                    name: description[0].name,
                    uptime: description[0].pm2_env.pm_uptime,
                    status: description[0].pm2_env.status,
                    restarts: description[0].pm2_env.restart_time,
                    unstable_restarts: description[0].pm2_env.unstable_restarts,
                    event: event
                }
                let secretInfo = {
                    log_path: description[0].pm2_env.pm_out_log_path,
                }
                resolve({processInfo, secretInfo})
            }, reject)
        })
    }

    onProcessEvent(cb) {
        pm2.launchBus((err, bus) => {
            bus.on('process:event', (e) => {
                this.getProcessInfo(e).then(cb)
            })
        })
    }

    _startProcess(params) {
        return new Promise((resolve, reject) => {
            this._connectToPM2().then((done) => {
                pm2.start(params, (err, process) => {
                    if (err) {
                        reject(err)
                    }
                    done()
                    resolve(process)
                })
            })
        })
    }

    _stopProcess(process) {
        return new Promise((resolve, reject) => {
            this._connectToPM2().then((done) => {
                pm2.stop(process, (err, process) => {
                    if (err) {
                        reject(err)
                    }
                    done()
                    resolve(process)
                })
            })
        })
    }

    _restartProcess(process) {
        return new Promise((resolve, reject) => {
            this._connectToPM2().then((done) => {
                pm2.restart(process, (err, process) => {
                    if (err) {
                        reject(err)
                    }
                    done()
                    resolve(process)
                })
            })
        })
    }

    _describeProcess(process) {
        return new Promise((resolve, reject) => {
            this._connectToPM2().then((done) => {
                pm2.describe(process, (err, description) => {
                    if (err) {
                        reject(err)
                    }
                    done()
                    resolve(description)
                })
            })
        })
    }

    _connectToPM2() {
        return new Promise((resolve, reject) => {
            pm2.connect((err) => {
                if (err) {
                    reject(err)
                }

                var done = () => {
                    pm2.disconnect()
                }

                resolve(done)
            })
        })
    }
}

module.exports = PM2ProcessWrapper
