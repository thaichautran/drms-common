import axios, { AxiosResponse } from "axios";

import { OGUtils } from "../helpers/utils";
import { RestData } from "../models/base-response.model";
import { OGProblemReportModel } from "../models/problem-report.model";

class ProplemReportServince {
    static EXPORT: string = "/api/HoSo/problems-report/export";
    static LIST: string = "/api/HoSo/problems-report/list-data";

    static export(params): void {
        OGUtils.postDownload(ProplemReportServince.EXPORT, params, "application/json");
    }
    static list(params): Promise<OGProblemReportModel[]> {
        return axios({
            data: params,
            method: "POST",
            url: ProplemReportServince.LIST
        }).then(async (xhr: AxiosResponse<RestData<OGProblemReportModel[]>>) => {
            if (xhr.status === 200 && xhr.data) {
                return xhr.data.data;
            }
            return [];
        }).catch(e => {
            throw e;
        });
    }
}

export { ProplemReportServince };
