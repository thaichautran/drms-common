import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:checkable_treeview/checkable_treeview.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_map_marker_popup/flutter_map_marker_popup.dart';
import 'package:flutter_material_design_icons/flutter_material_design_icons.dart';
import 'package:latlong2/latlong.dart';
import 'package:nylo_framework/nylo_framework.dart';
import 'package:vguider/app/models/kich_ban.dart';
import 'package:vguider/app/models/layer.dart';
import 'package:vguider/app/models/route_segment.dart';
import 'package:vguider/app/models/tree_map_response.dart';
import 'package:vguider/app/models/wfs.dart';
import 'package:vguider/app/networking/map_api_service.dart';
import 'package:vguider/app/utils/icon.dart';
import 'package:vguider/app/utils/map_utils.dart';
import 'package:vguider/bootstrap/helpers.dart';
import '/app/controllers/direction_controller.dart';

class DirectionPage extends NyStatefulWidget<DirectionController> {
  static RouteView path = ("/direction", (_) => DirectionPage());

  DirectionPage({super.key}) : super(child: () => _DirectionPageState());
}

class _DirectionPageState extends NyState<DirectionPage> {
  /// [DirectionController] controller
  DirectionController get controller => widget.controller;
  MapApiService _mapApiService = MapApiService();
  Timer? _debounce;
  int? _mapId;
  MapModel? _mapModel;
  final _treeViewKey = GlobalKey<TreeViewState<String>>();
  GlobalKey<ScaffoldState> _scaffoldkey = new GlobalKey();
  List<List<List<LatLng>>> boundary = [];
  List<TreeMapLayerGroupResponse>? treeMapList;
  List<Map<String, dynamic>?> _treeMapData = [];
  final _mapController = MapController();
  List<Marker> _markers = [];
  List<Polyline> _listLine = [];
  List<Polygon> _listPolygon = [];
  List<dynamic> _allLayers = [];
  final Map<int, ParsedLayerStyle> _styleCache = {};
  final LayerHitNotifier hitNotifier = ValueNotifier(null);

  LatLng? _routeStart;
  LatLng? _routeEnd;
  List<RouteSegment> _routeSegments = [];
  Polyline? _routePolyline;
  bool _isChoosingStart = false;

  @override
  get init => () async {
        _mapId = widget.data();
        var res = await _mapApiService.getMapById(_mapId!);
        if (res != null) {
          _mapModel = res.data;
          boundary =
              MapUtils.parseMultiPolygonForFlutterMap(res.data?.boundary ?? "");
          treeMapList = (await _mapApiService.getTreeLayers(_mapId!)).data;
          if (treeMapList != null) {
            _treeMapData = treeMapList!
                .map((e) => e.toJson())
                .toList()
                .where((e) => e['type'] != "@tablegroup")
                .toList();
            _allLayers = _treeMapData
                .expand((group) => group?['raw']['layers'] as List)
                .toList();
          }
          WidgetsBinding.instance.addPostFrameCallback((_) async {
            if (_mapController != null) {
              _mapController.mapEventStream.listen((event) {
                var eventType = event.runtimeType;
                if (eventType == MapEventMoveStart) {
                } else if (eventType == MapEventMoveEnd ||
                    eventType == MapEventDoubleTapZoomEnd ||
                    eventType == MapEventScrollWheelZoom) {
                  _debounce?.cancel();

                  _debounce = Timer(const Duration(seconds: 1), () async {
                    await _loadWfsData();
                  });
                }
              });
            }
          });
        }
      };
  Color parseHexColor(String hexColor, {double opacity = 1.0}) {
    hexColor = hexColor.replaceFirst('#', '');
    if (hexColor.length == 6) hexColor = 'FF' + hexColor;
    return Color(int.parse(hexColor, radix: 16)).withOpacity(opacity);
  }

