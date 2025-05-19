import 'package:flutter/material.dart';
import 'package:nylo_framework/nylo_framework.dart';
import 'package:vguider/bootstrap/helpers.dart';
import 'package:vguider/resources/themes/styles/spacing_styles.dart';

class MapAction extends StatelessWidget {
  Map<String, dynamic> child;
  MapAction({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: ThemeColor.get(context).buttonSecondaryBackground,
        borderRadius: BorderRadius.circular(SpacingStyles.borderRadiusMedium),
      ),
      padding: EdgeInsets.all(10),
      margin: EdgeInsets.only(bottom: 10),
      child: Icon(child['icon'], size: SpacingStyles.faIconSize),
    ).onTap(child['onTap']);
  }
}
