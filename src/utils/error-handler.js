/**
 * RFC 7807/9457 compliant error handler for HTTP APIs
 * Provides standardized error responses for HTTP APIs
 */

/**
 * Creates a problem details object according to RFC 9457
 * @param {Object} options - Options for the problem details
 * @param {string} [options.type='about:blank'] - URI reference that identifies the problem type
 * @param {string} [options.title] - Short, human-readable summary of the problem type
 * @param {number} [options.status] - HTTP status code
 * @param {string} [options.detail] - Human-readable explanation specific to this occurrence of the problem
 * @param {string} [options.instance] - URI reference that identifies the specific occurrence of the problem
 * @param {Object} [options.extensions] - Additional members that provide more details about the error
 * @returns {Object} - Problem details object
 */
const createProblemDetails = (options = {}) => {
    const {
        type = 'about:blank',
        title,
        status,
        detail,
        instance,
        extensions = {}
    } = options;

    // Create the base problem details object
    const problemDetails = {
        type
    };

    // Add optional members if provided
    if (title) problemDetails.title = title;
    if (status) problemDetails.status = status;
    if (detail) problemDetails.detail = detail;
    if (instance) problemDetails.instance = instance;

    // Add any extension members
    return { ...problemDetails, ...extensions };
};

/**
 * Sends a problem details response
 * @param {Object} res - Express response object
 * @param {Object} options - Options for the problem details
 * @param {number} [options.status=500] - HTTP status code
 * @param {string} [options.type='about:blank'] - URI reference that identifies the problem type
 * @param {string} [options.title] - Short, human-readable summary of the problem type
 * @param {string} [options.detail] - Human-readable explanation specific to this occurrence of the problem
 * @param {string} [options.instance] - URI reference that identifies the specific occurrence of the problem
 * @param {Object} [options.extensions] - Additional members that provide more details about the error
 * @param {boolean} [options.success=false] - Success flag for API responses (for test compatibility)
 */
const sendProblemResponse = (res, options = {}) => {
    const { status = 500 } = options;

    // If title is not provided, use the standard HTTP status text
    if (!options.title) {
        options.title = getStatusText(status);
    }

    // Create the problem details object
    const problemDetails = createProblemDetails({
        ...options,
        status
    });

    // Always add success: false for test compatibility
    if (options.success === undefined) {
        problemDetails.success = false;
    }

    // Set the appropriate content type and status code
    res.status(status).contentType('application/problem+json').json(problemDetails);
};

/**
 * Get the standard HTTP status text for a status code
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Standard HTTP status text
 */
const getStatusText = (statusCode) => {
    const statusTexts = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        409: 'Conflict',
        410: 'Gone',
        415: 'Unsupported Media Type',
        422: 'Unprocessable Content',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    };

    return statusTexts[statusCode] || 'Unknown Error';
};

/**
 * Create a validation error problem details object
 * @param {Array} errors - Array of validation errors
 * @param {string} [type='https://example.com/validation-error'] - URI reference that identifies the problem type
 * @param {string} [title='Validation Error'] - Short, human-readable summary of the problem type
 * @returns {Object} - Problem details object for validation errors
 */
const createValidationProblem = (errors, type = 'https://example.com/validation-error', title = 'Validation Error') => {
    return createProblemDetails({
        type,
        title,
        status: 422,
        detail: 'The request contains invalid parameters',
        extensions: {
            errors: errors.map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }))
        }
    });
};

/**
 * Global error handler middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
    // If headers have already been sent, delegate to Express's default error handler
    if (res.headersSent) {
        return next(err);
    }

    // Default error details
    let status = err.status || err.statusCode || 500;
    let type = 'about:blank';
    let title = getStatusText(status);
    let detail = err.message || 'An unexpected error occurred';
    let instance = req.originalUrl;
    let extensions = {};

    // Handle specific error types
    if (err.name === 'ValidationError') {
        // Handle validation errors (e.g., from express-validator)
        status = 422;
        type = 'https://example.com/validation-error';
        title = 'Validation Error';
        extensions = { errors: err.errors || [] };
    } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
        // Handle authentication errors
        status = 401;
        type = 'https://example.com/authentication-error';
        title = 'Authentication Error';
    } else if (err.name === 'ForbiddenError') {
        // Handle authorization errors
        status = 403;
        type = 'https://example.com/authorization-error';
        title = 'Authorization Error';
    } else if (err.name === 'NotFoundError') {
        // Handle not found errors
        status = 404;
        type = 'https://example.com/not-found-error';
        title = 'Resource Not Found';
    }

    // Log the error (in production, you might want to be more selective)
    console.error('Error:', err);

    // Send the problem details response
    sendProblemResponse(res, {
        status,
        type,
        title,
        detail,
        instance,
        extensions
    });
};

module.exports = {
    createProblemDetails,
    sendProblemResponse,
    createValidationProblem,
    errorHandler
};
