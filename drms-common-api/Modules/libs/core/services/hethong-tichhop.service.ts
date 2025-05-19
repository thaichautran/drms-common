import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { HeThongTichHopModel, HeThongTichHopThoiGianModel } from "../models/hethong-tichhop.model";

class HeThongTichHopService {
    static BASE_PATH = "/api/hethong-tichhop";
    static delete(entity: HeThongTichHopModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<HeThongTichHopModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<HeThongTichHopModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: HeThongTichHopModel): Promise<HeThongTichHopModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HeThongTichHopModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<HeThongTichHopModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<HeThongTichHopModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: HeThongTichHopModel): Promise<HeThongTichHopModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HeThongTichHopModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class HeThongTichHopThoiGianService {
    static BASE_PATH = "/api/hethong-tichhop/thoi-gian";
    static delete(entity: HeThongTichHopThoiGianModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<HeThongTichHopThoiGianModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<HeThongTichHopThoiGianModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: HeThongTichHopThoiGianModel): Promise<HeThongTichHopThoiGianModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HeThongTichHopThoiGianModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<HeThongTichHopThoiGianModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<HeThongTichHopThoiGianModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: HeThongTichHopThoiGianModel): Promise<HeThongTichHopThoiGianModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HeThongTichHopThoiGianModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { HeThongTichHopService, HeThongTichHopThoiGianService };