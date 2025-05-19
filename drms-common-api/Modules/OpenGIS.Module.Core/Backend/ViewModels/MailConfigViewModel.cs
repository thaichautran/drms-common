using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace OpenGIS.Module.Core.ViewModels
{
    public class MailConfigViewModel
    {
        public string? smtp_server { get; set; }
        public string? smtp_port { get; set; }
        public string? smtp_user_name { get; set; }
        public string? smtp_password { get; set; }
    }
}