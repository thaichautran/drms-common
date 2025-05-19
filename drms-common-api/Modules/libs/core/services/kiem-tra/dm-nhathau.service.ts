import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGNhaThau } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";


class DmNhaThauService {
    static BASE_URL: string = "/api/ke-hoach/nha-thau/";

    static delete(data: OGNhaThau): Promise<void> {
        return Axios.delete(this.BASE_URL, {
            params: data
        }).then(async (xhr: AxiosResponse<RestData<OGNhaThau>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa kế hoạch thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            }
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGNhaThau> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`${this.BASE_URL}${id}`).then(async (xhr: AxiosResponse<RestData<OGNhaThau>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGNhaThau): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL,
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status === EnumStatus.OK) {
                    return xhr.data;
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGNhaThau[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: this.BASE_URL + "list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGNhaThau[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static update(data: OGNhaThau): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "PUT",
            url: this.BASE_URL,
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status === EnumStatus.OK) {
                    return xhr.data;
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
}

export { DmNhaThauService };