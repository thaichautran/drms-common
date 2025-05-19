import 'dart:math';
import 'package:flutter/material.dart';

class CustomLoading extends StatelessWidget {
  final double size;
  final Color color;

  const CustomLoading({super.key, this.size = 60, this.color = Colors.blue});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0, end: 1),
            duration: const Duration(seconds: 2),
            builder: (context, value, child) {
              return Transform.rotate(
                angle: value * 2 * pi,
                child: Icon(Icons.explore, size: size, color: color),
              );
            },
            onEnd: () => _repeatAnimation(context),
          ),
          for (int i = 0; i < 4; i++)
            TweenAnimationBuilder<double>(
              tween: Tween(begin: 0, end: 1),
              duration: const Duration(milliseconds: 1200),
              builder: (context, value, child) {
                double angle = (pi / 2) * i + (value * 2 * pi);
                double dx = cos(angle) * size * 0.5;
                double dy = sin(angle) * size * 0.5;
                return Positioned(
                  left: size / 2 + dx,
                  top: size / 2 + dy,
                  child: Container(
                    width: size * 0.1,
                    height: size * 0.1,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.6),
                      shape: BoxShape.circle,
                    ),
                  ),
                );
              },
              onEnd: () => _repeatAnimation(context),
            ),
        ],
      ),
    );
  }

  void _repeatAnimation(BuildContext context) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      (context as Element).markNeedsBuild();
    });
  }
}
