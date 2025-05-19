import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGGiaoViecXuLySuCoModel, OGSuCoGiaoThongModel } from "../../models/urban-transportation/su-co-giao-thong.model";


class SuCoGiaoThongService {
    static delete(data: OGSuCoGiaoThongModel): Promise<void> {
        return Axios.delete("/api/giao-thong/su-co/" + data.id);
    }

    static get(id: number): Promise<OGSuCoGiaoThongModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/su-co/${id}`).then(async (xhr: AxiosResponse<RestData<OGSuCoGiaoThongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static getGeom(id: number): Promise<string> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/su-co/geom/${id}`).then(async (xhr: AxiosResponse<RestData<string>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGSuCoGiaoThongModel): Promise<RestData<OGSuCoGiaoThongModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/su-co/save"
        }).then(async (xhr: AxiosResponse<RestData<OGSuCoGiaoThongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGSuCoGiaoThongModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/su-co/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGSuCoGiaoThongModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class GiaoViecXuLySuCoService {
    static delete(data: OGGiaoViecXuLySuCoModel): Promise<void> {
        return Axios.delete("/api/giao-thong/giao-viec-xu-ly-su-co/" + data.id);
    }

    static get(id: number): Promise<OGGiaoViecXuLySuCoModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/giao-thong/giao-viec-xu-ly-su-co/${id}`).then(async (xhr: AxiosResponse<RestData<OGGiaoViecXuLySuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGGiaoViecXuLySuCoModel): Promise<RestData<OGGiaoViecXuLySuCoModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/giao-viec-xu-ly-su-co/save"
        }).then(async (xhr: AxiosResponse<RestData<OGGiaoViecXuLySuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGGiaoViecXuLySuCoModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/giao-thong/giao-viec-xu-ly-su-co/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGGiaoViecXuLySuCoModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static updateStatus(data: OGGiaoViecXuLySuCoModel): Promise<RestData<OGGiaoViecXuLySuCoModel>> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/giao-thong/giao-viec-xu-ly-su-co/update-status"
        }).then(async (xhr: AxiosResponse<RestData<OGGiaoViecXuLySuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { GiaoViecXuLySuCoService, SuCoGiaoThongService };