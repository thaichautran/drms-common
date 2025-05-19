import Axios, { AxiosResponse } from "axios";

import { RestBase, RestData, RestError, RestPagedDatatable } from "../models/base-response.model";
import { HoSoKySo } from "../models/document.model";

class HoSoKySoService {
    static BASE_PATH = "/api/ho-so/ky-so";
    static delete(entity: HoSoKySo): Promise<void> {
        return Axios({
            data: entity,
            headers: {
                "Content-Type": "application/json"
            },
            method: "DELETE",
            url: this.BASE_PATH,
        });
    }
    static get(id: number): Promise<HoSoKySo> {
        if (!id || id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_PATH}/${id}`).then(async (xhr: AxiosResponse<RestData<HoSoKySo>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(entity: HoSoKySo): Promise<HoSoKySo> {
        return Axios.post(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HoSoKySo>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static list(params): Promise<RestPagedDatatable<HoSoKySo[]>> {
        return Axios.post(`${this.BASE_PATH}/data-grid`, params).then(async (xhr: AxiosResponse<RestPagedDatatable<HoSoKySo[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static update(entity: HoSoKySo): Promise<HoSoKySo> {
        return Axios.put(`${this.BASE_PATH}`, entity).then(async (xhr: AxiosResponse<RestData<HoSoKySo>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { HoSoKySoService };