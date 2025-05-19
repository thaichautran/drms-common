import 'dart:ffi';

import 'package:vguider/app/models/base_model.dart';
import 'package:vguider/app/models/layer.dart';

class LayerResponse extends BaseModel<LayerResponse> {
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
  LayerGroup? layerGroup;
  Table? table;
  String? layerDomains;
  List<dynamic>? layerClassify;
  String? layerFiles;
  Map<String, dynamic>? dataDomains;
  LabelColumn? labelColumn;
  LabelColumn? classifyColumn;

  LayerResponse(
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
      this.layerGroup,
      this.table,
      this.layerDomains,
      this.layerClassify,
      this.layerFiles,
      this.dataDomains,
      this.labelColumn,
      this.classifyColumn});

  LayerResponse.fromJson(Map<String, dynamic> json) {
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
    layerGroup = json['layer_group'] != null
        ? new LayerGroup.fromJson(json['layer_group'])
        : null;
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
    return data;
  }

  @override
  LayerResponse fromJson(Map<String, dynamic> json) {
    return LayerResponse.fromJson(json);
  }
}
