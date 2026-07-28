const cleanObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(cleanObject);
    }

    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
            continue;
        }
        clean[key] = cleanObject(value);
    }
    return clean;
};

export const sanitizeInputs = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        req.body = cleanObject(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        req.query = cleanObject(req.query);
    }
    if (req.params && typeof req.params === 'object') {
        req.params = cleanObject(req.params);
    }
    next();
};
