using System;
using System.Collections.Generic;
using System.Text;

namespace OpenGIS.Module.Core.Models.DTO.Request
{
    public class UserInfoParameter
    {
        public string sub { get; set; }
        public string email { get; set; }
        public string given_name { get; set; }
        public string phone_number { get; set; }
        public string address { get; set; }
    }
}