  ParsedLayerStyle getParsedLayerStyle(int layerId, List allLayers) {
    if (_styleCache.containsKey(layerId)) return _styleCache[layerId]!;

    final layer =
        allLayers.firstWhere((l) => l['id'] == layerId, orElse: () => null);
    if (layer == null || layer['styles'] == null) {
      final parsed = ParsedLayerStyle(styleJson: {});
      _styleCache[layerId] = parsed;
      return parsed;
    }

    final Map<String, dynamic> styleJson = json.decode(layer['styles']);
    final symbolizer = styleJson['rules']?[0]?['symbolizers']?[0];

    Uint8List? iconBytes;
    if (symbolizer?['kind'] == "Icon" &&
        symbolizer['image']?['source'] != null) {
      final src = symbolizer['image']['source'] as String;
      if (src.startsWith('data:image')) {
        final base64Str = src.split(',').last;
        iconBytes = base64Decode(base64Str);
      }
    }

    final parsed = ParsedLayerStyle(
      styleJson: styleJson,
      symbolizer: symbolizer,
      iconBytes: iconBytes,
    );

    _styleCache[layerId] = parsed;
    return parsed;
  }

  Map<String, dynamic> parseLayerStyle(int layerId, List allLayers) {
    final layer =
        allLayers.firstWhere((l) => l['id'] == layerId, orElse: () => null);
    if (layer == null) return {};
    final stylesJson = layer['styles'];
    if (stylesJson == null) return {};
    return json.decode(stylesJson);
  }

  List<Polygon> getPolygonsFromMultiPolygon(
      List<List<List<LatLng>>> multiPolygons) {
    List<Polygon> polygons = [];
    for (final polygon in multiPolygons) {
      // polygon: List<List<LatLng>>, [0] là ring ngoài, các ring sau là lỗ (hole)
      polygons.add(
        Polygon(
          points: polygon[0], // ring ngoài
          holePointsList: polygon.length > 1 ? polygon.sublist(1) : [],
          borderStrokeWidth: 2,
          borderColor: Colors.red,
        ),
      );
    }
    return polygons;
  }

