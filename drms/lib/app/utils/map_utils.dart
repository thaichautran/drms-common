import 'dart:convert';
import 'package:latlong2/latlong.dart' as ll2;
import 'package:flutter/material.dart';
import 'package:location/location.dart';
import 'dart:math' as math;
import 'package:maplibre_gl/maplibre_gl.dart' as maplibre;
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:turf/turf.dart' as turf;

class MapUtils {
  static const apiKey = "AIzaSyC_4u_nMikpjXQRjLt4gvRV4qX8CB1Vypo";
  static const placeApiKey = "AIzaSyApx6cJJKAdj3-YNFCdxpsGfICqYgLazXM";
  static Future<LocationData> determinePosition() async {
    Location location = new Location();

    bool serviceEnabled;
    PermissionStatus permissionGranted;
    LocationData _locationData;

    // Test if location services are enabled.
    serviceEnabled = await Location.instance.serviceEnabled();
    if (!serviceEnabled) {
      serviceEnabled = await location.requestService();
      if (!serviceEnabled) {
        return Future.error('Location services are disabled.');
      }
    }

    permissionGranted = await location.hasPermission();
    if (permissionGranted == PermissionStatus.denied) {
      permissionGranted = await Location.instance.requestPermission();
      if (permissionGranted == PermissionStatus.denied) {
        // Permissions are denied, next time you could try
        // requesting permissions again (this is also where
        // Android's shouldShowRequestPermissionRationale
        // returned true. According to Android guidelines
        // your App should show an explanatory UI now.
        return Future.error('Location permissions are denied');
      }
    }

    if (permissionGranted == PermissionStatus.deniedForever) {
      // Permissions are denied forever, handle appropriately.
      return Future.error(
          'Location permissions are permanently denied, we cannot request permissions.');
    }

    _locationData = await location.getLocation();
    return _locationData;
  }

  static const String gisgo =
      // "https://tiles.gisgo.vn/styles/google/satellite/style.json";
      "https://api.maptiler.com/maps/streets-v2/style.json?key=30l5EEDWUBlkY6rP5WbM";

  static List<LatLng> polylineDecode(String polyline) {
    final codeUnits = polyline.codeUnits;
    final len = codeUnits.length;

    // For speed we preallocate to an upper bound on the final length, then
    // truncate the array before returning.
    final path = <LatLng>[];
    var index = 0;
    var lat = 0;
    var lng = 0;

    while (index < len) {
      var result = 1;
      var shift = 0;
      int b;
      do {
        b = codeUnits[index++] - 63 - 1;
        result += b << shift;
        shift += 5;
      } while (b >= 0x1f);
      lat += (result & 1 != 0) ? ~(result >> 1) : result >> 1;

      result = 1;
      shift = 0;
      do {
        b = codeUnits[index++] - 63 - 1;
        result += b << shift;
        shift += 5;
      } while (b >= 0x1f);
      lng += (result & 1 != 0) ? ~(result >> 1) : result >> 1;

      path.add(LatLng(lat * 1e-5, lng * 1e-5));
    }

    return path;
  }

  //snap to line
  static turf.Point toTurfPoint(maplibre.LatLng p) =>
      turf.Point(coordinates: turf.Position(p.longitude, p.latitude));

  static maplibre.LatLng snapToRoute(
    maplibre.LatLng rawLocation,
    List<maplibre.LatLng> routePoints,
  ) {
    // xây dựng LineString từ danh sách routePoints
    final line = turf.LineString(
      coordinates: routePoints
          .map((p) => turf.Position(p.longitude, p.latitude))
          .toList(),
    );

    // tìm điểm gần nhất
    final snapped = turf.nearestPointOnLine(
      line,
      toTurfPoint(rawLocation),
    );
    if (snapped.geometry != null) {
      final turf.Position coords = snapped.geometry!.coordinates;
      return maplibre.LatLng(coords.lat.toDouble(), coords.lng.toDouble());
    } else {
      throw Exception("Snapped geometry is null");
    }
  }

  static int findNearestIndex(
      maplibre.LatLng snapped, List<LatLng> routePoints) {
    double minDist = double.infinity;
    int idx = 0;
    for (int i = 0; i < routePoints.length; i++) {
      final p = routePoints[i];
      final d2 = math.pow(p.latitude - snapped.latitude, 2) +
          math.pow(p.longitude - snapped.longitude, 2);
      if (d2 < minDist) {
        minDist = d2.toDouble();
        idx = i;
      }
    }
    return idx;
  }

  static num routeBearing(maplibre.LatLng a, maplibre.LatLng b) {
    return turf.bearing(
      toTurfPoint(b),
      toTurfPoint(a),
    );
  }

  static List<List<List<ll2.LatLng>>> parseMultiPolygonForFlutterMap(
      String rawJson) {
    // Bước 1: Xử lý escape và cắt dấu " nếu có
    String cleaned = rawJson;
    if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
      cleaned = cleaned.substring(1, cleaned.length - 1);
    }
    cleaned = cleaned.replaceAll(r'\"', '"');

    // Parse JSON
    final geoJson = jsonDecode(cleaned);

    // Kiểm tra type
    if (geoJson['type'] != 'MultiPolygon') {
      throw Exception('GeoJSON không phải MultiPolygon');
    }

    List<List<List<ll2.LatLng>>> multiPolygons = [];

    // coordinates: List<List<List<List<double>>>>
    for (var polygon in geoJson['coordinates']) {
      // polygon: List<List<List<double>>> (nhiều ring)
      List<List<ll2.LatLng>> rings = [];
      for (var ring in polygon) {
        // ring: List<List<double>>
        rings.add(ring.map<ll2.LatLng>((c) => ll2.LatLng(c[1], c[0])).toList());
      }
      multiPolygons.add(rings);
    }

    return multiPolygons;
  }
}
