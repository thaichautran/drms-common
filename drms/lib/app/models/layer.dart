class Layer {
  int? id;
  int? layerGroupId;
  String? nameVn;
  String? geometry;
  bool? permanent;
  String? icon;
  String? styles;
  String? style;
  double? stylesAnchorX;
  double? stylesAnchorY;
  String? labelStyles;
  String? sldStyles;
  bool? showLineArrow;
  int? individualFeature;
  int? labelColumnId;
  int? classifyColumnId;
  bool? isVisible;
  bool? isLabelVisible;
  bool? hidden;
  int? order;
  String? layerType;
  String? params;
  String? url;
  int? dimension;
  int? tableInfoId;
  LayerGroup? layerGroup;
  Table? table;
  String? layerDomains;
  List<LayerClassify>? layerClassify;
  String? layerFiles;
  String? dataDomains;
  LabelColumn? labelColumn;
  LabelColumn? classifyColumn;
  Layer? layer;
  String? description;
  String? value;
  int? minZoom;
  int? maxZoom;
  String? layerName;
  Layer(
      {this.id,
      this.layerGroupId,
      this.nameVn,
      this.geometry,
      this.permanent,
      this.icon,
      this.style,
      this.styles,
      this.stylesAnchorX,
      this.stylesAnchorY,
      this.labelStyles,
      this.sldStyles,
      this.showLineArrow,
      this.individualFeature,
      this.labelColumnId,
      this.classifyColumnId,
      this.isVisible,
      this.isLabelVisible,
      this.hidden,
      this.order,
      this.layerType,
      this.params,
      this.url,
      this.dimension,
      this.tableInfoId,
      this.layerGroup,
      this.table,
      this.layerDomains,
      this.layerClassify,
      this.layerFiles,
      this.dataDomains,
      this.labelColumn,
      this.classifyColumn,
      this.layer,
      this.description,
      this.value,
      this.minZoom,
      this.maxZoom,
      this.layerName});

  Layer.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    layerGroupId = json['layer_group_id'];
    nameVn = json['name_vn'];
    geometry = json['geometry'];
    permanent = json['permanent'];
    icon = json['icon'];
    style = json['style'] != null ? json['style'] : null;
    styles = json['styles'];
    stylesAnchorX = json['styles_anchor_x'];
    stylesAnchorY = json['styles_anchor_y'];
    labelStyles = json['label_styles'];
    sldStyles = json['sld_styles'];
    showLineArrow = json['show_line_arrow'];
    individualFeature = json['individual_feature'];
    labelColumnId = json['label_column_id'];
    classifyColumnId = json['classify_column_id'];
    isVisible = json['is_visible'];
    isLabelVisible = json['is_label_visible'];
    hidden = json['hidden'];
    order = json['order'];
    layerType = json['layer_type'];
    params = json['params'];
    url = json['url'];
    dimension = json['dimension'];
    tableInfoId = json['table_info_id'];
    layerGroup = json['layer_group'] != null
        ? new LayerGroup.fromJson(json['layer_group'])
        : null;
    table = json['table'] != null ? new Table.fromJson(json['table']) : null;
    layerDomains = json['layer_domains'];
    layerClassify = json['layer_classify'] != null
        ? (json['layer_classify'] as List)
            .map((i) => LayerClassify.fromJson(i))
            .toList()
        : null;
    layerFiles = json['layer_files'];
    dataDomains = json['data_domains'];
    labelColumn = json['label_column'] != null
        ? new LabelColumn.fromJson(json['label_column'])
        : null;
    classifyColumn = json['classify_column'] != null
        ? new LabelColumn.fromJson(json['classify_column'])
        : null;
    layer = json['layer'] != null ? new Layer.fromJson(json['layer']) : null;
    description = json['description'];
    value = json['value'];
    minZoom = json['min_zoom'];
    maxZoom = json['max_zoom'];
    layerName = json['layer_name'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['layer_group_id'] = this.layerGroupId;
    data['name_vn'] = this.nameVn;
    data['geometry'] = this.geometry;
    data['permanent'] = this.permanent;
    data['icon'] = this.icon;
    if (this.style != null) {
      data['style'] = this.style;
    }
    data['styles'] = this.styles;
    data['styles_anchor_x'] = this.stylesAnchorX;
    data['styles_anchor_y'] = this.stylesAnchorY;
    data['label_styles'] = this.labelStyles;
    data['sld_styles'] = this.sldStyles;
    data['show_line_arrow'] = this.showLineArrow;
    data['individual_feature'] = this.individualFeature;
    data['label_column_id'] = this.labelColumnId;
    data['classify_column_id'] = this.classifyColumnId;
    data['is_visible'] = this.isVisible;
    data['is_label_visible'] = this.isLabelVisible;
    data['hidden'] = this.hidden;
    data['order'] = this.order;
    data['layer_type'] = this.layerType;
    data['params'] = this.params;
    data['url'] = this.url;
    data['dimension'] = this.dimension;
    data['table_info_id'] = this.tableInfoId;
    if (this.layerGroup != null) {
      data['layer_group'] = this.layerGroup!.toJson();
    }
    if (this.table != null) {
      data['table'] = this.table!.toJson();
    }
    data['layer_domains'] = this.layerDomains;
    data['layer_classify'] = this.layerClassify;
    data['layer_files'] = this.layerFiles;
    data['data_domains'] = this.dataDomains;
    if (this.labelColumn != null) {
      data['label_column'] = this.labelColumn!.toJson();
    }
    if (this.classifyColumn != null) {
      data['classify_column'] = this.classifyColumn!.toJson();
    }
    if (this.layer != null) {
      data['layer'] = this.layer!.toJson();
    }
    if (this.layerClassify != null) {
      data['layer_classify'] =
          this.layerClassify!.map((v) => v.toJson()).toList();
    }
    data['description'] = this.description;
    data['value'] = this.value;
    data['min_zoom'] = this.minZoom;
    data['max_zoom'] = this.maxZoom;
    data['layer_name'] = this.layerName;
    return data;
  }
}

