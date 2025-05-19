using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using VietGIS.Infrastructure.Models.DTO;

namespace OpenGIS.Module.Core.ViewModels
{
    public class CreateUserExtentDTO : CreateUserDTO
    {
        public bool SendSms { get; set; }
        public bool SendApp { get; set; }
        public bool SendMail { get; set; }
        public bool BypassApprove { get; set; }
        public string? DistrictId { get; set; }
    }
}