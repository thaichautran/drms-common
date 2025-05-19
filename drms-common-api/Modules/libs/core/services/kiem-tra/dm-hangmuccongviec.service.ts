import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGKeHoachCongViecModel } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";


class DmHangMucCongViecService {
    static BASE_URL: string = "/api/ke-hoach/cong-viec/";

    static delete(data: OGKeHoachCongViecModel): Promise<void> {
        return Axios.delete(DmHangMucCongViecService.BASE_URL, {
            params: data
        }).then(async (xhr: AxiosResponse<RestData<OGKeHoachCongViecModel>>) => {
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

    static get(id: number): Promise<OGKeHoachCongViecModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`${DmHangMucCongViecService.BASE_URL}${id}`).then(async (xhr: AxiosResponse<RestData<OGKeHoachCongViecModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGKeHoachCongViecModel): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: DmHangMucCongViecService.BASE_URL,
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

    static list(params): Promise<RestPagedDatatable<OGKeHoachCongViecModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: DmHangMucCongViecService.BASE_URL
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGKeHoachCongViecModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static update(data: OGKeHoachCongViecModel): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "PUT",
            url: DmHangMucCongViecService.BASE_URL,
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

export { DmHangMucCongViecService };