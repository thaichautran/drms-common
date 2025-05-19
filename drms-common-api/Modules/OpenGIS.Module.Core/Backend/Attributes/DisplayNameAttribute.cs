using System;

namespace OpenGIS.Module.Core.Attributes
{
    [AttributeUsage(AttributeTargets.Field)]
    public class DisplayNameAttribute : Attribute
    {
        public string Name { get; set; }
        public DisplayNameAttribute(string name)
        {
            Name = name;
        }
    }
}
