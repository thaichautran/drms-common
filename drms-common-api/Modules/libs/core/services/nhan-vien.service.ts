import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGNhanVienModel } from "../models/nhan-vien.model";

class NhanVienService {
    static delete(data: OGNhanVienModel): Promise<RestData<OGNhanVienModel>> {
        return Axios.delete("/api/nhan-vien/" + data.id).then(async (xhr: AxiosResponse<RestData<OGNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGNhanVienModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/nhan-vien/${id}`).then(async (xhr: AxiosResponse<RestData<OGNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGNhanVienModel): Promise<RestData<OGNhanVienModel>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/save"
        }).then(async (xhr: AxiosResponse<RestData<OGNhanVienModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGNhanVienModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/nhan-vien/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGNhanVienModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    return xhr.data;
                } else {
                    return undefined;
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { NhanVienService };