class LayerGroup {
  int? id;
  String? nameEn;
  String? nameVn;
  String? icon;
  int? order;
  String? tableSchema;
  List<Layers>? layers;
  List<dynamic>? tileLayers;
  TableSchemaInfo? schemaInfo;

  LayerGroup(
      {this.id,
      this.nameEn,
      this.nameVn,
      this.icon,
      this.order,
      this.tableSchema,
      this.layers,
      this.tileLayers,
      this.schemaInfo});

  LayerGroup.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    icon = json['icon'];
    order = json['order'];
    tableSchema = json['table_schema'];
    if (json['layers'] != null) {
      layers = <Layers>[];
      json['layers'].forEach((v) {
        layers!.add(new Layers.fromJson(v));
      });
    }
    tileLayers = json['tile_layers'];
    schemaInfo = json['schema_info'] != null
        ? new TableSchemaInfo.fromJson(json['schema_info'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['name_en'] = this.nameEn;
    data['name_vn'] = this.nameVn;
    data['icon'] = this.icon;
    data['order'] = this.order;
    data['table_schema'] = this.tableSchema;
    if (this.layers != null) {
      data['layers'] = this.layers!.map((v) => v.toJson()).toList();
    }
    data['tile_layers'] = this.tileLayers;
    if (this.schemaInfo != null) {
      data['schema_info'] = this.schemaInfo!.toJson();
    }
    return data;
  }
}

class Layers {
  int? id;
  int? layerGroupId;
  String? nameVn;
  String? geometry;
  bool? permanent;
  String? icon;
  String? styles;
  double? stylesAnchorX;
  double? stylesAnchorY;
  String? labelStyles;
  String? sldStyles;
  bool? showLineArrow;
  int? individualFeature;
  int? labelColumnId;
  int? classifyColumnId;
  bool? isVisible;
  bool? isLabelVisible;
  bool? hidden;
  int? order;
  String? layerType;
  String? params;
  String? url;
  int? dimension;
  int? tableInfoId;
  Table? table;
  String? layerDomains;
  List<dynamic>? layerClassify;
  String? layerFiles;
  String? dataDomains;
  LabelColumn? labelColumn;
  LabelColumn? classifyColumn;

