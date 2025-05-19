import Axios, { AxiosResponse } from "axios";

import { OGUtils } from "../../helpers/utils";
import { OGHoSoKiemTraModel } from "../../models/kiem-tra/kiem-tra.model";
import { OGPhieuGiamSatKiemTraCayXanhModel } from "../../models/kiem-tra/phieu-kiem-tra-cay-xanh.model";
import { OGPhieuGiamSatKiemTraChieuSangModel } from "../../models/kiem-tra/phieu-kiem-tra-chieu-sang.model";
import { OGPhieuGiamSatKiemTraThoatNuocModel } from "../../models/kiem-tra/phieu-kiem-tra-thoat-nuoc.model";

class KiemTraService {
    static uploadAnhMinhHoa(data: OGPhieuGiamSatKiemTraCayXanhModel | OGPhieuGiamSatKiemTraChieuSangModel | OGPhieuGiamSatKiemTraThoatNuocModel, loaikiemtra: string): Promise<void> {
        return new Promise(resolve => {
            const fileData = new FormData();
            fileData.append("phieugiamsat_id", data.id.toString());
            fileData.append("loaikiemtra", loaikiemtra);
            $.each(data.anhMinhHoas, (idx, anhMinhHoa) => {
                if (!anhMinhHoa.id) {
                    fileData.append("files", anhMinhHoa.file);
                }
            });
            if (fileData.get("files")) {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/kiem-tra/anh-minh-hoa/upload", true);
                xhr.responseType = "json";
                xhr.onload = function () {
                };
                xhr.onloadend = () => {
                    resolve();
                };
                xhr.send(fileData);
            } else {
                resolve();
            }
        });
    }

    static uploadHoSo(data: OGHoSoKiemTraModel): Promise<void> {
        return new Promise(resolve => {
            const formData = new FormData();
            console.log(data);
            const fileData = OGUtils.jsonToFormData(data);

            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/kiem-tra/ho-so/upload", true);
            xhr.responseType = "json";
            xhr.onload = function () {
            };
            xhr.onloadend = () => {
                delete data.file;
                resolve();
            };
            xhr.send(fileData);
        });
    }

    static uploadTraoDoi(data: OGPhieuGiamSatKiemTraCayXanhModel | OGPhieuGiamSatKiemTraChieuSangModel | OGPhieuGiamSatKiemTraThoatNuocModel, loaikiemtra: string): Promise<void> {
        return new Promise(resolve => {
            const fileData = new FormData();
            fileData.append("phieugiamsat_id", data.id.toString());
            fileData.append("loaikiemtra", loaikiemtra);
            $.each(data.thongTinTraoDois, (idx, thongTinTraoDoi) => {
                if (!thongTinTraoDoi.id) {
                    fileData.append("files", thongTinTraoDoi.file);
                }
            });
            if (fileData.get("files")) {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/api/kiem-tra/trao-doi/upload", true);
                xhr.responseType = "json";
                xhr.onload = function () {
                };
                xhr.onloadend = () => {
                    resolve();
                };
                xhr.send(fileData);
            } else {
                resolve();
            }
        });
    }
}

export { KiemTraService };