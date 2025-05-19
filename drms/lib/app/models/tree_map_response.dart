import 'package:vguider/app/models/base_model.dart';
import 'package:vguider/app/models/layer.dart';
import 'package:vguider/app/models/tree_map.dart';

class TreeMapLayerGroupResponse extends BaseModel<TreeMapLayerGroupResponse> {
  String? id;
  String? text;
  bool? expanded;
  String? icon;
  String? type;
  List<dynamic>? items;
  Raw? raw;

  TreeMapLayerGroupResponse(
      {this.id,
      this.text,
      this.expanded,
      this.icon,
      this.type,
      this.items,
      this.raw});

  TreeMapLayerGroupResponse.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    text = json['text'];
    expanded = json['expanded'];
    icon = json['icon'];
    type = json['type'];
    if (json['items'] != null) {
      items = <dynamic>[];
      json['items'].forEach((v) {
        if (type == "@layergroup") {
          items!.add(Items.fromJson(v));
        } else {
          items!.add(TreeMapTableGroup.fromJson(v));
        }
      });
    }
    raw = json['raw'] != null ? Raw.fromJson(json['raw']) : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['text'] = this.text;
    data['expanded'] = this.expanded;
    data['icon'] = this.icon;
    data['type'] = this.type;
    if (this.items != null) {
      data['items'] = this.items!.map((v) {
        if (v is Items) {
          return v.toJson();
        } else if (v is TreeMapTableGroup) {
          return v.toJson();
        }
      }).toList();
    }
    if (this.raw != null) {
      data['raw'] = this.raw!.toJson();
    }
    return data;
  }

  @override
  TreeMapLayerGroupResponse fromJson(Map<String, dynamic> json) {
    return TreeMapLayerGroupResponse.fromJson(json);
  }
}

class Raw {
  int? id;
  String? nameEn;
  String? nameVn;
  dynamic? icon;
  int? order;
  String? tableSchema;
  List<Layer>? layers;
  List<dynamic>? tileLayers;
  dynamic? schemaInfo;

  Raw(
      {this.id,
      this.nameEn,
      this.nameVn,
      this.icon,
      this.order,
      this.tableSchema,
      this.layers,
      this.tileLayers,
      this.schemaInfo});

  Raw.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    nameEn = json['name_en'];
    nameVn = json['name_vn'];
    icon = json['icon'];
    order = json['order'];
    tableSchema = json['table_schema'];
    if (json['layers'] != null) {
      layers = <Layer>[];
      json['layers'].forEach((v) {
        layers!.add(new Layer.fromJson(v));
      });
    }
    if (json['tile_layers'] != null) {
      tileLayers = <Null>[];
      json['tile_layers'].forEach((v) {
        tileLayers!.add(v);
      });
    }
    schemaInfo = json['schema_info'];
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
    if (this.tileLayers != null) {
      data['tile_layers'] = this.tileLayers!.map((v) => v.toJson()).toList();
    }
    data['schema_info'] = this.schemaInfo;
    return data;
  }
}
