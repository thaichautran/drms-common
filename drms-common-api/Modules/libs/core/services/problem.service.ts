import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGProblemModel, OGProcessProblemModel } from "../models/problem.model";

class ProblemService {
    static delete(data: OGProblemModel): Promise<void> {
        return Axios.delete("/api/problem/" + data.id);
    }

    static get(id: number): Promise<OGProblemModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/problem/${id}`).then(async (xhr: AxiosResponse<RestData<OGProblemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGProblemModel): Promise<RestData<OGProblemModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/problem/save"
        }).then(async (xhr: AxiosResponse<RestData<OGProblemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGProblemModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/problem/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGProblemModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class ProcessProblemService {
    static delete(data: OGProcessProblemModel): Promise<void> {
        return Axios.delete("/api/xu-ly-su-co/" + data.id);
    }

    static get(id: number): Promise<OGProcessProblemModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/xu-ly-su-co/${id}`).then(async (xhr: AxiosResponse<RestData<OGProcessProblemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGProcessProblemModel): Promise<RestData<OGProcessProblemModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/xu-ly-su-co/save"
        }).then(async (xhr: AxiosResponse<RestData<OGProcessProblemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGProcessProblemModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/xu-ly-su-co/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGProcessProblemModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { ProblemService, ProcessProblemService };