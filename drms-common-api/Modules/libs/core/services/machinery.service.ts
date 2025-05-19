import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGMachineryModel } from "../models/maintenance.model";

class MachineryService {
    static delete(data: OGMachineryModel): Promise<RestData<OGMachineryModel>> {
        return Axios.delete("/api/phuong-tien/" + data.id).then(async (xhr: AxiosResponse<RestData<OGMachineryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGMachineryModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/phuong-tien/${id}`).then(async (xhr: AxiosResponse<RestData<OGMachineryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGMachineryModel): Promise<RestPagedDatatable<OGMachineryModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/phuong-tien/save"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMachineryModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGMachineryModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/phuong-tien/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGMachineryModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { MachineryService };