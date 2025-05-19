import Axios, { AxiosResponse } from "axios";
import axios from "axios";

import { EnumStatus } from "../enums/enums";
import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { SanPham } from "../models/san-pham.model";
class SanPhamService {
    static BASE_URL = "/api/sanpham-uav";
    static delete(data: SanPham): Promise<RestBase | RestError> {
        return Axios({
            data: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_URL
        }).then(async (xhr: AxiosResponse<RestBase | RestError>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }

        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<SanPham> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(this.BASE_URL + "/" + id).then(async (xhr: AxiosResponse<RestData<SanPham>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(data: SanPham): Promise<RestData<number> | RestError> {
        return Axios({
            data: JSON.stringify(data),
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
    static list(args): Promise<RestPagedDatatable<SanPham[]>> {
        return Axios({
            data: JSON.stringify(args),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL + "/datatable"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<SanPham[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(data: SanPham): Promise<RestData<number> | RestError> {
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

export { SanPhamService };