import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGKeHoachCongViecModel, OGKeHoachKiemTraModel } from "../../models/kiem-tra/ke-hoach-kiem-tra.model";


class KeHoachKiemTraService {
    static BASE_URL: string = "/api/kiem-tra/ke-hoach/";
    static KEHOACH_LIST: string = "/api/kiem-tra/ke-hoach/list-data";

    static delete(data: OGKeHoachKiemTraModel): Promise<void> {
        return Axios.delete(KeHoachKiemTraService.BASE_URL, {
            params: data
        }).then(async (xhr: AxiosResponse<RestData<OGKeHoachKiemTraModel>>) => {
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

    static get(id: number): Promise<OGKeHoachKiemTraModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`${KeHoachKiemTraService.BASE_URL}${id}`).then(async (xhr: AxiosResponse<RestData<OGKeHoachKiemTraModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGKeHoachKiemTraModel): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: KeHoachKiemTraService.BASE_URL,
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

    static list(params): Promise<RestPagedDatatable<OGKeHoachKiemTraModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            url: KeHoachKiemTraService.KEHOACH_LIST
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGKeHoachKiemTraModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static listCongViec(loaiKeHoach: string): Promise<OGKeHoachCongViecModel[]> {
        return Axios({
            method: "GET",
            params: {
                loaiKeHoach: loaiKeHoach,
            },
            url: KeHoachKiemTraService.BASE_URL + "list-congviec"
        }).then(async (xhr: AxiosResponse<RestData<OGKeHoachCongViecModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }

    static update(data: OGKeHoachKiemTraModel): Promise<RestBase> {
        return Axios({
            data: data,
            headers: {
                "Content-Type": "application/json"
            },
            method: "PUT",
            url: KeHoachKiemTraService.BASE_URL,
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

    static upload(formData: FormData): Promise<RestBase> {
        return Axios({
            data: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: KeHoachKiemTraService.BASE_URL + "upload",
        }).then(async (xhr: AxiosResponse<RestBase>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
        }).catch(e => {
            throw e;
        });
    }
}

export { KeHoachKiemTraService };