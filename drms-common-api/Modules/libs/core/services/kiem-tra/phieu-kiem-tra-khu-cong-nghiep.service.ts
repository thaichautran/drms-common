import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestBase, RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraKhuCongNghiepModel } from "../../models/kiem-tra/phieu-kiem-tra-khu-cong-nghiep.model";

class PhieuKiemTraKhuCongNghiepService {
    static delete(data: OGPhieuGiamSatKiemTraKhuCongNghiepModel): Promise<void> {
        return Axios.delete("/api/khu-cong-nghiep/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuCongNghiepModel>>) => {
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
    static get(id: number): Promise<OGPhieuGiamSatKiemTraKhuCongNghiepModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/khu-cong-nghiep/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuCongNghiepModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }
    static insert(data: OGPhieuGiamSatKiemTraKhuCongNghiepModel): Promise<OGPhieuGiamSatKiemTraKhuCongNghiepModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/khu-cong-nghiep/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuCongNghiepModel>>) => {
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
    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraKhuCongNghiepModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/khu-cong-nghiep/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraKhuCongNghiepModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }


    static notify(data: OGPhieuGiamSatKiemTraKhuCongNghiepModel, sendMail: boolean = false): Promise<RestBase> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/khu-cong-nghiep/kiem-tra/notify?sendMail=" + sendMail
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

export { PhieuKiemTraKhuCongNghiepService };