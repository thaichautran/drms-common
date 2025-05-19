interface RestBase {
    status: string,
}

interface RestData<T> extends RestBase {
    data: T
}

type RestErrorDescription = {
    code: number,
    descripion: string,
    message: string,
};

interface RestError extends RestBase {
    errors: RestErrorDescription[]
}

interface RestPagedDatatable<T> extends RestBase {
    data: T;
    draw: number;
    recordsFiltered: number;
    recordsTotal: number;
    totalPages: number;
}
export {
    RestBase,
    RestData,
    RestError,
    RestErrorDescription,
    RestPagedDatatable
};