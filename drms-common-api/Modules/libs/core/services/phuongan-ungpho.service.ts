import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { OGUtils } from "../helpers/utils";
import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { PhuongAnUngPhoModel, XayDungPhuongAnUngPhoViewModel } from "../models/phuongan-ungpho.model";
class PhuongAnUngPhoService {
    static BASE_URL: string = "/api/pan-ungpho-thientai";

    static delete(data: PhuongAnUngPhoModel): Promise<RestBase | RestError> {
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

    static get(id: number): Promise<PhuongAnUngPhoModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(this.BASE_URL + "/" + id).then(async (xhr: AxiosResponse<RestData<PhuongAnUngPhoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(data: PhuongAnUngPhoModel): Promise<RestData<number> | RestError> {
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
    static list(args): Promise<RestPagedDatatable<PhuongAnUngPhoModel[]>> {
        return Axios({
            data: JSON.stringify(args),
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL + "/datatable"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<PhuongAnUngPhoModel[]>>) => {
            if (xhr.status === 200) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(data: PhuongAnUngPhoModel): Promise<RestData<number> | RestError> {
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

    static xayDungKichBan(data: XayDungPhuongAnUngPhoViewModel): Promise<RestData<number> | RestError> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL + "/xay-dung"
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

export { PhuongAnUngPhoService };