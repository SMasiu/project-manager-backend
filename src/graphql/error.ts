export const formatError = err => {
    const parsed = JSON.parse(err.message);
    let error = {...errorResponses[parsed.type]};
    if(parsed.message) {
        error.message = parsed.message;
    }

    return error;

}

export const defineError = (error) => {
    let json = JSON.stringify(error)
    return json;
}

const errorResponses = {
    BadRequest: {
        message: 'Invalid request',
        type: 'BadRequest'
    },
    ServerError: {
        message: 'Internal server error',
        type: 'ServerError'
    },
    Unauthorized: {
        message: 'Unauthorized user',
        type: 'Unauthorized'
    },
    NotFound: {
        message: 'Resource not found',
        type: 'NotFound'
    }
}