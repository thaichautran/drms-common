using System;
using OpenGIS.Module.Core.Attributes;

namespace OpenGIS.Module.Core.Extensions
{
    public static class EnumExtensions
    {
        public static string GetDisplayName(this Enum enumValue)
        {
            var fieldInfo = enumValue.GetType().GetField(enumValue.ToString());
            if (fieldInfo == null)
            {
                return string.Empty;
            }

            var attributes = (DisplayNameAttribute[])fieldInfo.GetCustomAttributes(
                typeof(DisplayNameAttribute), false);

            return attributes.Length > 0 ? attributes[0].Name : enumValue.ToString();
        }
    }
}
