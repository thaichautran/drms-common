import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:dotted_border/dotted_border.dart';
import 'package:flutter_svg/svg.dart';

import 'package:vguider/app/models/layer.dart';
import 'package:vguider/app/utils/common_image_view.dart';

dynamic getIcon(Layer raw) {
  if (raw.layer != null) {
    String? geometry = raw.layer?.geometry;
    switch (geometry) {
      case "Point":
        if (raw.style != null) {
          if (raw.style!.contains("image")) {
            String icon = (jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]
                    ['image'] is Map)
                ? (jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['image']
                    ?['source'])
                : jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['image'];
            if (icon.contains('https://')) {
              return CommonImageView(
                url: icon,
                width: 20,
                height: 20,
              );
            }
            final startIndex = icon.indexOf('data:image');
            final endIndex = icon.length;
            final imageString = icon.substring(startIndex, endIndex);
            return imageString.contains('\r\n') ||
                    imageString.contains('/png') ||
                    imageString.contains('/jpg') ||
                    imageString.contains('/jpeg')
                ? Image.memory(
                    height: 20,
                    fit: BoxFit.contain,
                    base64Decode(
                        imageString.split(',')[1].replaceAll('\r\n', '')),
                  )
                : (imageString).contains('svg')
                    ? SvgPicture.memory(
                        height: 20,
                        fit: BoxFit.contain,
                        base64Decode((imageString).split(',')[1]))
                    : Image.memory(
                        height: 20,
                        fit: BoxFit.contain,
                        base64Decode((imageString).split(',')[1]),
                      );
          } else {
            dynamic styles = jsonDecode(raw.style!);

            num radius = styles['rules'][0]['symbolizers'][0]['radius'] != null
                ? styles['rules'][0]['symbolizers'][0]['radius']
                : 5;

            num diameter =
                (radius * styles['rules'][0]['symbolizers'][0]['strokeWidth']) +
                    4;

            return Container(
              width: diameter.toDouble(),
              height: diameter.toDouble(),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Color(int.parse(
                    '0xFF${(styles['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                border: Border.all(
                  color: Color(int.parse(
                      '0xFF${(styles['rules'][0]['symbolizers'][0]['strokeColor']).toString().substring(1)}')),
                  width: (styles['rules'][0]['symbolizers'][0]['strokeWidth']
                          as num)
                      .toDouble(),
                ),
              ),
            );
          }
        } else {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(
                color: Color(0xFF42579E),
                width: 4,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(50),
            ),
          );
        }

      case "LineString":
      case "MultiLineString":
        if (raw.style != null) {
          return !raw.style!.contains("dasharray")
              ? Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: jsonDecode(raw.style!)['rules'][0]['symbolizers']
                                  [0]['opacity'] !=
                              null
                          ? Color(int.parse('0xFF${(jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}'))
                              .withOpacity(double.parse(
                                  jsonDecode(raw.style!)['rules'][0]
                                          ['symbolizers'][0]['opacity']
                                      .toString()))
                          : Color(int.parse(
                              '0xFF${(jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                      width: double.parse(jsonDecode(raw.style!)['rules'][0]
                              ['symbolizers'][0]['width']
                          .toString()),
                      style: BorderStyle.solid,
                    ),
                  ),
                )
              : DottedBorder(
                  color: jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]
                              ['opacity'] !=
                          null
                      ? Color(int.parse('0xFF${(jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}'))
                          .withOpacity(double.parse(
                              jsonDecode(raw.style!)['rules'][0]['symbolizers']
                                      [0]['opacity']
                                  .toString()))
                      : Color(int.parse(
                          '0xFF${(jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                  strokeWidth: double.parse(jsonDecode(raw.style!)['rules'][0]
                          ['symbolizers'][0]['width']
                      .toString()),
                  radius: Radius.circular(10),
                  dashPattern: (jsonDecode(raw.style!)['rules'][0]
                          ['symbolizers'][0]['dasharray'] as List<dynamic>)
                      .map<double>((value) => value.toDouble())
                      .toList(),
                  customPath: (size) {
                    return Path()
                      ..moveTo(0, 10)
                      ..lineTo(size.width, 10);
                  },
                  child: Container(
                    margin: EdgeInsets.only(bottom: 18),
                  ),
                );
        } else {
          return Container(
            decoration: BoxDecoration(
              border: Border.all(
                color: Color(0xFFFFD559),
                width: 1,
                style: BorderStyle.solid,
              ),
            ),
          );
        }

      case "Polygon":
      case "MultiPolygon":
        if (raw.style != null) {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Color(int.parse(
                  '0xFF${(jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
              border: Border.all(
                color: Color(int.parse(
                    '0xFF${jsonDecode(raw.style!)['rules'][0]['symbolizers'][0]['outlineColor'].toString().substring(1)}')),
                width: double.parse(jsonDecode(raw.style!)['rules'][0]
                        ['symbolizers'][0]['outlineWidth']
                    .toString()),
              ),
            ),
          );
        } else {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Color(0xFFE5E5FF),
              border: Border.all(
                color: Color(0xFF0000FF),
                width: 1,
                style: BorderStyle.solid,
              ),
            ),
          );
        }

      default:
        return null;
    }
  } else {
    String? geometry = raw.geometry;
    switch (geometry) {
      case "Point":
        if (raw.styles != null) {
          if (raw.styles!.contains("image")) {
            String icon = (jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]
                    ['image'] is Map)
                ? (jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]
                    ['image']?['source'])
                : jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]
                    ['image'];
            if (icon.contains('https://')) {
              return CommonImageView(
                url: icon,
                width: 20,
                height: 20,
              );
            }
            final startIndex = icon.indexOf('data:image');
            final endIndex = icon.length;
            final imageString = icon.substring(startIndex, endIndex);

            return imageString.contains('\r\n') ||
                    imageString.contains('/png') ||
                    imageString.contains('/jpg') ||
                    imageString.contains('/jpeg')
                ? Image.memory(
                    height: 20,
                    fit: BoxFit.contain,
                    base64Decode(
                        imageString.split(',')[1].replaceAll('\r\n', '')),
                  )
                : (imageString).contains('svg')
                    ? SvgPicture.memory(
                        height: 20,
                        fit: BoxFit.contain,
                        base64Decode((imageString).split(',')[1]))
                    : Image.memory(
                        height: 20,
                        fit: BoxFit.contain,
                        base64Decode((imageString).split(',')[1]),
                      );
          } else {
            dynamic styles = jsonDecode(raw.styles!);

            num radius = styles['rules'][0]['symbolizers'][0]['radius'] != null
                ? styles['rules'][0]['symbolizers'][0]['radius']
                : 5;

            num diameter =
                (radius * styles['rules'][0]['symbolizers'][0]['strokeWidth']) +
                    4;

            return Container(
              width: diameter.toDouble(),
              height: diameter.toDouble(),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Color(int.parse(
                    '0xFF${(styles['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                border: Border.all(
                  color: Color(int.parse(
                      '0xFF${(styles['rules'][0]['symbolizers'][0]['strokeColor']).toString().substring(1)}')),
                  width: (styles['rules'][0]['symbolizers'][0]['strokeWidth']
                          as num)
                      .toDouble(),
                ),
              ),
            );
          }
        } else {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border.all(
                color: Color(0xFF42579E),
                width: 4,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(50),
            ),
          );
        }

      case "LineString":
      case "MultiLineString":
        if (raw.styles != null) {
          return !raw.styles!.contains("dasharray")
              ? Container(
                  decoration: BoxDecoration(
                    border: Border.all(
                      color: jsonDecode(raw.styles!)['rules'][0]['symbolizers']
                                  [0]['opacity'] !=
                              null
                          ? Color(int.parse('0xFF${(jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}'))
                              .withOpacity(double.parse(
                                  jsonDecode(raw.styles!)['rules'][0]
                                          ['symbolizers'][0]['opacity']
                                      .toString()))
                          : Color(int.parse(
                              '0xFF${(jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                      width: double.parse(jsonDecode(raw.styles!)['rules'][0]
                              ['symbolizers'][0]['width']
                          .toString()),
                      style: BorderStyle.solid,
                    ),
                  ),
                )
              : DottedBorder(
                  color: jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]
                              ['opacity'] !=
                          null
                      ? Color(int.parse('0xFF${(jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}'))
                          .withOpacity(double.parse(
                              jsonDecode(raw.styles!)['rules'][0]['symbolizers']
                                      [0]['opacity']
                                  .toString()))
                      : Color(int.parse(
                          '0xFF${(jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
                  strokeWidth: double.parse(jsonDecode(raw.styles!)['rules'][0]
                          ['symbolizers'][0]['width']
                      .toString()),
                  radius: Radius.circular(10),
                  dashPattern: (jsonDecode(raw.styles!)['rules'][0]
                          ['symbolizers'][0]['dasharray'] as List<dynamic>)
                      .map<double>((value) => value.toDouble())
                      .toList(),
                  customPath: (size) {
                    return Path()
                      ..moveTo(0, 10)
                      ..lineTo(size.width, 10);
                  },
                  child: Container(
                    margin: EdgeInsets.only(bottom: 18),
                  ),
                );
        } else {
          return Container(
            decoration: BoxDecoration(
              border: Border.all(
                color: Color(0xFFFFD559),
                width: 1,
                style: BorderStyle.solid,
              ),
            ),
          );
        }

      case "Polygon":
      case "MultiPolygon":
        if (raw.styles != null) {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Color(int.parse(
                  '0xFF${(jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['color']).toString().substring(1)}')),
              border: Border.all(
                color: Color(int.parse(
                    '0xFF${jsonDecode(raw.styles!)['rules'][0]['symbolizers'][0]['outlineColor'].toString().substring(1)}')),
                width: double.parse(jsonDecode(raw.styles!)['rules'][0]
                        ['symbolizers'][0]['outlineWidth']
                    .toString()),
              ),
            ),
          );
        } else {
          return Container(
            height: 20,
            decoration: BoxDecoration(
              color: Color(0xFFE5E5FF),
              border: Border.all(
                color: Color(0xFF0000FF),
                width: 1,
                style: BorderStyle.solid,
              ),
            ),
          );
        }

      default:
        return null;
    }
  }
}
