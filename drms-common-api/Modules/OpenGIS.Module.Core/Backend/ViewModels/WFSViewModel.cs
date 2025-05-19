using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using ProtoBuf;

namespace OpenGIS.Module.Core.ViewModels
{
    public class WFSViewModel
    {
        public string? type { get; set; }
        public object[]? features { get; set; }
    }
}