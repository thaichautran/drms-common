import Axios, { AxiosResponse } from "axios";

import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGKeHoachKiemTraDinhKemModel } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";


class KeHoachKiemTraDinhKemService {
    static BASE_PATH = "/api/ke-hoach/kiem-tra/dinh-kem";
    static delete(entity: OGKeHoachKiemTraDinhKemModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<OGKeHoachKiemTraDinhKemModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<OGKeHoachKiemTraDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: OGKeHoachKiemTraDinhKemModel): Promise<OGKeHoachKiemTraDinhKemModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<OGKeHoachKiemTraDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<OGKeHoachKiemTraDinhKemModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<OGKeHoachKiemTraDinhKemModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: OGKeHoachKiemTraDinhKemModel): Promise<OGKeHoachKiemTraDinhKemModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<OGKeHoachKiemTraDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { KeHoachKiemTraDinhKemService };