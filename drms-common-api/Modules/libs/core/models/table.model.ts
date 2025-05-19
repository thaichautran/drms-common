import { EnumDataType } from "../enums/enums";

interface OGTableSchemaModel {
    description?: string;
    schema_name: string;
}
interface CustomSchemaModel extends OGTableSchemaModel {
    is_active?: boolean;
    is_locked?: boolean;
}
interface OGTableModel {
    columns?: OGTableColumnModel[];
    count_records?: number;
    id: number;
    identity_column?: OGTableColumnModel;
    key_column?: OGTableColumnModel;
    label_column?: OGTableColumnModel;
    name_en?: string;
    name_vn?: string;
    order?: number;
    permanent?: boolean;
    schema_info?: OGTableSchemaModel;
    table_group_id?: number;
    table_name?: string;
    table_schema?: string;
    table_schema_info?: OGTableSchemaModel
}

interface OGTableColumnModel {
    character_max_length?: number;
    column_name?: string;
    data_in_radius_of_layer?: number;
    data_type?: EnumDataType;
    formula?: string;
    has_category?: boolean;
    id: number;
    is_identity?: boolean;
    is_key?: boolean;
    is_label?: boolean;
    is_nullable?: boolean;
    is_searchable?: boolean;
    less_col_id?: number;
    lookup_table_id?: number;
    name_en?: string;
    name_vn?: string;
    order?: number;
    permanent?: boolean;
    readonly?: boolean;
    require?: boolean;
    suggestion_column_id?: number;
    summary_count?: boolean;
    summary_percent?: boolean;
    summary_total?: boolean;
    table?: OGTableModel;
    table_id: number;
    table_relation?: null;
    type_data?: null;
    unit?: string;
    visible?: boolean;
}

interface OGTableRelationModel {
    extra_fields?: number;
    id: number;
    mediate_table?: OGTableModel;
    mediate_table_id?: number;
    relation_column?: OGTableColumnModel;
    relation_data?: number;
    relation_table: number;
    relation_table_column_id: number;
    relation_table_id: number;
    relation_type: number;
    table?: OGTableModel;
    table_column?: OGTableColumnModel;
    table_column_id: number;
    table_id: number;
}

export { CustomSchemaModel, OGTableColumnModel, OGTableModel, OGTableRelationModel, OGTableSchemaModel };