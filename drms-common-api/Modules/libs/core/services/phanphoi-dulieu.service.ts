import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { PhanPhoiDuLieuModel } from "../models/tichhop-dulieu.model";

class PhanPhoiDuLieuService {
    static BASE_PATH = "/api/phanphoi-dulieu";
    static delete(entity: PhanPhoiDuLieuModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<PhanPhoiDuLieuModel> {
        if (!id) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<PhanPhoiDuLieuModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: PhanPhoiDuLieuModel): Promise<PhanPhoiDuLieuModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<PhanPhoiDuLieuModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<PhanPhoiDuLieuModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<PhanPhoiDuLieuModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static sync(): Promise<RestBase> {
        return Axios.post(`${this.BASE_PATH}/sync`).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: PhanPhoiDuLieuModel): Promise<PhanPhoiDuLieuModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<PhanPhoiDuLieuModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { PhanPhoiDuLieuService };