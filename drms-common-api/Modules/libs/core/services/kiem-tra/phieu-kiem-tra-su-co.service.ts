import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraSuCoModel } from "../../models/kiem-tra/phieu-kiem-tra-su-co.model";

class PhieuKiemTraSuCoService {
    static delete(data: OGPhieuGiamSatKiemTraSuCoModel): Promise<void> {
        return Axios.delete("/api/su-co/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraSuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa phiếu giám sát giao việc kiểm tra thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            }
        }).catch(e => {
            throw e;
        });
    }
    static get(id: number): Promise<OGPhieuGiamSatKiemTraSuCoModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/su-co/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraSuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(data: OGPhieuGiamSatKiemTraSuCoModel): Promise<OGPhieuGiamSatKiemTraSuCoModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/su-co/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraSuCoModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if (xhr.data.status === EnumStatus.OK) {
                    return xhr.data.data;
                }
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraSuCoModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/su-co/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraSuCoModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static notify(data: OGPhieuGiamSatKiemTraSuCoModel): Promise<RestBase> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/su-co/kiem-tra/notify"
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

export { PhieuKiemTraSuCoService };