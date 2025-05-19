using System;

namespace OpenGIS.Module.Core.Helpers
{
    public class CoordinateHelper
    {
        public static readonly double ToleranceDistance = 0.0001;
        public static double GetDistance(double lat1, double lon1, double lat2, double lon2, bool isConvertMeter = false)
        {
            var R = 6371; // Radius of the earth in km
            var dLat = Deg2Rad(lat2 - lat1);  // deg2rad below
            var dLon = Deg2Rad(lon2 - lon1);
            var a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(Deg2Rad(lat1)) * Math.Cos(Deg2Rad(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            var d = R * c; // Distance in km
            if (isConvertMeter)
            {
                d = d / 1000;
            }
            return d;
        }

        public static double GetAngle(double x1, double y1, double x2, double y2)
        {
            double rad2deg = 180.0 / Math.PI;
            double dx = x2 - x1;
            double dy = y2 - y1;
            double angle = Math.Atan2(dy, dx) * rad2deg;
            if (angle < 0)
            {
                angle = angle + 360;
            }
            return angle;
        }

        public static double Deg2Rad(double deg)
        {
            return (deg * Math.PI / 180.0);
        }

        public static double Rad2Deg(double rad)
        {
            return (rad / Math.PI * 180.0);
        }
    }
}
