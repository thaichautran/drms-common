import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { ThuMucDinhKemModel, ThuMucModel } from "../models/qlhs/thu-muc.model";

class ThuMucService {
    static BASE_PATH = "/api/thumuc-hoso";
    static delete(entity: ThuMucModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<ThuMucModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<ThuMucModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: ThuMucModel): Promise<ThuMucModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThuMucModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<ThuMucModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<ThuMucModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: ThuMucModel): Promise<ThuMucModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThuMucModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

class ThuMucDinhKemService {
    static BASE_PATH = "/api/thumuc-hoso/dinh-kem";
    static delete(entity: ThuMucDinhKemModel): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<ThuMucDinhKemModel> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<ThuMucDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: ThuMucDinhKemModel): Promise<ThuMucDinhKemModel> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThuMucDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<ThuMucDinhKemModel[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<ThuMucDinhKemModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: ThuMucDinhKemModel): Promise<ThuMucDinhKemModel> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<ThuMucDinhKemModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { ThuMucDinhKemService, ThuMucService };