  Layers(
      {this.id,
      this.layerGroupId,
      this.nameVn,
      this.geometry,
      this.permanent,
      this.icon,
      this.styles,
      this.stylesAnchorX,
      this.stylesAnchorY,
      this.labelStyles,
      this.sldStyles,
      this.showLineArrow,
      this.individualFeature,
      this.labelColumnId,
      this.classifyColumnId,
      this.isVisible,
      this.isLabelVisible,
      this.hidden,
      this.order,
      this.layerType,
      this.params,
      this.url,
      this.dimension,
      this.tableInfoId,
      this.table,
      this.layerDomains,
      this.layerClassify,
      this.layerFiles,
      this.dataDomains,
      this.labelColumn,
      this.classifyColumn});

  Layers.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    layerGroupId = json['layer_group_id'];
    nameVn = json['name_vn'];
    geometry = json['geometry'];
    permanent = json['permanent'];
    icon = json['icon'];
    styles = json['styles'];
    stylesAnchorX = json['styles_anchor_x'];
    stylesAnchorY = json['styles_anchor_y'];
    labelStyles = json['label_styles'];
    sldStyles = json['sld_styles'];
    showLineArrow = json['show_line_arrow'];
    individualFeature = json['individual_feature'];
    labelColumnId = json['label_column_id'];
    classifyColumnId = json['classify_column_id'];
    isVisible = json['is_visible'];
    isLabelVisible = json['is_label_visible'];
    hidden = json['hidden'];
    order = json['order'];
    layerType = json['layer_type'];
    params = json['params'];
    url = json['url'];
    dimension = json['dimension'];
    tableInfoId = json['table_info_id'];
    table = json['table'] != null ? new Table.fromJson(json['table']) : null;
    layerDomains = json['layer_domains'];
    layerClassify = json['layer_classify'];
    layerFiles = json['layer_files'];
    dataDomains = json['data_domains'];
    labelColumn = json['label_column'] != null
        ? new LabelColumn.fromJson(json['label_column'])
        : null;
    classifyColumn = json['classify_column'] != null
        ? new LabelColumn.fromJson(json['classify_column'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['layer_group_id'] = this.layerGroupId;
    data['name_vn'] = this.nameVn;
    data['geometry'] = this.geometry;
    data['permanent'] = this.permanent;
    data['icon'] = this.icon;
    data['styles'] = this.styles;
    data['styles_anchor_x'] = this.stylesAnchorX;
    data['styles_anchor_y'] = this.stylesAnchorY;
    data['label_styles'] = this.labelStyles;
    data['sld_styles'] = this.sldStyles;
    data['show_line_arrow'] = this.showLineArrow;
    data['individual_feature'] = this.individualFeature;
    data['label_column_id'] = this.labelColumnId;
    data['classify_column_id'] = this.classifyColumnId;
    data['is_visible'] = this.isVisible;
    data['is_label_visible'] = this.isLabelVisible;
    data['hidden'] = this.hidden;
    data['order'] = this.order;
    data['layer_type'] = this.layerType;
    data['params'] = this.params;
    data['url'] = this.url;
    data['dimension'] = this.dimension;
    data['table_info_id'] = this.tableInfoId;
    if (this.table != null) {
      data['table'] = this.table!.toJson();
    }
    data['layer_domains'] = this.layerDomains;
    data['layer_classify'] = this.layerClassify;
    data['layer_files'] = this.layerFiles;
    data['data_domains'] = this.dataDomains;
    if (this.labelColumn != null) {
      data['label_column'] = this.labelColumn!.toJson();
    }
    if (this.classifyColumn != null) {
      data['classify_column'] = this.classifyColumn!.toJson();
    }
    return data;
  }
}

class Table {
  int? id;
  String? tableSchema;
  String? tableName;
  String? nameEn;
  String? nameVn;
  bool? permanent;
  int? order;
  int? tableGroupId;
  String? searchContent;
  TableSchemaInfo? tableSchemaInfo;
  List<Columns>? columns;
  Layer? layer;
  String? tableGroup;
  IdentityColumn? identityColumn;
  IdentityColumn? keyColumn;
  LabelColumn? labelColumn;