  Future<void> _loadWfsData() async {
    var bounds = _mapController.camera.visibleBounds;
    var zoom = _mapController.camera.zoom;
    if (zoom < _mapModel!.minzoom!.toDouble() ||
        zoom > _mapModel!.maxzoom!.toDouble()) {
      return;
    }

    List<Features> wfsDataPoint = [];
    List<Features> wfsDataPolygon = [];
    List<Features> wfsDataLine = [];

    if (bounds != null && zoom != null) {
      final bbox = [
        bounds.southWest.longitude,
        bounds.southWest.latitude,
        bounds.northEast.longitude,
        bounds.northEast.latitude,
      ];
      var res = await _mapApiService.wfs(
          "",
          treeMapList != null
              ? treeMapList!
                  .expand((e) => (e.items ?? [])
                      .map(
                          (item) => (item.raw?.id is int) ? item.raw?.id : null)
                      .whereType<int>())
                  .toList()
              : [],
          "",
          zoom,
          bbox);

      wfsDataPoint = res.features
              ?.where((element) => element.geometry?.type == "Point")
              .toList() ??
          [];
      wfsDataPolygon = res.features
              ?.where((element) => element.geometry?.type == "Polygon")
              .toList() ??
          [];
      wfsDataLine = res.features
              ?.where((element) => element.geometry?.type == "LineString")
              .toList() ??
          [];

      _markers.clear();
      _listPolygon.clear();
      _listLine.clear();

      // MARKERS (Point)
      for (final feature in wfsDataPoint) {
        final layerId = feature.properties?.layerId ?? 0;
        final parsed = getParsedLayerStyle(layerId, _allLayers);
        final symbolizer = parsed.symbolizer;

        if (symbolizer?['kind'] == "Icon" && parsed.iconBytes != null) {
          final imageInfo = symbolizer?['image'];
          final size =
              (imageInfo?['size'] is List && imageInfo['size'].isNotEmpty)
                  ? 24.toDouble()
                  : 24.0;

          _markers.add(
            Marker(
              width: size,
              height: size,
              point: LatLng(feature.geometry?.coordinates[1],
                  feature.geometry?.coordinates[0]),
              child: Image.memory(
                parsed.iconBytes!,
                width: size,
                height: size,
              ),
            ),
          );
        } else {
          _markers.add(
            Marker(
              width: 24,
              height: 24,
              point: LatLng(feature.geometry?.coordinates[1],
                  feature.geometry?.coordinates[0]),
              child: Icon(Icons.location_on, color: Colors.red, size: 36),
            ),
          );
        }
      }

      // POLYGONS
      for (final feature in wfsDataPolygon) {
        final layerId = feature.properties?.layerId ?? 0;
        final parsed = getParsedLayerStyle(layerId, _allLayers);
        final symbolizer = parsed.symbolizer;

        Color fillColor = Colors.blue.withOpacity(0.3);
        Color borderColor = Colors.blue;
        double borderWidth = 2;

        if (symbolizer?['kind'] == "Fill") {
          fillColor = parseHexColor(symbolizer?['color'] ?? "#2196F3",
              opacity: (symbolizer?['fillOpacity'] ?? 1.0).toDouble());
          borderColor = parseHexColor(symbolizer?['outlineColor'] ?? "#2196F3",
              opacity: (symbolizer?['outlineOpacity'] ?? 1.0).toDouble());
          borderWidth = (symbolizer?['outlineWidth'] ?? 2).toDouble();
        }

        final coords = feature.geometry?.coordinates;
        if (coords is List && coords.isNotEmpty) {
          List<LatLng> polygonPoints = [];
          if (coords[0] is List) {
            for (final point in coords[0]) {
              if (point is List && point.length >= 2) {
                polygonPoints.add(LatLng(point[1], point[0]));
              }
            }
          }
          if (polygonPoints.isNotEmpty) {
            _listPolygon.add(
              Polygon(
                points: polygonPoints,
                color: fillColor,
                borderColor: borderColor,
                borderStrokeWidth: borderWidth,
              ),
            );
          }
        }
      }

      // LINES (LineString)
      for (final feature in wfsDataLine) {
        final layerId = feature.properties?.layerId ?? 0;
        final parsed = getParsedLayerStyle(layerId, _allLayers);
        final symbolizer = parsed.symbolizer;

        Color lineColor = Colors.green;
        double strokeWidth = 4;
        StrokeCap strokeCap = StrokeCap.round;

        if (symbolizer?['kind'] == "Line") {
          if (symbolizer?['color'] != null) {
            double opacity = (symbolizer?['opacity'] is num)
                ? symbolizer!['opacity'].toDouble()
                : 1.0;
            lineColor = parseHexColor(symbolizer!['color'], opacity: opacity);
          }
          if (symbolizer?['width'] != null) {
            strokeWidth = (symbolizer?['width'] is num)
                ? symbolizer!['width'].toDouble()
                : 4;
          }
          if (symbolizer?['cap'] == 'round')
            strokeCap = StrokeCap.round;
          else if (symbolizer?['cap'] == 'square') strokeCap = StrokeCap.square;
        }

        final coords = feature.geometry?.coordinates;
        if (coords is List) {
          List<LatLng> linePoints = [];
          for (final point in coords) {
            if (point is List && point.length >= 2) {
              linePoints.add(LatLng(point[1], point[0]));
            }
          }
          if (linePoints.isNotEmpty) {
            _listLine.add(
              Polyline(
                points: linePoints,
                color: lineColor,
                strokeWidth: strokeWidth,
                strokeCap: strokeCap,
              ),
            );
          }
        }
      }

      if (_routePolyline != null) {
        _listLine.add(_routePolyline!);
      }

      // Add marker xuất phát/đích nếu có
      if (_routeStart != null) {
        _markers.add(Marker(
            width: 40,
            height: 40,
            point: LatLng(_routeStart!.latitude, _routeStart!.longitude),
            child: Icon(Icons.circle, color: Colors.blueAccent, size: 20)));
      }
      if (_routeEnd != null) {
        _markers.add(
          Marker(
            width: 40,
            height: 40,
            point: LatLng(_routeEnd!.latitude, _routeEnd!.longitude),
            child: Icon(Icons.place, color: Colors.red, size: 38),
          ),
        );
      }

      setState(() {
        this._markers = _markers;
        this._listPolygon = _listPolygon;
        this._listLine = _listLine;
      });
    }
  }

