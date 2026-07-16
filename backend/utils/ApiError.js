class ApiError extends Error {
    constructor(statusCode = 500, message = "Internal Server Error", errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.errors = errors;
        this.success = false;
        Error.captureStackTrace(this, this.constructor);
    }
}

export default ApiError;
