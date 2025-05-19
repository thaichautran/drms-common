using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Newtonsoft.Json;

namespace OpenGIS.Module.Core.Helpers
{
    public class TileHelper
    {
        public const int TILE_SIZE = 256;
        public const double EARTH_RADIUS = 6378137.0;
        public const double AbsLatMax = 85.0511;
        public const double AbsLngMax = 179.9999;
        public const double AbsMercatorXMax = 20037497.2108402;
        public const double AbsMercatorYMax = 19994875.2497959;

        public const double WorldMercMax3857 = 20037508.3427892;
        public const double WorldMercMin3857 = -1 * WorldMercMax3857;
        public const double WorldMerceSize3857 = WorldMercMax3857 - WorldMercMin3857;

        public static IDictionary<string, double> GetTileRect(long x, long y, int zoom)
        {
            var tilesAtThisZoom = 1 << zoom;
            var lngWidth = 360.0 / tilesAtThisZoom;
            double leftLong = -180.0 + (x * lngWidth);
            double rightLong = leftLong + lngWidth;

            var latHeightMerc = 1.0 / tilesAtThisZoom;
            var topLatMerc = y * latHeightMerc;
            var bottomLatMerc = topLatMerc + latHeightMerc;

            double bottomLat = (180.0 / Math.PI) * ((2.0 * Math.Atan(Math.Exp(Math.PI * (1.0 - (2.0 * bottomLatMerc))))) - (Math.PI / 2.0));
            double topLat = (180.0 / Math.PI) * ((2.0 * Math.Atan(Math.Exp(Math.PI * (1.0 - (2.0 * topLatMerc))))) - (Math.PI / 2.0));

            IDictionary<string, double> env = new Dictionary<string, double>();
            env.Add("xmin", leftLong);
            env.Add("xmax", rightLong);
            env.Add("ymin", bottomLat);
            env.Add("ymax", topLat);
            // Console.WriteLine("GetTileRect: " + JsonConvert.SerializeObject(env));
            return env;
        }

        public static IDictionary<string, double> getRect(long x, long y, long zoom)
        {
            var initialResolution = calculateResolution(0);
            var originShift = (initialResolution * TILE_SIZE) / 2.0;
            var pixres = initialResolution / Math.Pow(2, zoom);
            var tileGeoSize = TILE_SIZE * pixres;
            IDictionary<string, double> env = new Dictionary<string, double>();
            env.Add("xmin", -originShift + x * tileGeoSize);
            env.Add("xmax", -originShift + (x + 1) * tileGeoSize);
            env.Add("ymin", originShift - y * tileGeoSize);
            env.Add("ymax", originShift - (y + 1) * tileGeoSize);
            // Console.WriteLine("getRect: " + JsonConvert.SerializeObject(env));
            return env;
        }

        public static IDictionary<string, double> tileToEnvelope(long x, long y, int z)
        {
            double worldTileSize = Math.Pow(2, z);
            double tileMerceSize = WorldMerceSize3857 / worldTileSize;
            IDictionary<string, double> env = new Dictionary<string, double>();
            env.Add("xmin", WorldMercMin3857 + tileMerceSize * x);
            env.Add("xmax", WorldMercMin3857 + tileMerceSize * (x + 1));
            env.Add("ymin", WorldMercMax3857 - tileMerceSize * y);
            env.Add("ymax", WorldMercMax3857 - tileMerceSize * (y + 1));
            // Console.WriteLine("TileToEnvelope: " + JsonConvert.SerializeObject(env));
            return env;
        }

        private static double calculateResolution(int zoom)
        {
            return EARTH_RADIUS * 2.0 * Math.PI / 256.0 / Math.Pow(2.0, zoom);
        }
    }
}
