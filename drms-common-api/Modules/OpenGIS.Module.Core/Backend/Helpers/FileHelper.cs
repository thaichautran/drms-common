using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.Helpers
{
    public class FileHelper
    {
        public static readonly List<string> ImageExtensions = new List<string> { ".JPG", ".JPEG", ".JPE", ".BMP", ".GIF", ".PNG" };

        public static bool IsImage(string? fileName)
        {
            if (!string.IsNullOrWhiteSpace(fileName))
            {
                return ImageExtensions.Contains(Path.GetExtension(fileName).ToUpperInvariant());
            }
            return false;
        }
    }
}