  Table(
      {this.id,
      this.tableSchema,
      this.tableName,
      this.nameEn,
      this.nameVn,
      this.permanent,
      this.order,
      this.tableGroupId,
      this.searchContent,
      this.tableSchemaInfo,
      this.columns,
      this.layer,
      this.tableGroup,
      this.identityColumn,
      this.keyColumn,
      this.labelColumn});

  Table.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    tableSchema = json['table_schema'];
    tableName = json['table_name'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    permanent = json['permanent'];
    order = json['order'];
    tableGroupId = json['table_group_id'];
    searchContent = json['search_content'];
    tableSchemaInfo = json['table_schema_info'] != null
        ? new TableSchemaInfo.fromJson(json['table_schema_info'])
        : null;
    if (json['columns'] != null) {
      columns = <Columns>[];
      json['columns'].forEach((v) {
        columns!.add(new Columns.fromJson(v));
      });
    }
    layer = json['layer'];
    tableGroup = json['table_group'];
    identityColumn = json['identity_column'] != null
        ? new IdentityColumn.fromJson(json['identity_column'])
        : null;
    keyColumn = json['key_column'] != null
        ? new IdentityColumn.fromJson(json['key_column'])
        : null;
    labelColumn = json['label_column'] != null
        ? new LabelColumn.fromJson(json['label_column'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['table_schema'] = this.tableSchema;
    data['table_name'] = this.tableName;
    data['name_en'] = this.nameEn;
    data['name_vn'] = this.nameVn;
    data['permanent'] = this.permanent;
    data['order'] = this.order;
    data['table_group_id'] = this.tableGroupId;
    data['search_content'] = this.searchContent;
    if (this.tableSchemaInfo != null) {
      data['table_schema_info'] = this.tableSchemaInfo!.toJson();
    }
    if (this.columns != null) {
      data['columns'] = this.columns!.map((v) => v.toJson()).toList();
    }
    data['layer'] = this.layer;
    data['table_group'] = this.tableGroup;
    if (this.identityColumn != null) {
      data['identity_column'] = this.identityColumn!.toJson();
    }
    if (this.keyColumn != null) {
      data['key_column'] = this.keyColumn!.toJson();
    }
    if (this.labelColumn != null) {
      data['label_column'] = this.labelColumn!.toJson();
    }
    return data;
  }
}

class TableSchemaInfo {
  String? schemaName;
  String? description;

  TableSchemaInfo({this.schemaName, this.description});

  TableSchemaInfo.fromJson(Map<String, dynamic> json) {
    schemaName = json['schema_name'];
    description = json['description'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['schema_name'] = this.schemaName;
    data['description'] = this.description;
    return data;
  }
}

class Columns {
  int? id;
  String? nameEn;
  String? nameVn;
  int? tableId;
  bool? require;
  String? columnName;
  String? dataType;
  int? characterMaxLength;
  bool? visible;
  bool? isIdentity;
  bool? isKey;
  bool? isLabel;
  bool? isNullable;
  bool? permanent;
  int? order;
  bool? hasCategory;
  bool? isSearchable;
  bool? readonly;
  int? lessColId;
  int? dataInRadiusOfLayer;
  int? lookupTableId;
  int? suggestionColumnId;
  bool? allowGroup;
  bool? summaryTotal;
  bool? summaryCount;
  bool? summaryPercent;
  String? formula;
  String? unit;
  String? tableRelation;

  Columns(
      {this.id,
      this.nameEn,
      this.nameVn,
      this.tableId,
      this.require,
      this.columnName,
      this.dataType,
      this.characterMaxLength,
      this.visible,
      this.isIdentity,
      this.isKey,
      this.isLabel,
      this.isNullable,
      this.permanent,
      this.order,
      this.hasCategory,
      this.isSearchable,
      this.readonly,
      this.lessColId,
      this.dataInRadiusOfLayer,
      this.lookupTableId,
      this.suggestionColumnId,
      this.allowGroup,
      this.summaryTotal,
      this.summaryCount,
      this.summaryPercent,
      this.formula,
      this.unit,
      this.tableRelation});

  Columns.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    tableId = json['table_id'];
    require = json['require'];
    columnName = json['column_name'];
    dataType = json['data_type'];
    characterMaxLength = json['character_max_length'];
    visible = json['visible'];
    isIdentity = json['is_identity'];
    isKey = json['is_key'];
    isLabel = json['is_label'];
    isNullable = json['is_nullable'];
    permanent = json['permanent'];
    order = json['order'];
    hasCategory = json['has_category'];
    isSearchable = json['is_searchable'];
    readonly = json['readonly'];
    lessColId = json['less_col_id'];
    dataInRadiusOfLayer = json['data_in_radius_of_layer'];
    lookupTableId = json['lookup_table_id'];
    suggestionColumnId = json['suggestion_column_id'];
    allowGroup = json['allow_group'];
    summaryTotal = json['summary_total'];
    summaryCount = json['summary_count'];
    summaryPercent = json['summary_percent'];
    formula = json['formula'];
    unit = json['unit'];
    tableRelation = json['table_relation'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['name_en'] = this.nameEn;
    data['name_vn'] = this.nameVn;
    data['table_id'] = this.tableId;
    data['require'] = this.require;
    data['column_name'] = this.columnName;
    data['data_type'] = this.dataType;
    data['character_max_length'] = this.characterMaxLength;
    data['visible'] = this.visible;
    data['is_identity'] = this.isIdentity;
    data['is_key'] = this.isKey;
    data['is_label'] = this.isLabel;
    data['is_nullable'] = this.isNullable;
    data['permanent'] = this.permanent;
    data['order'] = this.order;
    data['has_category'] = this.hasCategory;
    data['is_searchable'] = this.isSearchable;
    data['readonly'] = this.readonly;
    data['less_col_id'] = this.lessColId;
    data['data_in_radius_of_layer'] = this.dataInRadiusOfLayer;
    data['lookup_table_id'] = this.lookupTableId;
    data['suggestion_column_id'] = this.suggestionColumnId;
    data['allow_group'] = this.allowGroup;
    data['summary_total'] = this.summaryTotal;
    data['summary_count'] = this.summaryCount;
    data['summary_percent'] = this.summaryPercent;
    data['formula'] = this.formula;
    data['unit'] = this.unit;
    data['table_relation'] = this.tableRelation;
    return data;
  }
}

class IdentityColumn {
  int? id;
  String? nameEn;
  String? nameVn;
  int? tableId;
  bool? require;
  String? columnName;
  String? dataType;
  int? characterMaxLength;
  bool? visible;
  bool? isIdentity;
  bool? isKey;
  bool? isLabel;
  bool? isNullable;
  bool? permanent;
  int? order;
  bool? hasCategory;
  bool? isSearchable;
  bool? readonly;
  int? lessColId;
  int? dataInRadiusOfLayer;
  int? lookupTableId;
  int? suggestionColumnId;
  bool? allowGroup;
  bool? summaryTotal;
  bool? summaryCount;
  bool? summaryPercent;
  String? formula;
  String? unit;
  String? tableRelation;

  IdentityColumn(
      {this.id,
      this.nameEn,
      this.nameVn,
      this.tableId,
      this.require,
      this.columnName,
      this.dataType,
      this.characterMaxLength,
      this.visible,
      this.isIdentity,
      this.isKey,
      this.isLabel,
      this.isNullable,
      this.permanent,
      this.order,
      this.hasCategory,
      this.isSearchable,
      this.readonly,
      this.lessColId,
      this.dataInRadiusOfLayer,
      this.lookupTableId,
      this.suggestionColumnId,
      this.allowGroup,
      this.summaryTotal,
      this.summaryCount,
      this.summaryPercent,
      this.formula,
      this.unit,
      this.tableRelation});

  IdentityColumn.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    tableId = json['table_id'];
    require = json['require'];
    columnName = json['column_name'];
    dataType = json['data_type'];
    characterMaxLength = json['character_max_length'];
    visible = json['visible'];
    isIdentity = json['is_identity'];
    isKey = json['is_key'];
    isLabel = json['is_label'];
    isNullable = json['is_nullable'];
    permanent = json['permanent'];
    order = json['order'];
    hasCategory = json['has_category'];
    isSearchable = json['is_searchable'];
    readonly = json['readonly'];
    lessColId = json['less_col_id'];
    dataInRadiusOfLayer = json['data_in_radius_of_layer'];
    lookupTableId = json['lookup_table_id'];
    suggestionColumnId = json['suggestion_column_id'];
    allowGroup = json['allow_group'];
    summaryTotal = json['summary_total'];
    summaryCount = json['summary_count'];
    summaryPercent = json['summary_percent'];
    formula = json['formula'];
    unit = json['unit'];
    tableRelation = json['table_relation'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['name_en'] = this.nameEn;
    data['name_vn'] = this.nameVn;
    data['table_id'] = this.tableId;
    data['require'] = this.require;
    data['column_name'] = this.columnName;
    data['data_type'] = this.dataType;
    data['character_max_length'] = this.characterMaxLength;
    data['visible'] = this.visible;
    data['is_identity'] = this.isIdentity;
    data['is_key'] = this.isKey;
    data['is_label'] = this.isLabel;
    data['is_nullable'] = this.isNullable;
    data['permanent'] = this.permanent;
    data['order'] = this.order;
    data['has_category'] = this.hasCategory;
    data['is_searchable'] = this.isSearchable;
    data['readonly'] = this.readonly;
    data['less_col_id'] = this.lessColId;
    data['data_in_radius_of_layer'] = this.dataInRadiusOfLayer;
    data['lookup_table_id'] = this.lookupTableId;
    data['suggestion_column_id'] = this.suggestionColumnId;
    data['allow_group'] = this.allowGroup;
    data['summary_total'] = this.summaryTotal;
    data['summary_count'] = this.summaryCount;
    data['summary_percent'] = this.summaryPercent;
    data['formula'] = this.formula;
    data['unit'] = this.unit;
    data['table_relation'] = this.tableRelation;
    return data;
  }
}

class LabelColumn {
  int? id;
  String? nameEn;
  String? nameVn;
  int? tableId;
  bool? require;
  String? columnName;
  String? dataType;
  int? characterMaxLength;
  bool? visible;
  bool? isIdentity;
  bool? isKey;
  bool? isLabel;
  bool? isNullable;
  bool? permanent;
  int? order;
  bool? hasCategory;
  bool? isSearchable;
  bool? readonly;
  int? lessColId;
  int? dataInRadiusOfLayer;
  int? lookupTableId;
  int? suggestionColumnId;
  bool? allowGroup;
  bool? summaryTotal;
  bool? summaryCount;
  bool? summaryPercent;
  String? formula;
  String? unit;
  Table? table;
  String? tableRelation;

  LabelColumn(
      {this.id,
      this.nameEn,
      this.nameVn,
      this.tableId,
      this.require,
      this.columnName,
      this.dataType,
      this.characterMaxLength,
      this.visible,
      this.isIdentity,
      this.isKey,
      this.isLabel,
      this.isNullable,
      this.permanent,
      this.order,
      this.hasCategory,
      this.isSearchable,
      this.readonly,
      this.lessColId,
      this.dataInRadiusOfLayer,
      this.lookupTableId,
      this.suggestionColumnId,
      this.allowGroup,
      this.summaryTotal,
      this.summaryCount,
      this.summaryPercent,
      this.formula,
      this.unit,
      this.table,
      this.tableRelation});

  LabelColumn.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    tableId = json['table_id'];
    require = json['require'];
    columnName = json['column_name'];
    dataType = json['data_type'];
    characterMaxLength = json['character_max_length'];
    visible = json['visible'];
    isIdentity = json['is_identity'];
    isKey = json['is_key'];
    isLabel = json['is_label'];
    isNullable = json['is_nullable'];
    permanent = json['permanent'];
    order = json['order'];
    hasCategory = json['has_category'];
    isSearchable = json['is_searchable'];
    readonly = json['readonly'];
    lessColId = json['less_col_id'];
    dataInRadiusOfLayer = json['data_in_radius_of_layer'];
    lookupTableId = json['lookup_table_id'];
    suggestionColumnId = json['suggestion_column_id'];
    allowGroup = json['allow_group'];
    summaryTotal = json['summary_total'];
    summaryCount = json['summary_count'];
    summaryPercent = json['summary_percent'];
    formula = json['formula'];
    unit = json['unit'];
    table = json['table'] != null ? new Table.fromJson(json['table']) : null;
    tableRelation = json['table_relation'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['name_en'] = this.nameEn;
    data['name_vn'] = this.nameVn;
    data['table_id'] = this.tableId;
    data['require'] = this.require;
    data['column_name'] = this.columnName;
    data['data_type'] = this.dataType;
    data['character_max_length'] = this.characterMaxLength;
    data['visible'] = this.visible;
    data['is_identity'] = this.isIdentity;
    data['is_key'] = this.isKey;
    data['is_label'] = this.isLabel;
    data['is_nullable'] = this.isNullable;
    data['permanent'] = this.permanent;
    data['order'] = this.order;
    data['has_category'] = this.hasCategory;
    data['is_searchable'] = this.isSearchable;
    data['readonly'] = this.readonly;
    data['less_col_id'] = this.lessColId;
    data['data_in_radius_of_layer'] = this.dataInRadiusOfLayer;
    data['lookup_table_id'] = this.lookupTableId;
    data['suggestion_column_id'] = this.suggestionColumnId;
    data['allow_group'] = this.allowGroup;
    data['summary_total'] = this.summaryTotal;
    data['summary_count'] = this.summaryCount;
    data['summary_percent'] = this.summaryPercent;
    data['formula'] = this.formula;
    data['unit'] = this.unit;
    if (this.table != null) {
      data['table'] = this.table!.toJson();
    }
    data['table_relation'] = this.tableRelation;
    return data;
  }
}

class LayerClassify {
  int? id;
  int? layerId;
  int? tableColumnId;
  String? value;
  String? description;
  String? style;
  int? order;

  LayerClassify(
      {this.id,
      this.layerId,
      this.tableColumnId,
      this.value,
      this.description,
      this.style,
      this.order});

  LayerClassify.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    layerId = json['layer_id'];
    tableColumnId = json['table_column_id'];
    value = json['value'];
    description = json['description'];
    style = json['style'];
    order = json['order'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['layer_id'] = this.layerId;
    data['table_column_id'] = this.tableColumnId;
    data['value'] = this.value;
    data['description'] = this.description;
    data['style'] = this.style;
    data['order'] = this.order;
    return data;
  }
}
