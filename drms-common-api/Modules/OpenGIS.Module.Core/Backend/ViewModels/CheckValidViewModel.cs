namespace OpenGIS.Module.Core.ViewModels
{
    public class CheckValidViewModel
    {
        public bool? isValid { get; set; }
        public long? count { get; set; }
        public string key
        {
            get
            {
                if (isValid.HasValue && isValid.Value)
                {
                    return "Hợp lệ";
                }
                return "Không hợp lê";
            }
        }
    }
}