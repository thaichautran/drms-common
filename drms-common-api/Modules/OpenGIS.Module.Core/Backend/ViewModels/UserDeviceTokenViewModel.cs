using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace OpenGIS.Module.Core.ViewModels
{
    public class UserDeviceTokenViewModel
    {
        public string? user_id { get; set; }

        public string? token { get; set; }
        public string? full_name { get; set; }
    }
}