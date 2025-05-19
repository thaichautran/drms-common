import Axios, { AxiosResponse } from "axios";

import { EnumStatus } from "../../enums/enums";
import { OGUtils } from "../../helpers/utils";
import { RestData, RestPagedDatatable } from "../../models/base-response.model";
import { OGPhieuGiamSatKiemTraKhuDoThiModel } from "../../models/kiem-tra/phieu-kiem-tra-khu-do-thi.model";

class PhieuKiemTraKhuDoThiService {
    static delete(data: OGPhieuGiamSatKiemTraKhuDoThiModel): Promise<void> {
        return Axios.delete("/api/khu-do-thi/kiem-tra/" + data.id).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuDoThiModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status == EnumStatus.OK) {
                    OGUtils.alert("Xóa phiếu giám sát giao việc kiểm tra thành công!");
                } else {
                    OGUtils.error("Đã xảy ra lỗi, vui lòng kiểm tra lại!");
                }
            }
        }).catch(e => {
            throw e;
        });
    }

    static get(id: number): Promise<OGPhieuGiamSatKiemTraKhuDoThiModel> {
        if (id === 0) {
            return undefined;
        }
        return Axios.get(`/api/khu-do-thi/kiem-tra/${id}`).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuDoThiModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static insert(data: OGPhieuGiamSatKiemTraKhuDoThiModel): Promise<OGPhieuGiamSatKiemTraKhuDoThiModel> {
        return Axios({
            data: data,
            // headers: {
            //     "Content-Type": "application/x-www-form-urlencoded"
            // },
            method: "POST",
            url: "/api/khu-do-thi/kiem-tra/save"
        }).then(async (xhr: AxiosResponse<RestData<OGPhieuGiamSatKiemTraKhuDoThiModel>>) => {
            if (xhr.status === 200 && xhr.data) {
                if(xhr.data.status === EnumStatus.OK) {
                    return xhr.data.data;
                } 
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

    static list(params): Promise<RestPagedDatatable<OGPhieuGiamSatKiemTraKhuDoThiModel[]>> {
        return Axios({
            data: params,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            method: "POST",
            url: "/api/khu-do-thi/kiem-tra/list"
        }).then(async (xhr: AxiosResponse<RestPagedDatatable<OGPhieuGiamSatKiemTraKhuDoThiModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data;
            }
            return undefined;
        }).catch(e => {
            throw e;
        });
    }

}

export { PhieuKiemTraKhuDoThiService };