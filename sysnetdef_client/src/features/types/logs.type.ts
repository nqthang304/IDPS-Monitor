export interface logUsage {
    totalLogSize: number,
    logsCount: number,
    storageInfo: {
        total: number,
        free: number,
        used: number
    }
};

export interface logsRetention {
    usageLimit: number,
    autoClean: boolean,
    fileRotation: boolean,
};

export interface activitySettings {
    cleanActive: boolean,
    cleanTime: number
};