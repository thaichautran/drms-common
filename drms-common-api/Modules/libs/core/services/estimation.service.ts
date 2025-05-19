import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../enums/enums";
import { RestData, RestPagedDatatable } from "../models/base-response.model";
import { OGDuToanCongViecSuaChua } from "../models/kiem-tra/kiem-tra.model";

class EstimationService {
    static delete(data: OGDuToanCongViecSuaChua): Promise<RestData<OGDuToanCongViecSuaChua>> {
        return Axios.delete("/api/du-toan/" + data.id).then(async (xhr: AxiosResponse<RestData<OGDuToanCongViecSuaChua>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGDuToanCongViecSuaChua> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/du-toan/${id}`).then(async (xhr: AxiosResponse<RestData<OGDuToanCongViecSuaChua>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: FormData): Promise<RestData<OGDuToanCongViecSuaChua>> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/du-toan/save"
        }).then(async (xhr: AxiosResponse<RestData<OGDuToanCongViecSuaChua>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGDuToanCongViecSuaChua[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/du-toan/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGDuToanCongViecSuaChua[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { EstimationService };