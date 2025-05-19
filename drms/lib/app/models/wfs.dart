class WFS {
  dynamic type;
  List<Features>? features;

  WFS({this.type, this.features});

  WFS.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    if (json['features'] != null) {
      features = <Features>[];
      json['features'].forEach((v) {
        features!.add(new Features.fromJson(v));
      });
    }
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    if (this.features != null) {
      data['features'] = this.features!.map((v) => v.toJson()).toList();
    }
    return data;
  }
}

class Features {
  dynamic? id;
  String? type;
  Geometry? geometry;
  Properties? properties;

  Features({this.id, this.type, this.geometry, this.properties});

  Features.fromJson(Map<String, dynamic> json) {
    id = json['id'];
    type = json['type'];
    geometry = json['geometry'] != null
        ? new Geometry.fromJson(json['geometry'])
        : null;
    properties = json['properties'] != null
        ? new Properties.fromJson(json['properties'])
        : null;
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['id'] = this.id;
    data['type'] = this.type;
    if (this.geometry != null) {
      data['geometry'] = this.geometry!.toJson();
    }
    if (this.properties != null) {
      data['properties'] = this.properties!.toJson();
    }
    return data;
  }
}

class Geometry {
  dynamic? type;
  dynamic? coordinates;

  Geometry({this.type, this.coordinates});

  Geometry.fromJson(Map<String, dynamic> json) {
    type = json['type'];
    coordinates = json['coordinates'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['type'] = this.type;
    data['coordinates'] = this.coordinates;
    return data;
  }
}

class Properties {
  dynamic? fid;
  int? objectid;
  dynamic label;
  int? layerId;
  String? layerName;
  String? classifyValue;

  Properties(
      {this.fid,
      this.objectid,
      this.label,
      this.layerId,
      this.layerName,
      this.classifyValue});

  Properties.fromJson(Map<String, dynamic> json) {
    fid = json['fid'];
    objectid = json['objectid'];
    label = json['label'];
    layerId = json['layer_id'];
    layerName = json['layer_name'];
    classifyValue = json['classify_value'];
  }

  Map<String, dynamic> toJson() {
    final Map<String, dynamic> data = new Map<String, dynamic>();
    data['fid'] = this.fid;
    data['objectid'] = this.objectid;
    data['label'] = this.label;
    data['layer_id'] = this.layerId;
    data['layer_name'] = this.layerName;
    data['classify_value'] = this.classifyValue;
    return data;
  }
}
