import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGChamCongModel } from "../models/nhan-vien.model";

class ChamCongService {
    static delete(data: OGChamCongModel): Promise<RestData<OGChamCongModel>> {
        return Axios.delete("/api/nhan-vien/cham-cong/" + data.id).then(async (xhr: AxiosResponse<RestData<OGChamCongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGChamCongModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/nhan-vien/cham-cong/${id}`).then(async (xhr: AxiosResponse<RestData<OGChamCongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGChamCongModel): Promise<RestData<OGChamCongModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/cham-cong/save"
        }).then(async (xhr: AxiosResponse<RestData<OGChamCongModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGChamCongModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/cham-cong/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGChamCongModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { ChamCongService };