  Future<void> _handleFindRoute(LatLng start, LatLng end) async {
    try {
      final segments = (await _mapApiService.getRouteSegments(start, end)).data;
      if (segments == null || segments.isEmpty) {
        return;
      }
      _routeSegments = segments;

      List<LatLng> routePoints = [];
      for (final segment in segments) {
        if (segment.encoded != null && segment.encoded!.isNotEmpty) {
          routePoints.addAll(decodePolyline(segment.encoded!));
          routePoints.insert(0, LatLng(start.latitude, start.longitude));
        } else {}
      }

      if (routePoints.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Không tìm thấy tuyến đường hợp lệ!")),
        );
      }

      _routePolyline = Polyline(
        points: routePoints,
        color: Colors.blue,
        strokeWidth: 7,
      );
      await _loadWfsData();
    } catch (e) {}
  }

  void _showRouteSelectionDialog(BuildContext context, LatLng tappedPoint) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_routeStart == null || _routeEnd != null)
              ListTile(
                leading: Icon(Icons.circle, color: Colors.blue),
                title: Text("Chọn làm điểm xuất phát"),
                onTap: () {
                  Navigator.pop(ctx);
                  setState(() {
                    _routeStart = tappedPoint;
                    _routeEnd = null;
                    _routePolyline = null;
                  });
                  _loadWfsData();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content: Text(
                            "Đã chọn điểm xuất phát, hãy chọn tiếp điểm đích!")),
                  );
                },
              ),
            if (_routeStart != null && _routeEnd == null)
              ListTile(
                leading: Icon(Icons.place, color: Colors.red),
                title: Text("Chỉ đường đến điểm này"),
                onTap: () async {
                  Navigator.pop(ctx);
                  setState(() {
                    _routeEnd = tappedPoint;
                  });

                  if (_routeStart != null && _routeEnd != null) {
                    await _handleFindRoute(_routeStart!, _routeEnd!);
                  }
                },
              ),
            ListTile(
              leading: Icon(Icons.close, color: Colors.grey),
              title: Text("Hủy"),
              onTap: () => Navigator.pop(ctx),
            ),
          ],
        ),
      ),
    );
  }

  // Hàm clear route
  void _clearRoute() {
    setState(() {
      _routeStart = null;
      _routeEnd = null;
      _routeSegments = [];
      _routePolyline = null;
    });
    _loadWfsData();
  }

  List<TreeNode<String>> _getTreeViewNodes(List<Map<String, dynamic>?> items) {
    if (items.isEmpty) return [];
    List<TreeNode<String>> nodes = [];

    for (var it in items) {
      TreeNode<String> node = TreeNode(
        isSelected: true,
        label: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Flexible(
              child: Container(
                width: 20,
                child: it?['raw'] != null
                    ? getIcon(Layer.fromJson(it?['raw']))
                    : Icon(MdiIcons.folder),
              ),
            ),
            SizedBox(
              width: 10,
            ),
            Flexible(
              child: Container(
                width: 200,
                child: Text(
                  it?['text'] ?? "",
                  softWrap: true,
                  maxLines: 2,
                  overflow: TextOverflow.visible,
                ),
              ),
            ),
          ],
        ),
        value: jsonEncode(it),
        children: _getTreeViewNodes(it?['items'] ?? []),
      );
      nodes.add(node);
    }

    return nodes;
  }

  @override
  Widget view(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          '${_mapModel?.name ?? "Kịch bản $_mapId!"}',
        ).setFontSize(16),
        centerTitle: true,
        backgroundColor: ThemeColor.get(context).appBarBackground,
        actions: [
          IconButton(
            icon: const Icon(Icons.menu),
            onPressed: () {
              _scaffoldkey.currentState?.openDrawer();
            },
          ),
          IconButton(
            icon: Icon(Icons.close),
            tooltip: "Xóa tìm đường",
            onPressed: () => _clearRoute(),
          )
        ],
      ),
      body: Scaffold(
        key: _scaffoldkey,
        drawer: Drawer(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.zero),
          width: MediaQuery.of(context).size.width * 0.85,
          child: Container(
            padding: const EdgeInsets.all(10),
            height: MediaQuery.of(context).size.height,
            child: TreeView<String>(
              initialExpandedLevels: 2,
              key: _treeViewKey,
              nodes: _getTreeViewNodes(_treeMapData),
              onSelectionChanged: (selectedValues) {},
            ),
          ),
        ),
        body: FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            onMapReady: () async {
              await _loadWfsData();
            },
            interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag),
            initialCenter: LatLng(
              double.tryParse(_mapModel?.center?.split(",")[1] ??
                      "16.531149390495493") ??
                  0,
              double.tryParse(_mapModel?.center?.split(",")[0] ??
                      " 107.61950880351564") ??
                  0,
            ),
            initialZoom: _mapModel?.defaultzoom?.toDouble() ?? 11,
            minZoom: _mapModel?.minzoom?.toDouble() ?? 8,
            maxZoom: _mapModel?.maxzoom?.toDouble() ?? 20,
            onLongPress: (tapPosition, point) {
              _showRouteSelectionDialog(
                  context, LatLng(point.latitude, point.longitude));
            },
          ),
          children: [
            TileLayer(
              urlTemplate:
                  'https://tile.openstreetmap.org/{z}/{x}/{y}.png', // For demonstration only
              userAgentPackageName: 'com.example.app',
            ),
            PolygonLayer(
              polygons: getPolygonsFromMultiPolygon(boundary),
            ),
            MouseRegion(
              hitTestBehavior: HitTestBehavior.deferToChild,
              cursor: SystemMouseCursors.click,
              child: GestureDetector(
                onTap: () {
                  final LayerHitResult? hitResult = hitNotifier.value;
                  if (hitResult == null) return;
                },
                child: PolygonLayer(
                  hitNotifier: hitNotifier,
                  polygons: _listPolygon,
                ),
              ),
            ),
            MouseRegion(
              hitTestBehavior: HitTestBehavior.deferToChild,
              cursor: SystemMouseCursors.click,
              child: GestureDetector(
                onTap: () {
                  final LayerHitResult? hitResult = hitNotifier.value;
                  if (hitResult == null) return;
                },
                child: PolylineLayer(
                  hitNotifier: hitNotifier,
                  polylines: _listLine,
                ),
              ),
            ),
            PopupMarkerLayer(
              options: PopupMarkerLayerOptions(
                markers: _markers,
                popupDisplayOptions: PopupDisplayOptions(
                  builder: (BuildContext context, Marker marker) => Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black26,
                          blurRadius: 4,
                          offset: Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        buildInfoRow('Tên cơ sở', 'Trạm y tế xã Hiệp Thành'),
                        buildInfoRow('Số phòng bệnh', '12'),
                        buildInfoRow('Số y bác sĩ', '20'),
                        buildInfoRow('Số người sơ tán', '80'),
                        buildInfoRow('Có hỗ trợ chống thiên tai?', 'Có'),
                        buildInfoRow('Có nhà vệ sinh?', 'Có'),
                        buildInfoRow('Có nước sạch?', 'Có'),
                        buildInfoRow('Tỉnh/TP', 'Tỉnh Bạc Liêu'),
                        buildInfoRow('Quận/Huyện', 'Thành phố Bạc Liêu'),
                        buildInfoRow('Xã/Phường', 'Xã Hiệp Thành'),
                      ],
                    ),
                  ),
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

Widget buildInfoRow(String title, String content) {
  return Container(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 3,
          child: Text(
            title,
            style: TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey[800],
            ),
          ),
        ),
        Expanded(
          flex: 5,
          child: Text(
            content,
            style: TextStyle(color: Colors.black87),
          ),
        ),
      ],
    ),
  );
}

class ParsedLayerStyle {
  final Map<String, dynamic> styleJson;
  final Map<String, dynamic>? symbolizer;
  final Uint8List? iconBytes;

  ParsedLayerStyle({
    required this.styleJson,
    this.symbolizer,
    this.iconBytes,
  });
}

List<LatLng> decodePolyline(String encoded) {
  List<LatLng> poly = [];
  int index = 0, len = encoded.length;
  int lat = 0, lng = 0;

  while (index < len) {
    int b, shift = 0, result = 0;
    do {
      b = encoded.codeUnitAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.codeUnitAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.add(LatLng(lat / 1E5, lng / 1E5));
  }
  return poly;
}
