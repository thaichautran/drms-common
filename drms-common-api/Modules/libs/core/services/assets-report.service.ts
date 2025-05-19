import axios, { AxiosResponse } from "axios";

import { OGUtils } from "../helpers/utils";
import { OGAssetsReportModel } from "../models/assets-report.model";
import { RestData } from "../models/base-response.model";

class AssetsReportServince {
    static EXPORT: string = "/api/assets-report/export";
    static LIST: string = "/api/assets-report/list-data";

    static export(params): void {
        OGUtils.postDownload(AssetsReportServince.EXPORT, params, "application/json");
    }
    static list(params): Promise<OGAssetsReportModel[]> {
        return axios({
            data: params,
            method: "POST",
            url: AssetsReportServince.LIST
        }).then(async (xhr: AxiosResponse<RestData<OGAssetsReportModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }
}

export { AssetsReportServince };
