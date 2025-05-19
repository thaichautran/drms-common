import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { ThietBiNuocSachModel } from "../models/qlhs/thietbi-capnuoc.model";

class ThietBiNuocSachService {
    static BASE_PATH = "/api/thietbi-nuocsach";
    static delete(entity: ThietBiNuocSachModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<ThietBiNuocSachModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<ThietBiNuocSachModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: ThietBiNuocSachModel): Promise<ThietBiNuocSachModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThietBiNuocSachModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<ThietBiNuocSachModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<ThietBiNuocSachModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: ThietBiNuocSachModel): Promise<ThietBiNuocSachModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThietBiNuocSachModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { ThietBiNuocSachService };