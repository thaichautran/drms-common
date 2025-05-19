import Axios, { AxiosResponse } from "axios";

import { BaseCategory } from "../models/base-category.model";
import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";

class LoaiSanPhamUAVService {
    static BASE_URL: string = "/api/dm-loai-sanpham-uav";

    static delete(data: BaseCategory): Promise<RestBase | RestError> {
        return Axios.delete(this.BASE_URL + `/${data.id}`).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<BaseCategory> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(this.BASE_URL + "/" + id).then(async (xhr: AxiosResponse<RestData<BaseCategory>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(data: BaseCategory): Promise<RestData<number> | RestError> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL
        }).then(async (xhr: AxiosResponse<RestData<number> | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(args): Promise<RestPagedDatatable<BaseCategory[]>> {
        return Axios({
            data: JSON.stringify(args),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL + "/datatable"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<BaseCategory[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(data: BaseCategory): Promise<RestData<number> | RestError> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "PUT",
            url: this.BASE_URL
        }).then(async (xhr: AxiosResponse<RestData<number> | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { LoaiSanPhamUAVService };