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

    log(level, ...message) {
        if(level > this.level) return ;
        let prefix = `${this.labels[level]}${this.label === "" ? "" : " ["+ this.label+ "]"}:` ;
        message = [prefix, ...message] ;
        switch(level) {
            case Logger.logLvl.PANIC:
            case Logger.logLvl.ERROR:
                this.writeError(...message) ;
                break;
            case Logger.logLvl.WARN:
            case Logger.logLvl.INFO:
            case Logger.logLvl.DEBUG:
                this.writeLog(...message) ;
                break;
        }
    }

    panic(...message) {
        this.log(Logger.logLvl.PANIC, ...message) ;
    }

    error(...message) {
        this.log(Logger.logLvl.ERROR, ...message) ;
    }

    warn(...message) {
        this.log(Logger.logLvl.WARN, ...message) ;
    }

    info(...message) {
        this.log(Logger.logLvl.INFO, ...message) ;
    }

    debug(...message) {
        this.log(Logger.logLvl.DEBUG, ...message) ;
    }
}
