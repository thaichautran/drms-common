import { OGLayerModel } from "./layer.model";
import { OGTableColumnModel, OGTableModel } from "./table.model";

interface OGSynthesisReportModel {
    created_at?: Date | string;
    created_by?: string;
    export_data_path?: string;
    export_excel_path?: string;
    filter_columns?: string;
    filter_params?: string;
    filterFields?: DuLieuTimKiem[];
    id: number;
    layer?: OGLayerModel;
    layer_id?: number;
    map_id?: number;
    report_name?: string;
    reportFields?: OGReportFieldModel[];
    visible_columns?: string;
}

interface OGReportFieldModel {
    column_id?: number;
    content_search?: string;
    id?: number;
    is_searchable?: boolean;
    is_showable?: boolean;
    report?: OGSynthesisReportModel;
    report_id?: number;
    table_mediate_name?: string;
    tableColumn?: OGTableColumnModel;
}
interface DuLieuTimKiem {
    baocao_id?: number;
    column_name?: string;
    id?: number;
    is_required?: boolean;
    name_vn?: string;
    table?: OGTableModel;
    table_name?: string;

}


export { DuLieuTimKiem, OGReportFieldModel, OGSynthesisReportModel };