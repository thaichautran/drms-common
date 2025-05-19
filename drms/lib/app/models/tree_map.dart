import 'package:nylo_framework/nylo_framework.dart';
import 'package:vguider/app/models/layer.dart';

class TreeMapLayerGroup {
  String? id;
  String? text;
  bool? expanded;
  String? icon;
  String? type;
  List<dynamic>? items;

  TreeMapLayerGroup(
      {this.id, this.text, this.expanded, this.icon, this.type, this.items});

  TreeMapLayerGroup.fromJson(Map<String, dynamic> json) {
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
    return data;
  }
}

class TreeMapTableGroup {
  String? id;
  String? text;
  bool? expanded;
  String? icon;
  String? type;
  List<TreeMapLayerGroup>? items;

  TreeMapTableGroup(
      {this.id, this.text, this.expanded, this.icon, this.type, this.items});

  TreeMapTableGroup.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    text = json['text'];
    expanded = json['expanded'];
    icon = json['icon'];
    type = json['type'];
    if (json['items'] != null) {
      items = <TreeMapLayerGroup>[];
      json['items'].forEach((v) {
        items!.add(new TreeMapLayerGroup.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['text'] = this.text;
    data['expanded'] = this.expanded;
    data['icon'] = this.icon;
    data['type'] = this.type;
    if (this.items != null) {
      data['items'] = this.items!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Items {
  String? id;
  String? text;
  List<Items>? items;
  Layer? raw;
  String? type;
  String? icon;
  bool? selected;

  Items({this.id, this.text, this.raw, this.type, this.icon, this.selected});

  Items.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    text = json['text'];
    if (json['items'] != null) {
      items = <Items>[];
      json['items'].forEach((v) {
        items!.add(new Items.fromJson(v));
      });
    }
    raw = json['raw'] != null ? new Layer.fromJson(json['raw']) : null;
    type = json['type'];
    icon = json['icon'];
    selected = json['selected'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['text'] = this.text;
    if (this.items != null) {
      data['items'] = this.items!.map((v) => v.toJson()).toList();
    }
    if (this.raw != null) {
      data['raw'] = this.raw!.toJson();
    }
    data['type'] = this.type;
    data['icon'] = this.icon;
    data['selected'] = this.selected;
    return data;
  }
}
