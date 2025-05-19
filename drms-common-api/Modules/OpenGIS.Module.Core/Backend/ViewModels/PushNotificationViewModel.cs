using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace OpenGIS.Module.Core.ViewModels
{
    public class PushNotificationViewModel
    {

        public string? content { get; set; }

        public List<string> devices { get; set; } = new List<string>();

        public List<string>? user_id { get; set; } = new List<string>();

        public string? type { get; set; }

        public string? title { get; set; }

        public string? data { get; set; }

        public string? appUrl { get; set; }
        public IList<TokenMessageIdViewModel>? tokenMessIds { get; set; }
    }

    public class TokenMessageIdViewModel
    {
        public string? token { get; set; }
        public int? messageId { get; set; }
    }
    public class HoSoNotifyViewModel
    {
        public string? userId { get; set; }
        public int? hoSoId { get; set; }
        public bool isSuccess { get; set; } = true;
    }
}