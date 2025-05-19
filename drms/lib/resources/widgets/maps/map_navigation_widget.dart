import 'package:flutter/material.dart';
import 'package:nylo_framework/nylo_framework.dart';
import 'package:vguider/resources/themes/styles/spacing_styles.dart';

class MapNavigation extends StatelessWidget {
  List<Map<String, dynamic>> children;

  MapNavigation({super.key, required this.children});

  @override
  Widget build(BuildContext context) {
    return IntrinsicWidth(
      child: Column(
        children: List.generate(children.length, (index) {
          var padding = EdgeInsets.symmetric(vertical: 5, horizontal: 10);
          if (index == 0) {
            padding = EdgeInsets.fromLTRB(10, 10, 10, 5);
          } else if (index == children.length - 1) {
            padding = EdgeInsets.fromLTRB(10, 5, 10, 10);
          }
          return Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: padding,
                child: Icon(children[index]['icon'],
                    size: SpacingStyles.faIconSize),
              ).onTap(children[index]['onTap']),
              if (index < children.length - 1)
                Padding(
                  padding: EdgeInsets.symmetric(horizontal: 5),
                  child: Divider(
                    color: Colors.grey,
                    thickness: 0.5,
                  ),
                ),
            ],
          );
        }),
      ),
    );
  }
}
