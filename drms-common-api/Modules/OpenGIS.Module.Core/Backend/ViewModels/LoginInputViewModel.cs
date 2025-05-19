using System.Collections.Generic;
using VietGIS.Infrastructure.Identity.Providers;
using VietGIS.Infrastructure.Identity.ViewModels;

namespace OpenGIS.Module.Core.ViewModels
{
    public class LoginInputViewModel : LoginInputModel
    {
        public int accessFailedCount { get; set; }
        public string? tokenDevice { get; set; }
    }

    public class LoginViewModel : LoginInputViewModel
    {
        public bool allowRememberLogin { get; set; }
        public bool enableLocalLogin { get; set; }
        public IEnumerable<ExternalProvider>? externalProviders { get; set; }
        public IEnumerable<ExternalProvider>? visibleExternalProviders { get; }
        public bool isExternalLoginOnly { get; }
        public string? ExternalLoginScheme { get; }
    }

}