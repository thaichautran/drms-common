import 'package:flutter/material.dart';
import 'dart:math';

class CustomProgressBar extends StatefulWidget {
  final double width;
  final Color planeColor;
  final Color smokeColor;
  final Duration duration;

  const CustomProgressBar({
    super.key,
    this.width = 300,
    this.planeColor = Colors.blue,
    this.smokeColor = Colors.grey,
    this.duration = const Duration(seconds: 3),
  });

  @override
  CustomeProgressBarState createState() => CustomeProgressBarState();
}

class CustomeProgressBarState extends State<CustomProgressBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _progress;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: widget.duration,
    )..repeat(reverse: false); // Tự động lặp lại

    _progress = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: AnimatedBuilder(
        animation: _progress,
        builder: (context, child) {
          double planeX = widget.width * _progress.value;

          return Stack(
            children: [
              // Khói máy bay (xuất hiện sau máy bay)
              Positioned(
                left: 0,
                top: 25,
                child: Container(
                  width: planeX, // Khói mở rộng theo progress
                  height: 8,
                  decoration: BoxDecoration(
                    color: widget.smokeColor.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),

              // Thanh tiến trình bên dưới
              Positioned(
                left: 0,
                top: 35,
                child: Container(
                  width: planeX, // Thanh tiến trình mở rộng theo máy bay
                  height: 6,
                  decoration: BoxDecoration(
                    color: widget.smokeColor,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),

              // Máy bay (đè lên trên progress)
              Positioned(
                left: planeX -
                    20, // Dịch sang trái một chút để máy bay nằm trên progress
                top: 15,
                child: Transform.rotate(
                  angle: pi / 2, // Xoay ngang máy bay (90 độ)
                  child: Icon(Icons.flight, size: 30, color: widget.planeColor),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
