class Logger {
    static logLvl = {
        PANIC: 0x00,
        ERROR: 0x01,
        WARN: 0x02,
        INFO: 0x03,
        DEBUG: 0x04
    } ;

    writeLog = console.log ;
    writeError = console.error ;

    labels = {}
    level = Logger.logLvl.INFO ;

    constructor(level = Logger.logLvl.INFO, label = "", writers) {
        if(typeof writers !== "undefined") {
            if(typeof writers.writeLog !== "undefined") {
                this.writeLog = writers.writeLog;
                this.writeError = writers.writeLog ;
            }
            if(typeof writers.writeError !== "undefined")
                this.writeError = writers.writeError ;
        }

        this.level = level ;
        this.label = label ;

        this.labels[Logger.logLvl.PANIC] = "PANIC"
        this.labels[Logger.logLvl.ERROR] = "ERROR"
        this.labels[Logger.logLvl.WARN]  = "WARN "
        this.labels[Logger.logLvl.INFO]  = "INFO "
        this.labels[Logger.logLvl.DEBUG] = "DEBUG"
    }

    log(message, level = Logger.logLvl.INFO) {
        if(level > this.level) return ;
        let prefix = `${this.labels[level]}${this.label === "" ? "" : " ["+ this.label+ "]"}:` ;
        switch(level) {
            case Logger.logLvl.PANIC:
            case Logger.logLvl.ERROR:
                this.writeError(prefix, message) ;
                break;
            case Logger.logLvl.WARN:
            case Logger.logLvl.INFO:
            case Logger.logLvl.DEBUG:
                this.writeLog(prefix, message) ;
                break;
        }
    }

    panic(message) {
        this.log(message, Logger.logLvl.PANIC) ;
    }

    error(message) {
        this.log(message, Logger.logLvl.ERROR) ;
    }

    warn(message) {
        this.log(message, Logger.logLvl.WARN) ;
    }

    info(message) {
        this.log(message, Logger.logLvl.INFO) ;
    }

    debug(message) {
        this.log(message, Logger.logLvl.DEBUG) ;
    }
}
