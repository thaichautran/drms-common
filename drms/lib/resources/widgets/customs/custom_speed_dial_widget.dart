import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:nylo_framework/nylo_framework.dart';
import 'package:flutter_speed_dial/flutter_speed_dial.dart';
import 'package:vguider/resources/themes/styles/spacing_styles.dart';

class CustomSpeedDial extends StatefulWidget {
  List<Map<String, dynamic>> children;
  Map<String, dynamic> child;
  Function? onDialOpen;
  CustomSpeedDial(
      {super.key,
      required this.children,
      required this.child,
      this.onDialOpen});

  @override
  createState() => _CustomSpeedDialState();
}

class _CustomSpeedDialState extends NyState<CustomSpeedDial> {
  var renderOverlay = true;
  var visible = true;
  var switchLabelPosition = false;
  var extend = false;
  var mini = true;
  var customDialRoot = true;
  var closeManually = false;
  var useRAnimation = true;
  var isDialOpen = ValueNotifier<bool>(false);
  var speedDialDirection = SpeedDialDirection.up;
  var buttonSize = const Size(40, 40);
  var childrenButtonSize = const Size(40, 40);

  @override
  get init => () {};

  @override
  Widget view(BuildContext context) {
    return SpeedDial(
      icon: widget.child['icon'],
      mini: true,
      openCloseDial: isDialOpen,
      childPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 5),
      spaceBetweenChildren: 4,

      dialRoot: customDialRoot
          ? (ctx, open, toggleChildren) {
              return open
                  ? Container(
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.4),
                        borderRadius: BorderRadius.circular(
                            SpacingStyles.borderRadiusCicular),
                      ),
                      padding: EdgeInsets.all(6),
                      margin: EdgeInsets.only(bottom: 10),
                      child: Icon(
                        FontAwesomeIcons.xmark,
                        color: Colors.white,
                        size: SpacingStyles.faIconSize,
                      ),
                    ).onTap(toggleChildren)
                  : Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(
                            SpacingStyles.borderRadiusMedium),
                      ),
                      padding: EdgeInsets.all(10),
                      margin: EdgeInsets.only(bottom: 10),
                      child: Icon(
                        widget.child['icon'],
                        size: SpacingStyles.faIconSize,
                      ),
                    ).onTap(toggleChildren);
            }
          : null,
      buttonSize:
          buttonSize, // it's the SpeedDial size which defaults to 56 itself
      // iconTheme: IconThemeData(size: 22),

      /// Transition Builder between label and activeLabel, defaults to FadeTransition.
      // labelTransitionBuilder: (widget, animation) => ScaleTransition(scale: animation,child: widget),
      /// The below button size defaults to 56 itself, its the SpeedDial childrens size
      childrenButtonSize: childrenButtonSize,
      closeDialOnPop: true,

      visible: visible,
      direction: speedDialDirection,
      switchLabelPosition: switchLabelPosition,

      /// If true user is forced to close dial manually
      closeManually: closeManually,

      /// If false, backgroundOverlay will not be rendered.
      renderOverlay: false,
      onOpen: () => widget.onDialOpen?.call(true),
      onClose: () => widget.onDialOpen?.call(false),
      useRotationAnimation: useRAnimation,
      tooltip: 'Open Speed Dial',
      heroTag: 'speed-dial-hero-tag',
      // foregroundColor: Colors.black,
      // backgroundColor: Colors.white,
      // activeForegroundColor: Colors.red,
      // activeBackgroundColor: Colors.blue,
      elevation: 8.0,
      animationCurve: Curves.bounceIn,
      isOpenOnStart: false,

      children: widget.children.map((child) {
        return SpeedDialChild(
          shape: CircleBorder(),
          child: Icon(child['icon'], size: SpacingStyles.iconDataIconSize),
          backgroundColor: Colors.white,
          onTap: child['onTap'],
          labelWidget: Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.4),
              borderRadius:
                  BorderRadius.circular(SpacingStyles.borderRadiusMedium),
            ),
            padding: EdgeInsets.all(8),
            child: Text(child['label'],
                style: TextStyle(color: Colors.white, fontSize: 12)),
          ),
        );
      }).toList(),
    );
  }
}
